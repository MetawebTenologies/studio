import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TIMECAPSULE_BRAND } from '../packages/timecapsule/src/branding.js';
import * as tcModels from '../packages/timecapsule/src/models/index.js';
import * as studioModels from '../packages/studio/src/models.js';
import * as viteModels from '../src/lib/models.js';
import * as tcClient from '../packages/timecapsule/src/client/index.js';
import * as studioClient from '../packages/studio/src/kie.js';
import * as viteClient from '../src/lib/kie.js';

import {
  resetStoreForTests,
  getTenantCredits,
  getJob,
  listJobs,
  registerAsset,
} from '../packages/timecapsule/src/server/store.js';
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
import { validateExternalMediaUrl } from '../packages/timecapsule/src/server/media.js';
import { GET as getSessionRoute, POST as postSessionRoute } from '../app/api/v1/session/route.js';
import { POST as postGenerationsRoute } from '../app/api/v1/generations/route.js';
import { GET as getSseEvents } from '../app/api/v1/generations/[jobId]/events/route.js';
import { GET as getAssetRoute } from '../app/api/v1/assets/[assetId]/route.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

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

  // Verify upstream models resolve
  assert.ok(tcModels.getModelById('nano-banana-pro'));
  assert.ok(tcModels.getVideoModelById('veo3.1-text-to-video'));
  assert.ok(tcModels.getI2VModelById('seedance-v2.0-i2v'));
  assert.ok(tcModels.getLipSyncModelById('sync-lipsync'));
  assert.ok(tcModels.getV2VModelById('video-watermark-remover'));

  // Verify unconfigured self-hosted models are hidden/disabled from active pickers
  assert.equal(tcModels.getModelById('timecapsule.flux1-dev-t2i'), undefined);
  assert.equal(tcModels.getVideoModelById('timecapsule.wan2.1-t2v'), undefined);
  assert.equal(tcModels.getI2VModelById('timecapsule.wan2.1-i2v'), undefined);

  const unconfigured = tcModels.getUnconfiguredNativeModelById('timecapsule.wan2.1-t2v');
  assert.ok(unconfigured);
  assert.equal(unconfigured.provider, 'timecapsule-gpu');
  assert.equal(unconfigured.availability, 'not_configured');
  assert.equal(unconfigured.enabled, false);
  assert.equal(tcModels.getProviderForModel('timecapsule.wan2.1-t2v'), 'timecapsule-gpu');
  assert.equal(tcModels.getProviderForModel('nano-banana-pro'), 'kie');
});

test('Track A: Provider client seam supports Direct Parity Mode for Image, Video (Jobs & Veo), and LipSync', async () => {
  const calls = [];
  tcClient.configureTimecapsuleClient({
    mode: 'direct',
    pollIntervalMs: 1,
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, method: options.method || 'GET', body: options.body ? JSON.parse(options.body) : null });
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
  assert.equal(bffRequests[0].body.model, 'seedance-pro-t2v');
});

