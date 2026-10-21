import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { TIMECAPSULE_BRAND } from '../packages/timecapsule/src/branding.js';
import * as tcModels from '../packages/timecapsule/src/models/index.js';
import * as studioModels from '../packages/studio/src/models.js';
import * as viteModels from '../src/lib/models.js';
import * as tcClient from '../packages/timecapsule/src/client/index.js';
import * as studioClient from '../packages/studio/src/kie.js';
import * as viteClient from '../src/lib/kie.js';

import {
  query,
  closePool,
  seedDevelopmentTenant,
  assertDisposableTestDatabase,
} from '../packages/timecapsule/src/server/db.js';
import {
  resetStoreForTests,
  getTenantCredits,
  getJob,
  listJobs,
  getJobEventsAfter,
  getTenantLedger,
  getCreditReservation,
  registerAsset,
  createSubmissionTransaction,
  claimNextRunnableJob,
  completeJobSuccess,
  completeJobFailure,
  reconcileAmbiguousJob,
} from '../packages/timecapsule/src/server/store.js';
import {
  normalizeAndFingerprintGenerationRequest,
  canonicalizeValue,
} from '../packages/timecapsule/src/server/fingerprint.js';
import {
  PREVIEW_IDENTITY,
  issuePreviewSessionToken,
  issueSessionTokenForTest,
  verifySessionToken,
} from '../packages/timecapsule/src/server/auth.js';
import {
  registerProviderAdapter,
  resetProviderAdapters,
} from '../packages/timecapsule/src/server/providers.js';
import { submitGenerationJob } from '../packages/timecapsule/src/server/orchestrator.js';
import { createDurableWorker } from '../packages/timecapsule/src/worker/index.js';
import { validateExternalMediaUrl } from '../packages/timecapsule/src/server/media.js';
import { GET as getSessionRoute, POST as postSessionRoute } from '../app/api/v1/session/route.js';
import { GET as getGenerationsRoute, POST as postGenerationsRoute } from '../app/api/v1/generations/route.js';
import { GET as getSseEvents } from '../app/api/v1/generations/[jobId]/events/route.js';
import { GET as getAssetRoute } from '../app/api/v1/assets/[assetId]/route.js';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/timecapsule_test';
process.env.DATABASE_URL = TEST_DB_URL;
process.env.TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB = '1';

function withTestEnv(envOverrides, fn) {
  const previous = {};
  for (const [k, v] of Object.entries(envOverrides)) {
    previous[k] = process.env[k];
    if (v === undefined || v === null) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
  const restore = () => {
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  };
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.finally(restore);
    }
    restore();
    return result;
  } catch (err) {
    restore();
    throw err;
  }
}

/**
 * Starts a local fake Kie HTTP provider server on 127.0.0.1:0.
 * Allows tests to inspect exact createTask and recordInfo calls over real HTTP.
 */
async function startFakeKieProviderServer(handlerOptions = {}) {
  const createTaskRequests = [];
  const recordInfoRequests = [];
  let taskCounter = 0;
  const tasks = new Map();

  const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url, 'http://127.0.0.1');
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk.toString();
    });
    req.on('end', async () => {
      try {
        if (req.method === 'POST' && urlObj.pathname === '/api/v1/jobs/createTask') {
          const parsed = rawBody ? JSON.parse(rawBody) : {};
          createTaskRequests.push({
            headers: req.headers,
            body: parsed,
          });

          if (handlerOptions.onCreateTask) {
            const custom = await handlerOptions.onCreateTask(parsed, req, res, {
              createTaskRequests,
              tasks,
            });
            if (custom !== undefined) {
              return;
            }
          }

          taskCounter += 1;
          const taskId = `fake_kie_task_${taskCounter}`;
          tasks.set(taskId, {
            taskId,
            polls: 0,
            requestBody: parsed,
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ code: 200, data: { taskId } }));
          return;
        }

        if (req.method === 'GET' && urlObj.pathname === '/api/v1/jobs/recordInfo') {
          const taskId = urlObj.searchParams.get('taskId');
          recordInfoRequests.push({
            taskId,
            headers: req.headers,
          });

          if (handlerOptions.onRecordInfo) {
            const custom = await handlerOptions.onRecordInfo(taskId, req, res, {
              recordInfoRequests,
              tasks,
            });
            if (custom !== undefined) {
              return;
            }
          }

          const entry = tasks.get(taskId) || { taskId, polls: 0 };
          entry.polls += 1;
          tasks.set(taskId, entry);

          const requiredPolls = handlerOptions.pollsBeforeSuccess || 1;
          if (entry.polls < requiredPolls) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                code: 200,
                data: {
                  state: 'generating',
                  progress: 50,
                },
              })
            );
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              code: 200,
              data: {
                state: 'success',
                resultJson: JSON.stringify({
                  resultUrls: [
                    handlerOptions.resultUrl ||
                      `https://cdn.timecapsule.studio/outputs/${taskId}.mp4`,
                  ],
                }),
              },
            })
          );
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    createTaskRequests,
    recordInfoRequests,
    tasks,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// ─── Track A & Checkpoint 1 Regression Suite ────────────────────────────────

test('Track A: Branding and UI shells are rebranded to Timecapsule', () => {
  assert.equal(TIMECAPSULE_BRAND.name, 'Timecapsule');
  assert.equal(TIMECAPSULE_BRAND.accentColor, '#00e5ff');

  const filesToCheck = [
    'app/layout.js',
    'app/studio/page.js',
    'components/StandaloneShell.js',
    'components/ApiKeyModal.js',
    'index.html',
    'src/components/Header.js',
    'src/components/AuthModal.js',
  ];

  for (const relPath of filesToCheck) {
    const content = fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
    assert.ok(
      !content.includes('Open Higgsfield AI'),
      `${relPath} must not contain legacy 'Open Higgsfield AI' branding`
    );
    assert.ok(
      !content.includes('MATAI'),
      `${relPath} must not contain legacy 'MATAI' branding`
    );
    assert.ok(
      !content.includes('muapi.ai'),
      `${relPath} must not reference legacy 'muapi.ai' domain`
    );
  }
});

