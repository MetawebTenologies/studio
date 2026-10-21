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
} from '../packages/timecapsule/src/server/store.js';
import {
  issueSessionToken,
  verifySessionToken,
} from '../packages/timecapsule/src/server/auth.js';
import {
  registerProviderAdapter,
  resetProviderAdapters,
} from '../packages/timecapsule/src/server/providers.js';
import { submitGenerationJob } from '../packages/timecapsule/src/server/orchestrator.js';
import { validateExternalMediaUrl } from '../packages/timecapsule/src/server/media.js';
import { GET as getSseEvents } from '../app/api/v1/generations/[jobId]/events/route.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

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

test('Track A: Model catalog seam preserves all 29 upstream exports and adds Timecapsule native models', () => {
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

  // Verify Timecapsule Track C self-hosted models resolve with explicit provider metadata
  const tcVideoModel = tcModels.getVideoModelById('timecapsule.wan2.1-t2v');
  assert.ok(tcVideoModel);
  assert.equal(tcVideoModel.provider, 'timecapsule-gpu');
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
            provider: 'timecapsule-gpu',
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
            provider: 'timecapsule-gpu',
            output: { url: 'https://cdn.timecapsule.studio/outputs/job_bff_999.mp4' },
          }),
        };
      }
      throw new Error(`Unexpected BFF URL: ${url}`);
    },
  });

  const videoRes = await studioClient.generateVideo('TIMECAPSULE_BFF', {
    model: 'timecapsule.wan2.1-t2v',
    prompt: 'Cyberpunk rain reflection',
    duration: 5,
    resolution: '1080p',
  });

  assert.equal(videoRes.url, 'https://cdn.timecapsule.studio/outputs/job_bff_999.mp4');
  assert.equal(videoRes.id, 'job_bff_999');
  assert.equal(bffRequests[0].url, '/api/v1/generations');
  assert.ok(bffRequests[0].headers['Idempotency-Key']);
  assert.equal(bffRequests[0].body.model, 'timecapsule.wan2.1-t2v');
});

test('Track B: BFF Orchestrator enforces idempotency, credit reservation, settlement, and refund on failure', async () => {
  resetStoreForTests(500);
  resetProviderAdapters();

  registerProviderAdapter('timecapsule-gpu', async (job, { onProgress }) => {
    onProgress({ stage: 'diffusion', progress: 0.5, providerJobId: 'wp_101', frame: 50, total_frames: 100 });
    return {
      providerJobId: 'wp_101',
      sourceUrl: 'https://cdn.timecapsule.studio/renders/wan21.mp4',
      actualCredits: 240,
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
      model: 'timecapsule.wan2.1-t2v',
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
  assert.equal(first.job.provider, 'timecapsule-gpu');
  assert.equal(first.job.actual_cost, 240);
  assert.equal(getTenantCredits('org_default').available_credits, 260);

  // 2. Duplicate submission with same Idempotency-Key returns same job without charging again
  const duplicate = await submitGenerationJob({
    session,
    idempotencyKey: 'idem_key_001',
    body: {
      project_id: 'prj_cinema',
      modality: 'video',
      model: 'timecapsule.wan2.1-t2v',
      inputs: { prompt: 'Aerial shot of glacier' },
    },
    awaitCompletion: true,
  });

  assert.equal(duplicate.deduplicated, true);
  assert.equal(duplicate.job.job_id, first.job.job_id);
  assert.equal(getTenantCredits('org_default').available_credits, 260);

  // 3. Failing provider releases reserved credits back to tenant
  registerProviderAdapter('timecapsule-gpu', async () => {
    throw new Error('Simulated GPU worker OOM');
  });

  const failedRun = await submitGenerationJob({
    session,
    idempotencyKey: 'idem_key_002',
    body: {
      modality: 'video',
      model: 'timecapsule.wan2.1-t2v',
      inputs: { prompt: 'Will fail and refund credits' },
    },
    awaitCompletion: true,
  });

  const updatedFailedJob = getJob(failedRun.job.job_id);
  assert.equal(updatedFailedJob.status, 'failed');
  assert.equal(getTenantCredits('org_default').available_credits, 260);
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
          model: 'timecapsule.wan2.1-t2v',
          inputs: { prompt: 'Costs 240 credits' },
        },
      }),
    (err) => err.code === 'INSUFFICIENT_CREDITS' && err.statusCode === 402
  );

  resetProviderAdapters();
});

test('Track B: SSE endpoint replays latest job snapshot and closes on terminal state', async () => {
  resetStoreForTests(1000);
  resetProviderAdapters();

  registerProviderAdapter('timecapsule-gpu', async () => ({
    providerJobId: 'wp_sse_1',
    sourceUrl: 'https://cdn.timecapsule.studio/renders/sse-test.png',
    actualCredits: 25,
  }));

  const token = issueSessionToken({ userId: 'usr_sse', tenantId: 'org_default' });
  const verified = verifySessionToken(token);
  assert.equal(verified.user_id, 'usr_sse');

  const { job } = await submitGenerationJob({
    session: verified,
    body: {
      modality: 'image',
      model: 'timecapsule.flux1-dev-t2i',
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
});

test('Track B: Media ingestion blocks private/loopback SSRF hosts', () => {
  assert.throws(() => validateExternalMediaUrl('http://127.0.0.1:8080/secret'), /not allowed/);
  assert.throws(() => validateExternalMediaUrl('http://localhost/admin'), /not allowed/);
  assert.throws(() => validateExternalMediaUrl('http://169.254.169.254/latest/meta-data'), /not allowed/);
  assert.throws(() => validateExternalMediaUrl('http://192.168.1.1/config'), /not allowed/);
  assert.throws(() => validateExternalMediaUrl('http://10.0.0.5/internal'), /not allowed/);

  const valid = validateExternalMediaUrl('https://cdn.timecapsule.studio/media/out.mp4');
  assert.equal(valid.hostname, 'cdn.timecapsule.studio');
});
