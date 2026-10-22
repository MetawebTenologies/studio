import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertDisposableTestDatabase,
  runMigrations,
  closePool,
} from '../packages/timecapsule/src/server/db.js';
import {
  createTenant,
} from '../packages/timecapsule/src/server/tenants.js';
import {
  resetStoreForTests,
  registerAsset,
  getAsset,
  listTenantUploads,
  softDeleteAsset,
} from '../packages/timecapsule/src/server/store.js';
import {
  PREVIEW_IDENTITY,
  issueTenantSessionToken,
} from '../packages/timecapsule/src/server/auth.js';
import {
  validateFileMagicBytes,
  POST as postUploadRoute,
  GET as getUploadsRoute,
} from '../app/api/v1/uploads/route.js';
import { DELETE as deleteUploadRoute } from '../app/api/v1/uploads/[assetId]/route.js';
import { getModelCapabilities } from '../packages/timecapsule/src/models/capabilities.js';
import {
  resolveCinemaPresets,
  buildNanoBananaPrompt,
  CAMERAS,
  LENSES,
} from '../packages/timecapsule/src/models/cinema.js';

test('Track F9: Server-side magic bytes validation rejects spoofed uploads', async () => {
  // Valid PNG header (8 bytes)
  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  assert.equal(validateFileMagicBytes(validPng, 'image/png'), true);

  // Valid JPEG header (3 bytes)
  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  assert.equal(validateFileMagicBytes(validJpeg, 'image/jpeg'), true);

  // Valid WebP header (RIFF....WEBP)
  const validWebp = Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.from([0x20, 0x00, 0x00, 0x00]),
    Buffer.from('WEBP'),
  ]);
  assert.equal(validateFileMagicBytes(validWebp, 'image/webp'), true);

  // Spoofed text file pretending to be image/png
  const fakePng = Buffer.from('<!DOCTYPE html><html><script>alert(1)</script></html>');
  assert.throws(
    () => validateFileMagicBytes(fakePng, 'image/png'),
    (err) => err.code === 'MAGIC_BYTE_MISMATCH'
  );

  // Spoofed binary pretending to be image/jpeg
  const fakeJpeg = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // DOS MZ header
  assert.throws(
    () => validateFileMagicBytes(fakeJpeg, 'image/jpeg'),
    (err) => err.code === 'MAGIC_BYTE_MISMATCH'
  );
});

test('Track F9: Upload registration, persistent listing, and soft delete lifecycle', async () => {
  assertDisposableTestDatabase();
  process.env.TIMECAPSULE_SESSION_SECRET = 'checkpoint3a-secret-value-at-least-32-bytes';
  process.env.TIMECAPSULE_TEST_MODE = '1';
  await runMigrations();
  await resetStoreForTests();

  const tenantA = 'tenant_alpha';
  const tenantB = 'tenant_beta';
  await createTenant({ tenantId: tenantA, slug: 'alpha-studio', name: 'Alpha Studio' });
  await createTenant({ tenantId: tenantB, slug: 'beta-studio', name: 'Beta Studio' });
  const tokenA = issueTenantSessionToken({ tenantId: tenantA, userId: 'user_a', role: 'admin' });
  const tokenB = issueTenantSessionToken({ tenantId: tenantB, userId: 'user_b', role: 'admin' });

  // 1. Upload valid PNG via POST /api/v1/uploads
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03]);
  const dataUrlA = `data:image/png;base64,${pngBytes.toString('base64')}`;

  const postReq = new Request('http://localhost:3000/api/v1/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Timecapsule-CSRF': '1',
      cookie: `tc_session=${tokenA}`,
    },
    body: JSON.stringify({
      dataUrl: dataUrlA,
      contentType: 'image/png',
      filename: 'portrait_ref_1.png',
    }),
  });

  const postRes = await postUploadRoute(postReq);
  const postData = await postRes.json();
  assert.equal(postRes.status, 200, `Expected 200, got ${postRes.status}: ${JSON.stringify(postData)}`);
  assert.equal(postData.ok, true);
  assert.ok(postData.asset_id);
  const assetIdA = postData.asset_id;

  // 2. Reject spoofed file upload with HTTP 415
  const spoofedReq = new Request('http://localhost:3000/api/v1/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Timecapsule-CSRF': '1',
      cookie: `tc_session=${tokenA}`,
    },
    body: JSON.stringify({
      dataUrl: `data:image/png;base64,${Buffer.from('not a real png header at all').toString('base64')}`,
      contentType: 'image/png',
      filename: 'evil.png',
    }),
  });

  const spoofedRes = await postUploadRoute(spoofedReq);
  assert.equal(spoofedRes.status, 415);
  const spoofedData = await spoofedRes.json();
  assert.equal(spoofedData.code, 'MAGIC_BYTE_MISMATCH');

  // 3. List uploads for Tenant A via GET /api/v1/uploads
  const listReqA = new Request('http://localhost:3000/api/v1/uploads', {
    method: 'GET',
    headers: {
      cookie: `tc_session=${tokenA}`,
    },
  });
  const listResA = await getUploadsRoute(listReqA);
  assert.equal(listResA.status, 200);
  const listDataA = await listResA.json();
  assert.equal(listDataA.ok, true);
  assert.equal(listDataA.tenant_id, tenantA);
  assert.ok(listDataA.uploads.some((u) => u.asset_id === assetIdA));

  // 4. Cross-tenant isolation: Tenant B sees 0 uploads from Tenant A
  const listReqB = new Request('http://localhost:3000/api/v1/uploads', {
    method: 'GET',
    headers: {
      cookie: `tc_session=${tokenB}`,
    },
  });
  const listResB = await getUploadsRoute(listReqB);
  assert.equal(listResB.status, 200);
  const listDataB = await listResB.json();
  assert.equal(listDataB.ok, true);
  assert.equal(listDataB.tenant_id, tenantB);
  assert.equal(listDataB.uploads.length, 0);

  // 5. Cross-tenant soft-delete prevention: Tenant B cannot soft delete Tenant A's asset
  const crossDelReq = new Request(`http://localhost:3000/api/v1/uploads/${assetIdA}`, {
    method: 'DELETE',
    headers: {
      'X-Timecapsule-CSRF': '1',
      cookie: `tc_session=${tokenB}`,
    },
  });
  const crossDelRes = await deleteUploadRoute(crossDelReq, { params: Promise.resolve({ assetId: assetIdA }) });
  assert.equal(crossDelRes.status, 404, 'Cross-tenant soft delete must return 404');

  // 6. Tenant A soft-deletes their asset
  const delReqA = new Request(`http://localhost:3000/api/v1/uploads/${assetIdA}`, {
    method: 'DELETE',
    headers: {
      'X-Timecapsule-CSRF': '1',
      cookie: `tc_session=${tokenA}`,
    },
  });
  const delResA = await deleteUploadRoute(delReqA, { params: Promise.resolve({ assetId: assetIdA }) });
  assert.equal(delResA.status, 200);
  const delDataA = await delResA.json();
  assert.equal(delDataA.ok, true);
  assert.equal(delDataA.deleted, true);

  // 7. Verify asset is excluded from subsequent GET /api/v1/uploads
  const listAfterDel = await getUploadsRoute(listReqA);
  const listAfterData = await listAfterDel.json();
  assert.equal(listAfterData.uploads.some((u) => u.asset_id === assetIdA), false);

  // 8. Verify asset still exists in DB with deleted_at set (audit retention)
  const dbAsset = await getAsset(assetIdA, { includeDeleted: true });
  assert.ok(dbAsset);
  assert.ok(dbAsset.deleted_at);
});