test('Track A: Model catalog seam preserves all 29 upstream exports and hides unconfigured self-hosted models from active pickers', () => {
  const requiredExports = [
    't2iModels',
    'getModelById',
    'getAspectRatiosForModel',
    't2vModels',
    'getVideoModelById',
    'getAspectRatiosForVideoModel',
    'getDurationsForModel',
    'getResolutionsForVideoModel',
    'i2iModels',
    'i2vModels',
    'getI2IModelById',
    'getI2VModelById',
    'getAspectRatiosForI2IModel',
    'getAspectRatiosForI2VModel',
    'getDurationsForI2VModel',
    'getResolutionsForI2VModel',
    'getModesForModel',
    'getResolutionsForI2IModel',
    'getQualityFieldForModel',
    'getResolutionsForModel',
    'getQualityFieldForI2IModel',
    'getMaxImagesForI2IModel',
    'v2vModels',
    'lipsyncModels',
    'getLipSyncModelById',
    'getResolutionsForLipSyncModel',
    'imageLipSyncModels',
    'videoLipSyncModels',
    'getV2VModelById',
  ];

  for (const exp of requiredExports) {
    assert.ok(exp in tcModels, `tcModels missing export: ${exp}`);
    assert.ok(exp in studioModels, `studioModels missing export: ${exp}`);
    assert.ok(exp in viteModels, `viteModels missing export: ${exp}`);
  }

  assert.ok(tcModels.getModelById('nano-banana-pro'));
  assert.ok(tcModels.getVideoModelById('veo3.1-text-to-video'));
  assert.ok(tcModels.getI2VModelById('seedance-v2.0-i2v'));
  assert.ok(tcModels.getLipSyncModelById('sync-lipsync'));
  assert.ok(tcModels.getV2VModelById('video-watermark-remover'));

  assert.equal(tcModels.getModelById('timecapsule.flux1-dev-t2i'), undefined);
  assert.equal(tcModels.getVideoModelById('timecapsule.wan2.1-t2v'), undefined);
  assert.equal(tcModels.getI2VModelById('timecapsule.wan2.1-i2v'), undefined);

  const unconfigured = tcModels.getUnconfiguredNativeModelById('timecapsule.wan2.1-t2v');
  assert.ok(unconfigured);
  assert.equal(unconfigured.provider, 'timecapsule-gpu');
  assert.equal(unconfigured.availability, 'not_configured');
  assert.equal(unconfigured.enabled, false);
});

test('Track A: Provider client seam supports Direct Parity Mode for Image, Video (Jobs & Veo), and LipSync', async () => {
  tcClient.configureTimecapsuleClient({
    mode: 'direct',
    pollIntervalMs: 1,
    fetchImpl: async (url) => {
      if (url.endsWith('/api/v1/jobs/createTask')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ code: 200, data: { taskId: 'task_kie_123' } }),
        };
      }
      if (url.includes('/api/v1/jobs/recordInfo')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            code: 200,
            data: {
              state: 'success',
              resultJson: JSON.stringify({ resultUrls: ['https://cdn.example.com/out.png'] }),
            },
          }),
        };
      }
      if (url.endsWith('/api/v1/veo/generate')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ code: 200, data: { taskId: 'task_veo_456' } }),
        };
      }
      if (url.includes('/api/v1/veo/record-info')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            code: 200,
            data: {
              successFlag: 1,
              response: { resultUrls: ['https://cdn.example.com/veo.mp4'] },
            },
          }),
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });

  const imgResult = await studioClient.generateImage('test_kie_key', {
    model: 'nano-banana-pro',
    prompt: 'A futuristic glass timecapsule in orbit',
    aspect_ratio: '16:9',
    resolution: '2k',
  });
  assert.equal(imgResult.url, 'https://cdn.example.com/out.png');
  assert.equal(imgResult.id, 'task_kie_123');

  const veoResult = await studioClient.generateVideo('test_kie_key', {
    model: 'veo3.1-text-to-video',
    prompt: 'Drone flight through canyon',
    aspect_ratio: '16:9',
  });
  assert.equal(veoResult.url, 'https://cdn.example.com/veo.mp4');
  assert.equal(veoResult.id, 'task_veo_456');

  assert.equal(typeof viteClient.kie.generateImage, 'function');
  assert.equal(typeof viteClient.kie.generateVideo, 'function');
});

test('Track B: Provider client seam routes through Timecapsule BFF in managed mode', async () => {
  const bffRequests = [];
  tcClient.configureTimecapsuleClient({
    mode: 'bff',
    bffPollIntervalMs: 1,
    EventSourceImpl: false,
    fetchImpl: async (url, options = {}) => {
      bffRequests.push({
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : null,
      });
      if (url === '/api/v1/generations' && options.method === 'POST') {
        return {
          ok: true,
          status: 202,
          json: async () => ({
            job_id: 'job_bff_999',
            status: 'queued',
            credits_reserved: 240,
            estimated_cost: 240,
            events_url: '/api/v1/generations/job_bff_999/events',
            provider: 'kie',
          }),
        };
      }
      if (url === '/api/v1/generations/job_bff_999') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            job_id: 'job_bff_999',
            status: 'succeeded',
            provider: 'kie',
            output: { url: 'https://cdn.timecapsule.studio/outputs/job_bff_999.mp4' },
          }),
        };
      }
      throw new Error(`Unexpected BFF URL: ${url}`);
    },
  });

  const videoRes = await studioClient.generateVideo('TIMECAPSULE_BFF', {
    model: 'seedance-pro-t2v',
    prompt: 'Cyberpunk rain reflection',
    duration: 5,
    resolution: '1080p',
  });

  assert.equal(videoRes.url, 'https://cdn.timecapsule.studio/outputs/job_bff_999.mp4');
  assert.equal(videoRes.id, 'job_bff_999');
  assert.equal(bffRequests[0].url, '/api/v1/generations');
  assert.ok(bffRequests[0].headers['Idempotency-Key']);
  assert.equal(bffRequests[0].headers['X-Timecapsule-CSRF'], '1');
});

test('Checkpoint 1 (Auth): Anonymous requests cannot obtain privileged sessions and missing config fails closed', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: undefined,
      TIMECAPSULE_PREVIEW_KEY: undefined,
      TIMECAPSULE_ACCESS_CODE: undefined,
    },
    async () => {
      const unconfiguredReq = new Request('http://localhost:3000/api/v1/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ access_key: 'any_key' }),
      });
      const unconfiguredRes = await postSessionRoute(unconfiguredReq);
      assert.equal(unconfiguredRes.status, 503);
      const unconfiguredBody = await unconfiguredRes.json();
      assert.equal(unconfiguredBody.code, 'AUTH_NOT_CONFIGURED');
    }
  );

  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: 'checkpoint1-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
    },
    async () => {
      const anonPost = new Request('http://localhost:3000/api/v1/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ name: 'Anonymous Caller' }),
      });
      const anonPostRes = await postSessionRoute(anonPost);
      assert.equal(anonPostRes.status, 401);
      const anonPostJson = await anonPostRes.json();
      assert.equal(anonPostJson.code, 'INVALID_PREVIEW_CREDENTIAL');

      const anonGet = new Request('http://localhost:3000/api/v1/session');
      const anonGetRes = await getSessionRoute(anonGet);
      assert.equal(anonGetRes.status, 401);

      const legacyBypassGet = new Request('http://localhost:3000/api/v1/session', {
        headers: { Authorization: 'Bearer tc_dev_session' },
      });
      const legacyBypassRes = await getSessionRoute(legacyBypassGet);
      assert.equal(legacyBypassRes.status, 401);
    }
  );
});