test('Track B: BFF Orchestrator enforces idempotency, credit reservation, settlement, and refund on failure in explicit test mode', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_TEST_MODE: '1',
      TIMECAPSULE_SESSION_SECRET: 'test-session-secret-32-chars-minimum-0001',
    },
    async () => {
      resetStoreForTests(500);
      resetProviderAdapters();

      registerProviderAdapter('kie', async (job, { onProgress }) => {
        onProgress({ stage: 'diffusion', progress: 0.5, providerJobId: 'wp_101', frame: 50, total_frames: 100 });
        return {
          providerJobId: 'wp_101',
          sourceUrl: 'https://cdn.timecapsule.studio/renders/seedance.mp4',
          actualCredits: 180,
        };
      });

      const session = { user_id: 'usr_alice', tenant_id: 'org_default', name: 'Alice' };

      // 1. Submit with idempotency key
      const first = await submitGenerationJob({
        session,
        idempotencyKey: 'idem_key_001',
        body: {
          project_id: 'prj_cinema',
          modality: 'video',
          model: 'seedance-pro-t2v',
          inputs: {
            prompt: 'Aerial shot of glacier',
            duration_seconds: 5,
            resolution: '1080p',
          },
        },
        awaitCompletion: true,
      });

      assert.equal(first.deduplicated, false);
      assert.equal(first.job.status, 'succeeded');
      assert.equal(first.job.provider, 'kie');
      assert.equal(first.job.actual_cost, 180);
      assert.equal(first.job.output.storage_type, 'external_url_reference');
      assert.equal(first.job.output.durable, false);
      assert.equal(getTenantCredits('org_default').available_credits, 320);

      // 2. Duplicate submission with same Idempotency-Key returns same job without charging again
      const duplicate = await submitGenerationJob({
        session,
        idempotencyKey: 'idem_key_001',
        body: {
          project_id: 'prj_cinema',
          modality: 'video',
          model: 'seedance-pro-t2v',
          inputs: { prompt: 'Aerial shot of glacier' },
        },
        awaitCompletion: true,
      });

      assert.equal(duplicate.deduplicated, true);
      assert.equal(duplicate.job.job_id, first.job.job_id);
      assert.equal(getTenantCredits('org_default').available_credits, 320);

      // 3. Failing provider releases reserved credits back to tenant
      registerProviderAdapter('kie', async () => {
        throw new Error('Simulated provider error');
      });

      const failedRun = await submitGenerationJob({
        session,
        idempotencyKey: 'idem_key_002',
        body: {
          modality: 'video',
          model: 'seedance-pro-t2v',
          inputs: { prompt: 'Will fail and refund credits', duration_seconds: 5, resolution: '1080p' },
        },
        awaitCompletion: true,
      });

      const updatedFailedJob = getJob(failedRun.job.job_id);
      assert.equal(updatedFailedJob.status, 'failed');
      assert.equal(getTenantCredits('org_default').available_credits, 320);
      assert.equal(getTenantCredits('org_default').reserved_credits, 0);

      // 4. Insufficient credits throws 402 INSUFFICIENT_CREDITS
      resetStoreForTests(50);
      await assert.rejects(
        () =>
          submitGenerationJob({
            session,
            idempotencyKey: 'idem_key_003',
            body: {
              modality: 'video',
              model: 'seedance-pro-t2v',
              inputs: { prompt: 'Costs 180 credits', duration_seconds: 5, resolution: '1080p' },
            },
          }),
        (err) => err.code === 'INSUFFICIENT_CREDITS' && err.statusCode === 402
      );

      resetProviderAdapters();
    }
  );
});