test('Track F9: Shared model capabilities schema resolver', async () => {
  // Verified release model (T2I)
  const capImage = getModelCapabilities('nano-banana-pro');
  assert.ok(capImage);
  assert.equal(capImage.id, 'nano-banana-pro');
  assert.equal(capImage.modality, 'image');
  assert.equal(capImage.enabled, true);
  assert.ok(capImage.allowed_aspect_ratios.includes('16:9'));
  assert.ok(capImage.allowed_resolutions.includes('1k'));
  assert.equal(capImage.supports_reference_images, false);

  // Verified release model (I2I reference support)
  const capI2I = getModelCapabilities('nano-banana-pro-edit');
  assert.ok(capI2I);
  assert.equal(capI2I.modality, 'i2i');
  assert.equal(capI2I.enabled, true);
  assert.equal(capI2I.supports_reference_images, true);
  assert.equal(capI2I.max_reference_images, 4);

  // Verified release model (Video with duration)
  const capVideo = getModelCapabilities('seedance-pro-t2v');
  assert.ok(capVideo);
  assert.equal(capVideo.modality, 'video');
  assert.equal(capVideo.enabled, true);
  assert.ok(capVideo.allowed_durations.includes(5));

  // Catalog-only unverified model (fail-closed)
  const capUnverified = getModelCapabilities('seedream-5.0');
  assert.ok(capUnverified);
  assert.equal(capUnverified.enabled, false);
  assert.equal(capUnverified.verification_status, 'catalog_only');
  assert.ok(capUnverified.disabled_reason.length > 0);
});

test('Track F10: Cinema presets data-driven configuration and tenant override', async () => {
  const basePresets = resolveCinemaPresets();

  // Verify baseline cameras and lenses
  assert.ok(basePresets.CAMERAS.includes('Modular 8K Digital'));
  assert.ok(basePresets.CAMERAS.includes('Grand Format 70mm Film'));
  assert.ok(basePresets.LENSES.includes('Compact Anamorphic'));
  assert.ok(basePresets.LENSES.includes('70s Cinema Prime'));
  assert.ok(basePresets.FOCAL_LENGTHS.includes(35));
  assert.ok(basePresets.APERTURES.includes('f/1.4'));

  // Test prompt compilation
  const prompt = buildNanoBananaPrompt(
    'Hero protagonist standing in rain',
    'Modular 8K Digital',
    'Compact Anamorphic',
    35,
    'f/1.4',
    basePresets
  );
  assert.ok(prompt.includes('shot on a modular 8K digital cinema camera'));
  assert.ok(prompt.includes('using a compact anamorphic lens at 35mm'));
  assert.ok(prompt.includes('aperture f/1.4'));

  // Test tenant-level branding preset overrides
  const customPresets = resolveCinemaPresets({
    cameras: [
      { id: 'custom-imax', name: 'Custom IMAX 65mm', prompt: 'custom 65mm IMAX camera', preview: '/custom.webp' }
    ]
  });
  assert.equal(customPresets.CAMERAS.length, 1);
  assert.equal(customPresets.CAMERAS[0], 'Custom IMAX 65mm');
  const customPrompt = buildNanoBananaPrompt(
    'Desert landscape',
    'Custom IMAX 65mm',
    'Compact Anamorphic',
    35,
    'f/1.4',
    customPresets
  );
  assert.ok(customPrompt.includes('shot on a custom 65mm IMAX camera'));
});