test('Checkpoint 1 (Auth): Client-supplied tenant/user IDs cannot override server-derived preview identity and CSRF/cookie flags are enforced', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: 'checkpoint1-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
    },
    async () => {
      await resetStoreForTests(1000);

      const crossOriginReq = new Request('http://localhost:3000/api/v1/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://attacker.example.com',
        },
        body: JSON.stringify({ access_key: 'preview-operator-secret-key-2026' }),
      });
      const crossOriginRes = await postSessionRoute(crossOriginReq);
      assert.equal(crossOriginRes.status, 403);
      const crossOriginData = await crossOriginRes.json();
      assert.equal(crossOriginData.code, 'CSRF_ORIGIN_MISMATCH');

      const validReq = new Request('http://localhost:3000/api/v1/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          access_key: 'preview-operator-secret-key-2026',
          tenant_id: 'org_victim_override',
          user_id: 'usr_superadmin_override',
          name: 'Spoofed Admin',
        }),
      });
      const validRes = await postSessionRoute(validReq);
      assert.equal(validRes.status, 200);
      assert.equal(validRes.headers.get('Cache-Control'), 'private, no-store, max-age=0');

      const setCookie = validRes.headers.get('set-cookie') || '';
      assert.ok(setCookie.includes('timecapsule_session='));
      assert.ok(/HttpOnly/i.test(setCookie));
      assert.ok(/Secure/i.test(setCookie));
      assert.ok(/SameSite=Strict/i.test(setCookie));

      const data = await validRes.json();
      assert.equal(data.ok, true);
      assert.equal(data.auth_mode, 'private_preview');
      assert.equal(data.session.tenant_id, PREVIEW_IDENTITY.tenant_id);
      assert.equal(data.session.user_id, PREVIEW_IDENTITY.user_id);
      assert.equal('token' in data, false, 'Signed session token must not be echoed in JSON body');
    }
  );
});

test('Checkpoint 1 (Provider): Missing provider credentials and unverified GPU/Veo models fail closed before credit reservation', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: 'checkpoint1-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
      KIE_API_KEY: undefined,
      TIMECAPSULE_TEST_MODE: undefined,
    },
    async () => {
      await resetStoreForTests(1000);
      resetProviderAdapters();

      const token = issuePreviewSessionToken();
      const req = new Request('http://localhost:3000/api/v1/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          modality: 'image',
          model: 'nano-banana-pro',
          inputs: { prompt: 'Should fail before reserving credits' },
        }),
      });

      const res = await postGenerationsRoute(req);
      assert.equal(res.status, 503);
      const payload = await res.json();
      assert.equal(payload.code, 'PROVIDER_CREDENTIALS_MISSING');

      const credits = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
      assert.equal(credits.available_credits, 1000);
      assert.equal(credits.reserved_credits, 0);
      assert.equal((await listJobs(PREVIEW_IDENTITY.tenant_id)).length, 0);
    }
  );

  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: 'checkpoint1-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
      KIE_API_KEY: 'configured-kie-key-for-test',
      TIMECAPSULE_GPU_WORKER_URL: 'http://gpu-worker.example.com:8080',
      TIMECAPSULE_TEST_MODE: undefined,
    },
    async () => {
      await resetStoreForTests(1000);
      const session = verifySessionToken(issuePreviewSessionToken());

      // Unconfigured GPU models rejected before reservation
      await assert.rejects(
        () =>
          submitGenerationJob({
            session,
            body: {
              modality: 'video',
              model: 'timecapsule.wan2.1-t2v',
              inputs: { prompt: 'Must not execute fake or unverified GPU worker' },
            },
          }),
        (err) => err.code === 'MODEL_WORKER_NOT_VERIFIED' && err.statusCode === 503
      );

      // Managed Veo rejected before reservation until Checkpoint 3
      await assert.rejects(
        () =>
          submitGenerationJob({
            session,
            body: {
              modality: 'video',
              model: 'veo3.1-text-to-video',
              inputs: { prompt: 'Managed Veo must fail closed before reservation' },
            },
          }),
        (err) => err.code === 'MANAGED_VEO_CONTRACT_UNVERIFIED' && err.statusCode === 501
      );

      const credits = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
      assert.equal(credits.available_credits, 1000);
      assert.equal(credits.reserved_credits, 0);
      assert.equal((await listJobs(PREVIEW_IDENTITY.tenant_id)).length, 0);
    }
  );
});

test('Checkpoint 1 (Assets & SSRF): Private asset access requires authentication, rejects cross-tenant access, blocks remote-fetch proxy, and validates SSRF URLs', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_TEST_MODE: '1',
      TIMECAPSULE_SESSION_SECRET: 'checkpoint1-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
    },
    async () => {
      await resetStoreForTests(1000, ['org_tenant_alpha', 'org_tenant_beta']);

      const inlineAsset = await registerAsset({
        tenant_id: 'org_tenant_alpha',
        source_url:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        modality: 'upload',
        content_type: 'image/png',
        storage_type: 'inline_data_url',
        durable: false,
        private: true,
      });

      const remoteRefAsset = await registerAsset({
        tenant_id: 'org_tenant_alpha',
        source_url: 'https://cdn.timecapsule.studio/external/render.mp4',
        modality: 'video',
        content_type: 'video/mp4',
        storage_type: 'external_url_reference',
        durable: false,
        private: true,
      });

      const tokenAlpha = issueSessionTokenForTest({
        userId: 'usr_a',
        tenantId: 'org_tenant_alpha',
      });
      const tokenBeta = issueSessionTokenForTest({
        userId: 'usr_b',
        tenantId: 'org_tenant_beta',
      });

      const anonReq = new Request(`http://localhost:3000/api/v1/assets/${inlineAsset.asset_id}`);
      const anonRes = await getAssetRoute(anonReq, {
        params: Promise.resolve({ assetId: inlineAsset.asset_id }),
      });
      assert.equal(anonRes.status, 401);

      const crossTenantReq = new Request(
        `http://localhost:3000/api/v1/assets/${inlineAsset.asset_id}`,
        { headers: { Authorization: `Bearer ${tokenBeta}` } }
      );
      const crossTenantRes = await getAssetRoute(crossTenantReq, {
        params: Promise.resolve({ assetId: inlineAsset.asset_id }),
      });
      assert.equal(crossTenantRes.status, 403);

      const ownerReq = new Request(`http://localhost:3000/api/v1/assets/${inlineAsset.asset_id}`, {
        headers: { Authorization: `Bearer ${tokenAlpha}` },
      });
      const ownerRes = await getAssetRoute(ownerReq, {
        params: Promise.resolve({ assetId: inlineAsset.asset_id }),
      });
      assert.equal(ownerRes.status, 200);
      assert.equal(ownerRes.headers.get('Cache-Control'), 'private, no-store, max-age=0');

      const remoteProxyReq = new Request(
        `http://localhost:3000/api/v1/assets/${remoteRefAsset.asset_id}`,
        { headers: { Authorization: `Bearer ${tokenAlpha}` } }
      );
      const remoteProxyRes = await getAssetRoute(remoteProxyReq, {
        params: Promise.resolve({ assetId: remoteRefAsset.asset_id }),
      });
      assert.equal(remoteProxyRes.status, 501);
    }
  );

  for (const badUrl of [
    'http://127.0.0.1:8080/secret',
    'http://localhost/admin',
    'http://169.254.169.254/latest/meta-data',
    'http://100.64.0.1/cgnat',
    'http://[::1]:8080/ipv6-loopback',
    'http://[::ffff:127.0.0.1]/ipv4-mapped',
    'http://2130706433/decimal-ip',
    'http://0x7f000001/hex-ip',
    'http://0177.0.0.1/octal-ip',
  ]) {
    assert.throws(() => validateExternalMediaUrl(badUrl), /not allowed/);
  }
});