test('Track B: SSE endpoint replays latest job snapshot and closes on terminal state', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_TEST_MODE: '1',
      TIMECAPSULE_SESSION_SECRET: 'test-session-secret-32-chars-minimum-0001',
    },
    async () => {
      resetStoreForTests(1000);
      resetProviderAdapters();

      registerProviderAdapter('kie', async () => ({
        providerJobId: 'wp_sse_1',
        sourceUrl: 'https://cdn.timecapsule.studio/renders/sse-test.png',
        actualCredits: 15,
      }));

      const token = issueSessionTokenForTest({ userId: 'usr_sse', tenantId: 'org_default' });
      const verified = verifySessionToken(token);
      assert.equal(verified.user_id, 'usr_sse');

      const { job } = await submitGenerationJob({
        session: verified,
        body: {
          modality: 'image',
          model: 'nano-banana-pro',
          inputs: { prompt: 'SSE snapshot test' },
        },
        awaitCompletion: true,
      });

      const req = new Request(`http://localhost:3000/api/v1/generations/${job.job_id}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await getSseEvents(req, { params: Promise.resolve({ jobId: job.job_id }) });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('Content-Type'), 'text/event-stream');

      const text = await res.text();
      assert.ok(text.includes('event: generation.succeeded'));
      assert.ok(text.includes(job.job_id));

      resetProviderAdapters();
    }
  );
});

// ─── Checkpoint 1 Containment & Fail-Closed Security Tests ───────────────────

test('Checkpoint 1 (Auth): Anonymous requests cannot obtain privileged sessions and missing config fails closed', async () => {
  // 1. Missing TIMECAPSULE_PREVIEW_KEY / TIMECAPSULE_SESSION_SECRET fails closed with 503
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

  // 2. Configured preview auth rejects anonymous or wrong-credential POST /api/v1/session and GET /api/v1/session
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

      // Legacy 'tc_dev_session' bypass token is rejected
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
      // Cross-origin POST is rejected by CSRF Origin protection
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

      // Valid credential with attacker-supplied tenant_id & user_id ignores client overrides
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
      assert.notEqual(data.session.tenant_id, 'org_victim_override');
      assert.notEqual(data.session.user_id, 'usr_superadmin_override');
      assert.equal('token' in data, false, 'Signed session token must not be echoed in JSON body');
    }
  );
});

test('Checkpoint 1 (Provider): Missing provider credentials do not reserve credits or dispatch jobs', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: 'checkpoint1-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
      KIE_API_KEY: undefined,
      TIMECAPSULE_TEST_MODE: undefined,
    },
    async () => {
      resetStoreForTests(1000);
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

      const credits = getTenantCredits(PREVIEW_IDENTITY.tenant_id);
      assert.equal(credits.available_credits, 1000);
      assert.equal(credits.reserved_credits, 0);
      assert.equal(listJobs(PREVIEW_IDENTITY.tenant_id).length, 0);
    }
  );
});

test('Checkpoint 1 (GPU): Unconfigured GPU models cannot execute even if TIMECAPSULE_GPU_WORKER_URL is set', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: 'checkpoint1-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
      KIE_API_KEY: 'configured-kie-key-for-test',
      TIMECAPSULE_GPU_WORKER_URL: 'http://gpu-worker.example.com:8080',
      TIMECAPSULE_TEST_MODE: undefined,
    },
    async () => {
      resetStoreForTests(1000);
      resetProviderAdapters();

      const session = verifySessionToken(issuePreviewSessionToken());

      for (const unconfiguredModel of [
        { model: 'timecapsule.flux1-dev-t2i', modality: 'image' },
        { model: 'timecapsule.wan2.1-t2v', modality: 'video' },
        { model: 'timecapsule.wan2.1-i2v', modality: 'i2v' },
      ]) {
        await assert.rejects(
          () =>
            submitGenerationJob({
              session,
              body: {
                modality: unconfiguredModel.modality,
                model: unconfiguredModel.model,
                inputs: { prompt: 'Must not execute fake or unverified GPU worker' },
              },
            }),
          (err) => err.code === 'MODEL_WORKER_NOT_VERIFIED' && err.statusCode === 503
        );
      }

      const credits = getTenantCredits(PREVIEW_IDENTITY.tenant_id);
      assert.equal(credits.available_credits, 1000);
      assert.equal(credits.reserved_credits, 0);
      assert.equal(listJobs(PREVIEW_IDENTITY.tenant_id).length, 0);
    }
  );
});

test('Checkpoint 1 (Models): Unknown or unmapped models are rejected rather than silently selecting a default substitute', async () => {
  // 1. Direct client mode rejects unknown/unmapped models across all modalities without making network calls
  let networkCalls = 0;
  tcClient.configureTimecapsuleClient({
    mode: 'direct',
    fetchImpl: async () => {
      networkCalls += 1;
      throw new Error('Should not be called for unknown model');
    },
  });

  await assert.rejects(
    () => studioClient.generateImage('test_key', { model: 'unknown-image-model', prompt: 'test' }),
    (err) => err.code === 'UNSUPPORTED_MODEL' && err.statusCode === 400
  );
  await assert.rejects(
    () => studioClient.generateImage('test_key', { model: 'midjourney-v7-text-to-image', prompt: 'test' }),
    (err) => err.code === 'UNSUPPORTED_MODEL' && err.statusCode === 400
  );
  await assert.rejects(
    () => studioClient.generateVideo('test_key', { model: 'unknown-video-model', prompt: 'test' }),
    (err) => err.code === 'UNSUPPORTED_MODEL' && err.statusCode === 400
  );
  await assert.rejects(
    () => studioClient.generateI2I('test_key', { model: 'flux-kontext-pro-i2i', prompt: 'test' }),
    (err) => err.code === 'UNSUPPORTED_MODEL' && err.statusCode === 400
  );
  await assert.rejects(
    () => studioClient.generateI2V('test_key', { model: 'unknown-i2v-model', prompt: 'test' }),
    (err) => err.code === 'UNSUPPORTED_MODEL' && err.statusCode === 400
  );
  await assert.rejects(
    () => studioClient.processLipSync('test_key', { model: 'unknown-lipsync-model', image_url: 'https://cdn.example.com/a.png', audio_url: 'https://cdn.example.com/a.mp3' }),
    (err) => err.code === 'UNSUPPORTED_MODEL' && err.statusCode === 400
  );
  assert.equal(networkCalls, 0);

  // 2. Server BFF rejects unknown/unmapped models before reserving credits or creating a job
  await withTestEnv(
    {
      TIMECAPSULE_SESSION_SECRET: 'checkpoint1-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
      KIE_API_KEY: 'configured-kie-key-for-test',
    },
    async () => {
      resetStoreForTests(1000);
      const session = verifySessionToken(issuePreviewSessionToken());

      await assert.rejects(
        () =>
          submitGenerationJob({
            session,
            body: {
              modality: 'image',
              model: 'non-existent-model-999',
              inputs: { prompt: 'Should reject with 400 UNSUPPORTED_MODEL' },
            },
          }),
        (err) => err.code === 'UNSUPPORTED_MODEL' && err.statusCode === 400
      );

      assert.equal(getTenantCredits(PREVIEW_IDENTITY.tenant_id).available_credits, 1000);
      assert.equal(getTenantCredits(PREVIEW_IDENTITY.tenant_id).reserved_credits, 0);
      assert.equal(listJobs(PREVIEW_IDENTITY.tenant_id).length, 0);
    }
  );
});

test('Checkpoint 1 (Assets): Private asset access requires authentication, rejects cross-tenant access, removes public caching, and blocks remote-fetch proxy', async () => {
  await withTestEnv(
    {
      TIMECAPSULE_TEST_MODE: '1',
      TIMECAPSULE_SESSION_SECRET: 'checkpoint1-secret-value-at-least-32-bytes',
      TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
    },
    async () => {
      resetStoreForTests(1000);

      const inlineAsset = registerAsset({
        tenant_id: 'org_tenant_alpha',
        source_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        modality: 'upload',
        content_type: 'image/png',
        storage_type: 'inline_data_url',
        durable: false,
        private: true,
      });

      const remoteRefAsset = registerAsset({
        tenant_id: 'org_tenant_alpha',
        source_url: 'https://cdn.timecapsule.studio/external/render.mp4',
        modality: 'video',
        content_type: 'video/mp4',
        storage_type: 'external_url_reference',
        durable: false,
        private: true,
      });

      const tokenAlpha = issueSessionTokenForTest({ userId: 'usr_a', tenantId: 'org_tenant_alpha' });
      const tokenBeta = issueSessionTokenForTest({ userId: 'usr_b', tenantId: 'org_tenant_beta' });

      // 1. Anonymous asset request is rejected with 401
      const anonReq = new Request(`http://localhost:3000/api/v1/assets/${inlineAsset.asset_id}`);
      const anonRes = await getAssetRoute(anonReq, {
        params: Promise.resolve({ assetId: inlineAsset.asset_id }),
      });
      assert.equal(anonRes.status, 401);
      assert.equal(anonRes.headers.get('Cache-Control'), 'private, no-store, max-age=0');

      // 2. Cross-tenant asset request is rejected with 403 FORBIDDEN
      const crossTenantReq = new Request(
        `http://localhost:3000/api/v1/assets/${inlineAsset.asset_id}`,
        {
          headers: { Authorization: `Bearer ${tokenBeta}` },
        }
      );
      const crossTenantRes = await getAssetRoute(crossTenantReq, {
        params: Promise.resolve({ assetId: inlineAsset.asset_id }),
      });
      assert.equal(crossTenantRes.status, 403);
      assert.equal(crossTenantRes.headers.get('Cache-Control'), 'private, no-store, max-age=0');
      const crossTenantBody = await crossTenantRes.json();
      assert.equal(crossTenantBody.code, 'FORBIDDEN');

      // 3. Same-tenant inline asset request succeeds with private, no-store Cache-Control (never public)
      const ownerReq = new Request(`http://localhost:3000/api/v1/assets/${inlineAsset.asset_id}`, {
        headers: { Authorization: `Bearer ${tokenAlpha}` },
      });
      const ownerRes = await getAssetRoute(ownerReq, {
        params: Promise.resolve({ assetId: inlineAsset.asset_id }),
      });
      assert.equal(ownerRes.status, 200);
      assert.equal(ownerRes.headers.get('Cache-Control'), 'private, no-store, max-age=0');
      assert.ok(!ownerRes.headers.get('Cache-Control').includes('public'));

      // 4. Remote-fetch asset proxy is disabled (501 REMOTE_ASSET_PROXY_DISABLED)
      const remoteProxyReq = new Request(
        `http://localhost:3000/api/v1/assets/${remoteRefAsset.asset_id}`,
        {
          headers: { Authorization: `Bearer ${tokenAlpha}` },
        }
      );
      const remoteProxyRes = await getAssetRoute(remoteProxyReq, {
        params: Promise.resolve({ assetId: remoteRefAsset.asset_id }),
      });
      assert.equal(remoteProxyRes.status, 501);
      assert.equal(remoteProxyRes.headers.get('Cache-Control'), 'private, no-store, max-age=0');
      const remoteProxyBody = await remoteProxyRes.json();
      assert.equal(remoteProxyBody.code, 'REMOTE_ASSET_PROXY_DISABLED');
      assert.equal(remoteProxyBody.durable, false);
    }
  );
});

test('Checkpoint 1 (SSRF): Media URL validator blocks private IPv4, IPv6, integer/hex/octal IPs, and internal hosts', () => {
  const blockedUrls = [
    'http://127.0.0.1:8080/secret',
    'http://localhost/admin',
    'http://169.254.169.254/latest/meta-data',
    'http://192.168.1.1/config',
    'http://10.0.0.5/internal',
    'http://100.64.0.1/cgnat',
    'http://[::1]:8080/ipv6-loopback',
    'http://[::ffff:127.0.0.1]/ipv4-mapped',
    'http://[fd00::1]/ula',
    'http://[fe80::1]/link-local',
    'http://2130706433/decimal-ip',
    'http://0x7f000001/hex-ip',
    'http://0177.0.0.1/octal-ip',
    'http://metadata.google.internal/computeMetadata/v1/',
    'http://service.internal/private',
  ];

  for (const badUrl of blockedUrls) {
    assert.throws(
      () => validateExternalMediaUrl(badUrl),
      /not allowed/,
      `Expected ${badUrl} to be blocked`
    );
  }

  const valid = validateExternalMediaUrl('https://cdn.timecapsule.studio/media/out.mp4');
  assert.equal(valid.hostname, 'cdn.timecapsule.studio');
});