// ─── Checkpoint 2 Durable Jobs, Credits, and Execution Verification ─────────

test('Checkpoint 2 (Fail-Closed DB & Boot Semantics): Missing DATABASE_URL or unreachable PostgreSQL fails closed with 503 and boot does not auto-seed free credits', async () => {
  // 1. Missing DATABASE_URL fails closed
  await closePool();
  await withTestEnv(
    {
      DATABASE_URL: undefined,
      TIMECAPSULE_SESSION_SECRET: 'checkpoint2-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
    },
    async () => {
      const token = issuePreviewSessionToken();
      const req = new Request('http://localhost:3000/api/v1/generations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await getGenerationsRoute(req);
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.code, 'DATABASE_NOT_CONFIGURED');
    }
  );

  // 2. Unreachable PostgreSQL port fails closed with 503 DATABASE_UNAVAILABLE
  await closePool();
  await withTestEnv(
    {
      DATABASE_URL: 'postgresql://127.0.0.1:59999/unreachable_db?connect_timeout=1',
      TIMECAPSULE_SESSION_SECRET: 'checkpoint2-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
    },
    async () => {
      const token = issuePreviewSessionToken();
      const req = new Request('http://localhost:3000/api/v1/generations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await getGenerationsRoute(req);
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.code, 'DATABASE_UNAVAILABLE');
    }
  );
  await closePool();

  // 3. Do not recreate preview tenant with free credits on boot; unseeded tenant has 0 credits
  await resetStoreForTests(1000, []); // truncate all tenants without seeding
  const unseededCredits = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
  assert.equal(unseededCredits.total_credits, 0);
  assert.equal(unseededCredits.available_credits, 0);

  // Explicit idempotent seed command creates tenant once and does not re-add credits on repeat call
  const seed1 = await seedDevelopmentTenant({
    tenantId: PREVIEW_IDENTITY.tenant_id,
    targetCredits: 2500,
  });
  assert.equal(seed1.seeded_delta, 2500);
  assert.equal(seed1.credits_balance, 2500);

  const seed2 = await seedDevelopmentTenant({
    tenantId: PREVIEW_IDENTITY.tenant_id,
    targetCredits: 2500,
  });
  assert.equal(seed2.seeded_delta, 0);
  assert.equal(seed2.credits_balance, 2500);
});

test('Checkpoint 2 (Normalization & Fingerprinting): Canonical request normalization handles defaults, key ordering, array ordering, and rejects NaN/Infinity', () => {
  const fpA = normalizeAndFingerprintGenerationRequest({
    modality: 'VIDEO',
    model: 'seedance-pro-t2v',
    inputs: {
      prompt: '  Cinematic sunrise  ',
      resolution: '1080p',
      duration_seconds: 5,
      omitted_field: undefined,
    },
    workflow: { b: 2, a: 1 },
  });

  const fpB = normalizeAndFingerprintGenerationRequest({
    model: 'seedance-pro-t2v',
    modality: 'video',
    workflow: { a: 1, b: 2 },
    inputs: {
      duration: 5,
      resolution: '1080P',
      prompt: 'Cinematic sunrise',
    },
  });

  assert.equal(fpA.fingerprint, fpB.fingerprint);

  // Array order is preserved and affects fingerprint
  const arr1 = normalizeAndFingerprintGenerationRequest({
    modality: 'i2i',
    model: 'seedream-4.5-i2i',
    inputs: {
      prompt: 'blend',
      image_urls: ['https://cdn.example.com/1.png', 'https://cdn.example.com/2.png'],
    },
  });
  const arr2 = normalizeAndFingerprintGenerationRequest({
    modality: 'i2i',
    model: 'seedream-4.5-i2i',
    inputs: {
      prompt: 'blend',
      image_urls: ['https://cdn.example.com/2.png', 'https://cdn.example.com/1.png'],
    },
  });
  assert.notEqual(arr1.fingerprint, arr2.fingerprint);

  // Unsupported numeric values (NaN / Infinity) are rejected
  assert.throws(
    () => canonicalizeValue({ bad: Number.NaN }),
    (err) => err.code === 'INVALID_REQUEST_VALUE'
  );
  assert.throws(
    () => canonicalizeValue({ bad: Number.POSITIVE_INFINITY }),
    (err) => err.code === 'INVALID_REQUEST_VALUE'
  );
});

test('Checkpoint 2 (Persistence & Multi-Process): Jobs, reservations, and idempotency survive pool restart and are shared across two separate API processes', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: 'checkpoint2-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
      KIE_API_KEY: 'live-configured-kie-key',
    },
    async () => {
      await resetStoreForTests(1000);
      const session = verifySessionToken(issuePreviewSessionToken());

      const created = await submitGenerationJob({
        session,
        idempotencyKey: 'idem_restart_001',
        body: {
          modality: 'video',
          model: 'seedance-pro-t2v',
          inputs: { prompt: 'Persist across process restart', duration_seconds: 5, resolution: '1080p' },
        },
      });

      assert.equal(created.deduplicated, false);
      assert.equal(created.job.status, 'queued');
      assert.equal(created.job.credits_reserved, 180);

      // Simulate API server restart by closing the PostgreSQL connection pool completely
      await closePool();

      const creditsAfterRestart = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
      assert.equal(creditsAfterRestart.total_credits, 1000);
      assert.equal(creditsAfterRestart.reserved_credits, 180);
      assert.equal(creditsAfterRestart.available_credits, 820);

      // Spawn a separate second Node process that submits the same idempotency key and reads state
      const childScript = `
        import { submitGenerationJob } from './packages/timecapsule/src/server/orchestrator.js';
        import { getTenantCredits } from './packages/timecapsule/src/server/store.js';
        import { closePool } from './packages/timecapsule/src/server/db.js';
        const res = await submitGenerationJob({
          session: { user_id: 'usr_preview_operator', tenant_id: 'org_preview_default' },
          idempotencyKey: 'idem_restart_001',
          body: {
            modality: 'video',
            model: 'seedance-pro-t2v',
            inputs: { prompt: 'Persist across process restart', duration: 5, resolution: '1080p' },
          },
        });
        const credits = await getTenantCredits('org_preview_default');
        await closePool();
        console.log(JSON.stringify({ deduplicated: res.deduplicated, jobId: res.job.job_id, credits }));
      `;

      const { stdout } = await execFileAsync(
        process.execPath,
        ['--input-type=module', '-e', childScript],
        {
          cwd: repoRoot,
          env: {
            ...process.env,
            DATABASE_URL: TEST_DB_URL,
            // Even without KIE_API_KEY in the second process, idempotent replay of an already-accepted job must succeed!
            KIE_API_KEY: '',
          },
        }
      );

      const childOut = JSON.parse(stdout.trim());
      assert.equal(childOut.deduplicated, true);
      assert.equal(childOut.jobId, created.job.job_id);
      assert.equal(childOut.credits.available_credits, 820);
      assert.equal(childOut.credits.reserved_credits, 180);
    }
  );
});

test('Checkpoint 2 (Idempotency & Concurrency): Concurrent duplicate submissions create one job/reservation, mismatched payload returns 409, and 402 rollback does not poison key', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: 'checkpoint2-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
      KIE_API_KEY: 'live-configured-kie-key',
    },
    async () => {
      await resetStoreForTests(1000);
      const session = verifySessionToken(issuePreviewSessionToken());

      const payload = {
        modality: 'video',
        model: 'seedance-pro-t2v',
        inputs: { prompt: 'Concurrent idempotent test', duration_seconds: 5, resolution: '1080p' },
      };

      // 1. 8 concurrent submissions with the same Idempotency-Key
      const results = await Promise.all(
        Array.from({ length: 8 }, () =>
          submitGenerationJob({
            session,
            idempotencyKey: 'idem_concurrent_dup',
            body: payload,
          })
        )
      );

      const uniqueJobIds = new Set(results.map((r) => r.job.job_id));
      assert.equal(uniqueJobIds.size, 1, 'Exactly one job must be created');
      const nonDeduplicatedCount = results.filter((r) => !r.deduplicated).length;
      assert.equal(nonDeduplicatedCount, 1, 'Exactly one submission creates the job');

      const credits = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
      assert.equal(credits.reserved_credits, 180);
      assert.equal(credits.available_credits, 820);

      // 2. Same key with different payload returns 409 IDEMPOTENCY_PAYLOAD_MISMATCH
      await assert.rejects(
        () =>
          submitGenerationJob({
            session,
            idempotencyKey: 'idem_concurrent_dup',
            body: {
              ...payload,
              inputs: { ...payload.inputs, prompt: 'Modified prompt with same key' },
            },
          }),
        (err) => err.code === 'IDEMPOTENCY_PAYLOAD_MISMATCH' && err.statusCode === 409
      );

      // 3. Insufficient credits rolls back completely without poisoning the idempotency key
      await resetStoreForTests(100);
      await assert.rejects(
        () =>
          submitGenerationJob({
            session,
            idempotencyKey: 'idem_rollback_clean',
            body: payload, // costs 180, balance is 100
          }),
        (err) => err.code === 'INSUFFICIENT_CREDITS' && err.statusCode === 402
      );

      const jobsAfter402 = await listJobs(PREVIEW_IDENTITY.tenant_id);
      assert.equal(jobsAfter402.length, 0, 'No job row may remain after 402 rollback');
      const ledgerAfter402 = await getTenantLedger(PREVIEW_IDENTITY.tenant_id);
      assert.equal(
        ledgerAfter402.filter((e) => e.entry_type === 'reserve').length,
        0,
        'No reserve ledger entry may remain after 402 rollback'
      );

      // Top up credits and reuse the same idempotency key -> succeeds cleanly
      await query(
        'UPDATE tenants SET credits_balance = 500 WHERE tenant_id = $1',
        [PREVIEW_IDENTITY.tenant_id]
      );
      const retryAfterTopUp = await submitGenerationJob({
        session,
        idempotencyKey: 'idem_rollback_clean',
        body: payload,
      });
      assert.equal(retryAfterTopUp.deduplicated, false);
      assert.equal(retryAfterTopUp.job.status, 'queued');
    }
  );
});

test('Checkpoint 2 (Credit Safety): Concurrent reservations cannot overspend and duplicate/conflicting terminal events or ledger edits cannot corrupt balances', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: 'checkpoint2-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
      KIE_API_KEY: 'live-configured-kie-key',
    },
    async () => {
      // Balance = 400. Each job reserves 180. At most 2 of 6 concurrent submissions can succeed (2 * 180 = 360 <= 400).
      await resetStoreForTests(400);
      const session = verifySessionToken(issuePreviewSessionToken());

      const outcomes = await Promise.allSettled(
        Array.from({ length: 6 }, (_, i) =>
          submitGenerationJob({
            session,
            idempotencyKey: `idem_overspend_${i}`,
            body: {
              modality: 'video',
              model: 'seedance-pro-t2v',
              inputs: { prompt: `Concurrent job ${i}`, duration_seconds: 5, resolution: '1080p' },
            },
          })
        )
      );

      const fulfilled = outcomes.filter((o) => o.status === 'fulfilled');
      const rejected = outcomes.filter((o) => o.status === 'rejected');
      assert.equal(fulfilled.length, 2, 'Exactly 2 reservations of 180 fit into 400 credits');
      assert.equal(rejected.length, 4);
      for (const r of rejected) {
        assert.equal(r.reason.code, 'INSUFFICIENT_CREDITS');
      }

      const creditsMid = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
      assert.equal(creditsMid.total_credits, 400);
      assert.equal(creditsMid.reserved_credits, 360);
      assert.equal(creditsMid.available_credits, 40);

      // Claim first job and test settlement at higher cost (capped at reserved = 180, never overdrafts)
      const claim1 = await claimNextRunnableJob({ workerId: 'wrk_settle_test' });
      assert.ok(claim1 && !claim1.reconciliationRequired);
      const job1Id = claim1.job.job_id;
      const token1 = claim1.job.fencing_token;

      const settled1 = await completeJobSuccess({
        jobId: job1Id,
        tenantId: PREVIEW_IDENTITY.tenant_id,
        workerId: 'wrk_settle_test',
        fencingToken: token1,
        providerJobId: 'prov_task_1',
        sourceUrl: 'https://cdn.timecapsule.studio/outputs/1.mp4',
        userBilledCredits: 9999, // Exceeds reserved 180 -> must cap at 180
        providerReportedCost: 14.5,
        providerCostUnit: 'kie_credits',
      });
      assert.equal(settled1.alreadyTerminal, false);
      assert.equal(settled1.job.user_billed_credits, 180);
      assert.equal(settled1.job.actual_cost, 180);
      assert.equal(settled1.job.provider_reported_cost, 14.5);
      assert.equal(settled1.job.provider_cost_unit, 'kie_credits');

      // Duplicate completion event is a no-op
      const duplicateSettle = await completeJobSuccess({
        jobId: job1Id,
        tenantId: PREVIEW_IDENTITY.tenant_id,
        workerId: 'wrk_settle_test',
        fencingToken: token1,
        providerJobId: 'prov_task_1',
        sourceUrl: 'https://cdn.timecapsule.studio/outputs/1.mp4',
        userBilledCredits: 180,
      });
      assert.equal(duplicateSettle.alreadyTerminal, true);

      // Conflicting failure after success is rejected with 409 CONFLICTING_TERMINAL_STATE and cannot release already-settled reservation
      await assert.rejects(
        () =>
          completeJobFailure({
            jobId: job1Id,
            tenantId: PREVIEW_IDENTITY.tenant_id,
            workerId: 'wrk_settle_test',
            fencingToken: token1,
            errorMessage: 'Late failure after success',
          }),
        (err) => err.code === 'CONFLICTING_TERMINAL_STATE' && err.statusCode === 409
      );

      const res1Row = await getCreditReservation(job1Id);
      assert.equal(res1Row.status, 'settled');
      assert.equal(res1Row.settled_amount, 180);

      // Claim second job and test settlement at lower cost (150 < 180 -> 30 released back to available)
      const claim2 = await claimNextRunnableJob({ workerId: 'wrk_settle_test' });
      const job2Id = claim2.job.job_id;
      const token2 = claim2.job.fencing_token;

      await completeJobSuccess({
        jobId: job2Id,
        tenantId: PREVIEW_IDENTITY.tenant_id,
        workerId: 'wrk_settle_test',
        fencingToken: token2,
        providerJobId: 'prov_task_2',
        sourceUrl: 'https://cdn.timecapsule.studio/outputs/2.mp4',
        userBilledCredits: 150,
        providerReportedCost: 0.25,
        providerCostUnit: 'muapi_usd',
      });

      const creditsFinal = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
      // Started at 400, spent 180 + 150 = 330 -> balance = 70, reserved = 0, available = 70
      assert.equal(creditsFinal.total_credits, 70);
      assert.equal(creditsFinal.reserved_credits, 0);
      assert.equal(creditsFinal.available_credits, 70);

      // Verify append-only immutability trigger on credit_ledger
      await assert.rejects(
        () => query('DELETE FROM credit_ledger'),
        /append-only and immutable/
      );
    }
  );
});

test('Checkpoint 2 (Worker Leases & Fencing): Second worker recovers expired lease, stale worker is fenced out, and persisted provider_job_id is polled without resubmission', async () => {
  const fakeProvider = await startFakeKieProviderServer({
    pollsBeforeSuccess: 2,
  });

  try {
    await withTestEnv(
      {
        TIMECAPSULE_SESSION_SECRET: 'checkpoint2-secret-value-at-least-32-bytes',
        TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
        KIE_API_KEY: 'live-configured-kie-key',
        TIMECAPSULE_KIE_BASE_URL: fakeProvider.baseUrl,
      },
      async () => {
        await resetStoreForTests(1000);
        const session = verifySessionToken(issuePreviewSessionToken());

        const { job } = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_lease_recovery',
          body: {
            modality: 'image',
            model: 'nano-banana-pro',
            inputs: { prompt: 'Worker lease handoff test', resolution: '1k' },
          },
        });

        // Worker A claims job with a very short lease (50ms), submits to provider, and persists provider_job_id
        const workerA = createDurableWorker({
          workerId: 'worker_alpha',
          leaseDurationMs: 60,
          heartbeatIntervalMs: 0, // disable heartbeat to simulate Worker A stalling after persisting provider_job_id
          providerPollDelayMs: 10,
        });

        // Step 1: Worker A runs once -> submits task (`createTask`), persists `provider_job_id`, and schedules poll
        const stepA1 = await workerA.runOnce();
        assert.equal(stepA1.action, 'submitted_and_scheduled_poll');
        assert.equal(fakeProvider.createTaskRequests.length, 1);
        assert.ok(stepA1.job.provider_job_id);

        // Now suppose Worker A claims the job for polling, then stalls before finishing so its lease expires
        await new Promise((r) => setTimeout(r, 20));
        const stalledClaim = await claimNextRunnableJob({
          workerId: 'worker_alpha_stalled',
          leaseDurationMs: 40,
        });
        assert.ok(stalledClaim);
        const staleFencingToken = stalledClaim.job.fencing_token;

        // Wait for Worker A's lease to expire
        await new Promise((r) => setTimeout(r, 60));

        // Worker B claims the expired lease -> fencing_token increments
        const workerB = createDurableWorker({
          workerId: 'worker_beta',
          leaseDurationMs: 5000,
          providerPollDelayMs: 15,
        });

        const stepB1 = await workerB.runOnce();
        assert.equal(stepB1.action, 'polled_running');
        assert.ok(stepB1.job.fencing_token > staleFencingToken);

        // Stale Worker A wakes up and attempts to fail or complete the job with its old fencing_token -> rejected!
        await assert.rejects(
          () =>
            completeJobFailure({
              jobId: job.job_id,
              tenantId: PREVIEW_IDENTITY.tenant_id,
              workerId: 'worker_alpha_stalled',
              fencingToken: staleFencingToken,
              errorMessage: 'Stale worker trying to clobber job',
            }),
          (err) => err.code === 'STALE_WORKER_FENCING_TOKEN' && err.statusCode === 409
        );

        // Worker B finishes polling the existing provider_job_id to completion
        await workerB.drainUntilSettled({ waitMs: 20 });

        const finalJob = await getJob(job.job_id);
        assert.equal(finalJob.status, 'succeeded');
        assert.equal(
          fakeProvider.createTaskRequests.length,
          1,
          'Persisted provider_job_id must NEVER be resubmitted on worker recovery'
        );
        assert.ok(
          fakeProvider.recordInfoRequests.length >= 2,
          'Recovered worker must monitor existing provider_job_id via recordInfo'
        );
      }
    );
  } finally {
    await fakeProvider.close();
  }
});

test('Checkpoint 2 (Ambiguous Provider Submission): Crash after provider acceptance but before provider_job_id persistence transitions to reconciling_submission without duplicate submission or releasing credits', async () => {
  const fakeProvider = await startFakeKieProviderServer();

  try {
    await withTestEnv(
      {
        TIMECAPSULE_SESSION_SECRET: 'checkpoint2-secret-value-at-least-32-bytes',
        TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
        KIE_API_KEY: 'live-configured-kie-key',
        TIMECAPSULE_KIE_BASE_URL: fakeProvider.baseUrl,
      },
      async () => {
        await resetStoreForTests(500);
        const session = verifySessionToken(issuePreviewSessionToken());

        const { job } = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_ambiguous_crash',
          body: {
            modality: 'video',
            model: 'seedance-pro-t2v',
            inputs: { prompt: 'Crash after provider createTask', duration_seconds: 5, resolution: '1080p' },
          },
        });

        let capturedProviderTaskId = null;

        // Worker 1 crashes right after Fake Kie accepts createTask, BEFORE recordProviderTaskId writes to DB
        const crashingWorker = createDurableWorker({
          workerId: 'worker_crash_1',
          leaseDurationMs: 50,
          heartbeatIntervalMs: 0,
          onAfterProviderAcceptBeforePersist: async (submissionResult) => {
            capturedProviderTaskId = submissionResult.providerJobId;
            throw new Error('SIMULATED_PROCESS_CRASH_BEFORE_TASK_ID_PERSIST');
          },
        });

        await assert.rejects(
          () => crashingWorker.runOnce(),
          /SIMULATED_PROCESS_CRASH_BEFORE_TASK_ID_PERSIST/
        );

        // Provider received 1 createTask request, and DB has submission_state = 'submitting' withprovider_job_id = null
        assert.equal(fakeProvider.createTaskRequests.length, 1);
        const midJob = await getJob(job.job_id);
        assert.equal(midJob.submission_state, 'submitting');
        assert.ok(midJob.submission_attempt_id);
        assert.equal(midJob.provider_job_id, null);

        // Wait for crashingWorker's lease to expire
        await new Promise((r) => setTimeout(r, 70));

        // Worker 2 comes along to recover the expired lease
        const recoveryWorker = createDurableWorker({
          workerId: 'worker_recovery_2',
          leaseDurationMs: 5000,
          providerPollDelayMs: 10,
        });

        const recoveryStep = await recoveryWorker.runOnce();
        assert.equal(recoveryStep.reconciliationRequired, true);
        assert.equal(recoveryStep.action, 'reconciliation_required');
        assert.equal(recoveryStep.job.status, 'reconciling_submission');
        assert.equal(recoveryStep.job.submission_state, 'submission_unknown');

        // Verify NO second createTask call was sent and credit reservation is still held
        assert.equal(
          fakeProvider.createTaskRequests.length,
          1,
          'Recovery worker must NOT blindly resubmit an ambiguous in-flight submission'
        );
        const creditsDuringReconcile = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
        assert.equal(
          creditsDuringReconcile.reserved_credits,
          180,
          'Credits must remain reserved while submission is in reconciling_submission'
        );

        // Operator reconciles the ambiguous job by supplying the known provider_job_id (`attach_provider_task`)
        const reconciledJob = await reconcileAmbiguousJob({
          jobId: job.job_id,
          action: 'attach_provider_task',
          providerJobId: capturedProviderTaskId,
          reason: 'Verified taskId from provider logs',
        });
        assert.equal(reconciledJob.status, 'queued');
        assert.equal(reconciledJob.submission_state, 'submitted');
        assert.equal(reconciledJob.provider_job_id, capturedProviderTaskId);

        // Now Worker 2 polls the attached provider_job_id and settles the job without ever resubmitting
        await recoveryWorker.drainUntilSettled({ waitMs: 20 });

        const finalJob = await getJob(job.job_id);
        assert.equal(finalJob.status, 'succeeded');
        assert.equal(fakeProvider.createTaskRequests.length, 1);
        const finalCredits = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
        assert.equal(finalCredits.reserved_credits, 0);
        assert.equal(finalCredits.total_credits, 320);
      }
    );
  } finally {
    await fakeProvider.close();
  }
});

test('Checkpoint 2 (SSE Replay over HTTP): Last-Event-ID reconnect replays missed ordered events from PostgreSQL across separate HTTP server instances', async () => {
  const fakeProvider = await startFakeKieProviderServer({
    pollsBeforeSuccess: 2,
  });

  // Start two separate HTTP servers wrapping GET /api/v1/generations/[jobId]/events to simulate two API instances
  function createSseHttpServer() {
    return http.createServer(async (req, res) => {
      try {
        const urlObj = new URL(req.url, 'http://127.0.0.1');
        const match = urlObj.pathname.match(/^\/api\/v1\/generations\/([^/]+)\/events$/);
        if (!match) {
          res.writeHead(404);
          res.end();
          return;
        }
        const jobId = match[1];
        const abortController = new AbortController();
        req.on('close', () => abortController.abort());

        const webReq = new Request(urlObj.toString(), {
          method: req.method,
          headers: req.headers,
          signal: abortController.signal,
        });

        const webRes = await getSseEvents(webReq, {
          params: Promise.resolve({ jobId }),
        });

        res.writeHead(webRes.status, Object.fromEntries(webRes.headers.entries()));
        if (!webRes.body) {
          res.end();
          return;
        }
        const reader = webRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      } catch {
        if (!res.headersSent) res.writeHead(500);
        res.end();
      }
    });
  }

  const sseServer1 = createSseHttpServer();
  const sseServer2 = createSseHttpServer();
  await new Promise((r) => sseServer1.listen(0, '127.0.0.1', r));
  await new Promise((r) => sseServer2.listen(0, '127.0.0.1', r));
  const sseUrl1 = `http://127.0.0.1:${sseServer1.address().port}`;
  const sseUrl2 = `http://127.0.0.1:${sseServer2.address().port}`;

  try {
    await withTestEnv(
      {
        TIMECAPSULE_SESSION_SECRET: 'checkpoint2-secret-value-at-least-32-bytes',
        TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
        KIE_API_KEY: 'live-configured-kie-key',
        TIMECAPSULE_KIE_BASE_URL: fakeProvider.baseUrl,
        TIMECAPSULE_SSE_POLL_MS: '25',
      },
      async () => {
        await resetStoreForTests(1000);
        const token = issuePreviewSessionToken();
        const session = verifySessionToken(token);

        const { job } = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_sse_http_replay',
          body: {
            modality: 'image',
            model: 'nano-banana-pro',
            inputs: { prompt: 'SSE replay over HTTP', resolution: '1k' },
          },
        });

        // Drive worker through execution in background so events 1..N are persisted in PostgreSQL
        const worker = createDurableWorker({
          workerId: 'worker_sse_driver',
          providerPollDelayMs: 20,
        });
        await worker.drainUntilSettled({ waitMs: 25 });

        const allEvents = await getJobEventsAfter(job.job_id, { afterEventVersion: 0 });
        assert.ok(allEvents.length >= 3, 'Should have accepted, progress, and succeeded events');
        for (let i = 0; i < allEvents.length; i++) {
          assert.equal(
            allEvents[i].event_version,
            i + 1,
            'event_version must be strictly sequential per job starting at 1'
          );
        }

        // Connect to HTTP Server 1 with no Last-Event-ID -> receives all events from version 1 to terminal
        const fullStreamRes = await fetch(
          `${sseUrl1}/api/v1/generations/${job.job_id}/events`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        assert.equal(fullStreamRes.status, 200);
        const fullStreamText = await fullStreamRes.text();
        assert.ok(fullStreamText.includes('id: 1\n'));
        assert.ok(fullStreamText.includes('event: generation.accepted\n'));
        assert.ok(fullStreamText.includes('event: generation.succeeded\n'));

        // Reconnect to HTTP Server 2 with Last-Event-ID: 1 -> must NOT replay event 1, only events > 1
        const replayRes = await fetch(
          `${sseUrl2}/api/v1/generations/${job.job_id}/events`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Last-Event-ID': '1',
            },
          }
        );
        assert.equal(replayRes.status, 200);
        const replayText = await replayRes.text();
        assert.ok(!replayText.includes('id: 1\n'), 'Must not replay already-seen event_version 1');
        assert.ok(replayText.includes('id: 2\n'), 'Must replay missed event_version 2');
        assert.ok(replayText.includes('event: generation.succeeded\n'));
      }
    );
  } finally {
    await new Promise((r) => sseServer1.close(r));
    await new Promise((r) => sseServer2.close(r));
    await fakeProvider.close();
  }
});

test('Checkpoint 2 (Test Mode Separation): Test adapters and test tokens are forbidden when NODE_ENV=production even if TIMECAPSULE_TEST_MODE=1', async () => {
  await withTestEnv(
    {
      NODE_ENV: 'production',
      TIMECAPSULE_TEST_MODE: '1',
      TIMECAPSULE_SESSION_SECRET: 'checkpoint2-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
    },
    async () => {
      assert.throws(
        () => registerProviderAdapter('kie', async () => ({})),
        (err) => err.code === 'TEST_MODE_FORBIDDEN_IN_PRODUCTION' && err.statusCode === 403
      );
      assert.throws(
        () => issueSessionTokenForTest({ userId: 'u', tenantId: 't' }),
        /restricted to non-production environments/
      );
    }
  );
  await closePool();
});

test('Checkpoint 3A Pre-Flight: Settlement math (500 -> reserve 100 -> charge 70 => 430), separate provider cost vs user credits, and disposable test DB guard', async () => {
  // 1. Destructive test DB guard refuses application DB (`timecapsule`, `postgres`) or missing TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB
  assert.throws(
    () => assertDisposableTestDatabase('postgresql://localhost:5432/timecapsule'),
    (err) => err.code === 'NON_DISPOSABLE_DATABASE_REFUSED' && err.statusCode === 403
  );
  assert.throws(
    () => assertDisposableTestDatabase('postgresql://localhost:5432/postgres'),
    (err) => err.code === 'NON_DISPOSABLE_DATABASE_REFUSED' && err.statusCode === 403
  );
  await withTestEnv({ TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB: undefined }, async () => {
    await assert.rejects(
      () => resetStoreForTests(500),
      (err) => err.code === 'DESTRUCTIVE_TEST_DB_NOT_DESIGNATED' && err.statusCode === 403
    );
  });
  await withTestEnv(
    { DATABASE_URL: 'postgresql://localhost:5432/timecapsule' },
    async () => {
      await assert.rejects(
        () => resetStoreForTests(500),
        (err) => err.code === 'NON_DISPOSABLE_DATABASE_REFUSED' && err.statusCode === 403
      );
    }
  );

  // 2. Settlement math: initial balance 500, reservation 100, final user charge 70 -> final balance 430, reserved 0
  await resetStoreForTests(500);
  const initialCredits = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
  assert.equal(initialCredits.total_credits, 500);
  assert.equal(initialCredits.reserved_credits, 0);
  assert.equal(initialCredits.available_credits, 500);

  const sub = await createSubmissionTransaction({
    tenantId: PREVIEW_IDENTITY.tenant_id,
    userId: PREVIEW_IDENTITY.user_id,
    projectId: 'prj_preflight',
    idempotencyKey: 'idem_preflight_500_100_70',
    requestFingerprint: 'fp_preflight_500_100_70',
    canonicalPayload: { model: 'nano-banana-pro', modality: 'image' },
    modality: 'image',
    model: 'nano-banana-pro',
    resolvedProviderModel: 'nano-banana-pro',
    provider: 'kie',
    inputs: { prompt: 'Pre-flight 500 -> 100 -> 70 check' },
    workflow: {},
    delivery: {},
    estimatedCost: 100,
  });

  const reservedCredits = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
  assert.equal(reservedCredits.total_credits, 500);
  assert.equal(reservedCredits.reserved_credits, 100);
  assert.equal(reservedCredits.available_credits, 400);

  const claimed = await claimNextRunnableJob({ workerId: 'wrk_preflight' });
  assert.equal(claimed.job.job_id, sub.job.job_id);

  // Provider reports cost = 4.25 in 'kie_credits' while Timecapsule final user charge = 70
  const settled = await completeJobSuccess({
    jobId: sub.job.job_id,
    tenantId: PREVIEW_IDENTITY.tenant_id,
    workerId: 'wrk_preflight',
    fencingToken: claimed.job.fencing_token,
    providerJobId: 'prov_preflight_1',
    sourceUrl: 'https://cdn.timecapsule.studio/outputs/preflight.png',
    userBilledCredits: 70,
    providerReportedCost: 4.25,
    providerCostUnit: 'kie_credits',
  });

  const afterCredits = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
  assert.equal(afterCredits.total_credits, 430, 'Expected final balance 430');
  assert.equal(afterCredits.reserved_credits, 0, 'Expected reserved credits 0');
  assert.equal(afterCredits.available_credits, 430, 'Expected available credits 430');

  assert.equal(settled.job.user_billed_credits, 70);
  assert.equal(settled.job.actual_cost, 70);
  assert.equal(settled.job.provider_reported_cost, 4.25);
  assert.equal(settled.job.provider_cost_unit, 'kie_credits');

  const resv = await getCreditReservation(sub.job.job_id);
  assert.equal(resv.status, 'settled');
  assert.equal(resv.amount, 100);
  assert.equal(resv.settled_amount, 70);

  const ledger = await getTenantLedger(PREVIEW_IDENTITY.tenant_id);
  const settleEntry = ledger.find((e) => e.entry_type === 'settle' && e.job_id === sub.job.job_id);
  assert.ok(settleEntry);
  assert.equal(settleEntry.amount, 70);
  assert.equal(settleEntry.balance_after, 430);
  assert.equal(settleEntry.reserved_after, 0);
  assert.equal(settleEntry.metadata.user_billed_credits, 70);
  assert.equal(settleEntry.metadata.released_unused_credits, 30);
  assert.equal(settleEntry.metadata.provider_reported_cost, 4.25);
  assert.equal(settleEntry.metadata.provider_cost_unit, 'kie_credits');

  await closePool();
});
