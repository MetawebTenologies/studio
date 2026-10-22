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
import { GET as getJobDetailRoute } from '../app/api/v1/generations/[jobId]/route.js';
import { GET as getSseEvents } from '../app/api/v1/generations/[jobId]/events/route.js';
import { GET as getAssetRoute } from '../app/api/v1/assets/[assetId]/route.js';
import { POST as postUploadsRoute } from '../app/api/v1/uploads/route.js';
import { GET as getModelsRoute } from '../app/api/v1/models/route.js';

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
  const veoGenerateRequests = [];
  const veoRecordInfoRequests = [];
  const uploadRequests = [];
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
        if (req.method === 'POST' && urlObj.pathname === '/api/file-base64-upload') {
          const parsed = rawBody ? JSON.parse(rawBody) : {};
          uploadRequests.push({
            headers: req.headers,
            body: parsed,
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              code: 200,
              data: {
                downloadUrl: `https://cdn.timecapsule.studio/kie-uploads/${parsed.fileName || 'upload.png'}`,
              },
            })
          );
          return;
        }

        if (req.method === 'POST' && urlObj.pathname === '/api/v1/veo/generate') {
          const parsed = rawBody ? JSON.parse(rawBody) : {};
          veoGenerateRequests.push({
            headers: req.headers,
            body: parsed,
          });
          taskCounter += 1;
          const taskId = `fake_veo_task_${taskCounter}`;
          tasks.set(taskId, {
            taskId,
            polls: 0,
            requestBody: parsed,
            isVeo: true,
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ code: 200, data: { taskId } }));
          return;
        }

        if (req.method === 'GET' && urlObj.pathname === '/api/v1/veo/record-info') {
          const taskId = urlObj.searchParams.get('taskId');
          veoRecordInfoRequests.push({
            taskId,
            headers: req.headers,
          });
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
                  successFlag: 0,
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
                successFlag: 1,
                response: {
                  resultUrls: [
                    handlerOptions.resultUrl ||
                      `https://cdn.timecapsule.studio/outputs/${taskId}.mp4`,
                  ],
                },
              },
            })
          );
          return;
        }

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
    veoGenerateRequests,
    veoRecordInfoRequests,
    uploadRequests,
    tasks,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/**
 * Starts a local fake Muapi HTTP provider server on 127.0.0.1:0.
 * Matches verified api.muapi.ai/api/v1/* endpoints (`x-api-key`, `request_id`, `/predictions/{id}/result`, `/upload_file`).
 */
async function startFakeMuapiProviderServer(handlerOptions = {}) {
  const submitRequests = [];
  const pollRequests = [];
  const uploadRequests = [];
  let reqCounter = 0;
  const predictions = new Map();

  const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url, 'http://127.0.0.1');
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      const rawBuffer = Buffer.concat(chunks);
      const rawText = rawBuffer.toString('utf8');
      try {
        if (req.method === 'POST' && urlObj.pathname === '/api/v1/upload_file') {
          uploadRequests.push({
            headers: req.headers,
            byteLength: rawBuffer.byteLength,
            rawPreview: rawText.slice(0, 256),
          });
          if (handlerOptions.onUpload) {
            const custom = await handlerOptions.onUpload(req, res, rawBuffer);
            if (custom !== undefined) return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              url:
                handlerOptions.uploadResultUrl ||
                'https://cdn.timecapsule.studio/muapi-uploads/input_asset.png',
            })
          );
          return;
        }

        const pollMatch = urlObj.pathname.match(/^\/api\/v1\/predictions\/([^/]+)\/result$/);
        if (req.method === 'GET' && pollMatch) {
          const requestId = decodeURIComponent(pollMatch[1]);
          pollRequests.push({
            requestId,
            headers: req.headers,
          });

          if (handlerOptions.onPoll) {
            const custom = await handlerOptions.onPoll(requestId, req, res, {
              pollRequests,
              predictions,
            });
            if (custom !== undefined) return;
          }

          const entry = predictions.get(requestId) || {
            requestId,
            endpoint: 'nano-banana-pro',
            polls: 0,
          };
          entry.polls += 1;
          predictions.set(requestId, entry);

          const requiredPolls = handlerOptions.pollsBeforeSuccess || 1;
          if (entry.polls < requiredPolls) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                request_id: requestId,
                status: 'processing',
                progress: 50,
              })
            );
            return;
          }

          if (handlerOptions.failOnPoll) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                request_id: requestId,
                status: 'failed',
                error: handlerOptions.failMessage || 'Muapi model execution failed',
              })
            );
            return;
          }

          const isVideo =
            entry.endpoint.includes('t2v') ||
            entry.endpoint.includes('i2v') ||
            entry.endpoint.includes('video');
          const ext = isVideo ? 'mp4' : 'png';
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              request_id: requestId,
              status: 'completed',
              outputs: [
                handlerOptions.resultUrl ||
                  `https://cdn.timecapsule.studio/muapi-outputs/${requestId}.${ext}`,
              ],
              cost: handlerOptions.providerCost ?? 0.08,
            })
          );
          return;
        }

        const submitMatch = urlObj.pathname.match(/^\/api\/v1\/([^/]+)$/);
        if (req.method === 'POST' && submitMatch) {
          const endpoint = submitMatch[1];
          const parsed = rawText ? JSON.parse(rawText) : {};
          submitRequests.push({
            endpoint,
            headers: req.headers,
            body: parsed,
          });

          if (handlerOptions.onSubmit) {
            const custom = await handlerOptions.onSubmit(endpoint, parsed, req, res, {
              submitRequests,
              predictions,
            });
            if (custom !== undefined) return;
          }

          reqCounter += 1;
          const requestId = `fake_muapi_req_${reqCounter}`;
          predictions.set(requestId, {
            requestId,
            endpoint,
            polls: 0,
            requestBody: parsed,
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              request_id: requestId,
              status: 'processing',
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
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  return {
    baseUrl,
    submitRequests,
    pollRequests,
    uploadRequests,
    predictions,
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
    'README.md',
    'packages/studio/package.json',
    'packages/timecapsule/src/branding.js',
    'electron/main.js',
    'docker-compose.yml',
    '.env.example',
  ];

  const forbiddenStrings = [
    'Matai',
    'OPEN-HIGGSFIELD',
    'Anil-matcha',
    'muapi.ai/open-higgsfield-ai',
    'Open Higgsfield',
  ];

  // Documented exemption for the single attribution line in README.md:
  const README_ATTRIBUTION_EXEMPTION = 'Based on the MIT-licensed Open-Higgsfield-AI project.';

  for (const relPath of filesToCheck) {
    let content = fs.readFileSync(path.join(repoRoot, relPath), 'utf8');

    // Documented exemption: strip allowed attribution sentence from README before checks
    if (relPath === 'README.md') {
      content = content.replace(README_ATTRIBUTION_EXEMPTION, '');
    }

    for (const forbidden of forbiddenStrings) {
      assert.ok(
        !content.toLowerCase().includes(forbidden.toLowerCase()),
        `${relPath} must not contain forbidden legacy string '${forbidden}'`
      );
    }
    assert.ok(
      !content.includes('muapi.ai/open-higgsfield-ai'),
      `${relPath} must not reference legacy 'muapi.ai/open-higgsfield-ai' URL`
    );
  }
});

test('Track A: Forbidden-copy guard prevents verbatim Muapi taglines in UI and components', () => {
  const uiFilesToCheck = [
    'app/page.js',
    'app/explore/page.js',
    'app/pricing/page.js',
    'app/dashboard/page.js',
    'app/usage/page.js',
    'app/cli/page.js',
    'app/rankings/page.js',
    'app/docs/page.js',
    'app/blog/page.js',
    'app/billing/page.js',
    'app/referral/page.js',
    'app/api-keys/page.js',
    'app/workflows/page.js',
    'app/white-label/page.js',
    'app/docs/white-label/page.js',
    'components/PlatformNav.js',
    'components/PlatformFooter.js',
  ];

  const forbiddenTaglines = [
    'One API for All AI Models',
    'Lowest cost API for image, video and audio generation',
    'One API for all state-of-the-art AI models',
    'Build, scale, and deploy generative AI workflows at the lowest cost',
    'cdn.muapi.ai',
  ];

  for (const relPath of uiFilesToCheck) {
    const fullPath = path.join(repoRoot, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');

    for (const tagline of forbiddenTaglines) {
      assert.ok(
        !content.toLowerCase().includes(tagline.toLowerCase()),
        `${relPath} must not contain verbatim reference tagline '${tagline}'`
      );
    }
  }
});

test('TC-WL-PATCH-1: White-label claims & guardrails (no Stripe Connect, no Vercel IP, waitlist CTA present, honest badges)', () => {
  // (a) Assert "Stripe Connect" never appears in app/**
  function scanDirForForbiddenString(dir, forbiddenStr) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirForForbiddenString(fullPath, forbiddenStr);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx') || entry.name.endsWith('.md'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.ok(
          !content.toLowerCase().includes(forbiddenStr.toLowerCase()),
          `File ${fullPath} must not contain forbidden phrase '${forbiddenStr}'`
        );
      }
    }
  }
  scanDirForForbiddenString(path.join(repoRoot, 'app'), 'Stripe Connect');

  // (b) Assert no hardcoded Vercel IP literals in docs
  const docsContent = fs.readFileSync(path.join(repoRoot, 'app/docs/white-label/page.js'), 'utf8');
  assert.ok(!docsContent.includes('76.76.21.21'), 'app/docs/white-label/page.js must not contain Vercel IP 76.76.21.21');

  // (c) Assert waitlist CTA exists on /white-label
  const wlContent = fs.readFileSync(path.join(repoRoot, 'app/white-label/page.js'), 'utf8');
  assert.ok(wlContent.includes('Join the Design-Partner Waitlist'), 'Waitlist CTA must exist on /white-label');
  assert.ok(wlContent.includes('50% off for 12 months'), '50% off incentive must be documented on /white-label');

  // (d) Assert no "SLA" guarantee in pricing tier
  assert.ok(!wlContent.includes('Uptime SLA'), 'Scale tier must not contain SLA agreement');
  assert.ok(!wlContent.includes('BYO-GPU provider keys'), 'Scale tier must not advertise unratified BYO-GPU keys');
  assert.ok(!wlContent.includes('dedicated proxy IP'), 'Scale tier must not advertise unratified dedicated proxy IP');
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
  assert.ok(tcModels.getI2IModelById('nano-banana-pro-edit'));
  assert.ok(tcModels.getVideoModelById('seedance-pro-t2v'));
  assert.ok(tcModels.getVideoModelById('veo3.1-fast-text-to-video'));
  assert.ok(tcModels.getI2VModelById('seedance-pro-i2v'));
  assert.ok(tcModels.getI2VModelById('veo3.1-fast-image-to-video'));

  // Unverified catalog_only models are excluded from active release pickers and preserved in inheritedUpstreamCatalog
  assert.equal(tcModels.getVideoModelById('veo3.1-text-to-video'), undefined);
  assert.equal(tcModels.getI2VModelById('seedance-v2.0-i2v'), undefined);
  assert.equal(tcModels.getLipSyncModelById('sync-lipsync')?.verification_status, 'disabled');
  assert.equal(tcModels.getLipSyncModelById('sync-lipsync')?.enabled, false);
  assert.equal(
    tcModels.getV2VModelById('video-watermark-remover')?.verification_status,
    'disabled'
  );
  assert.equal(tcModels.getV2VModelById('video-watermark-remover')?.enabled, false);
  assert.ok(
    tcModels.inheritedUpstreamCatalog.t2v.some(
      (m) => m.id === 'veo3.1-text-to-video' && m.verification_status === 'catalog_only'
    )
  );
  assert.ok(
    tcModels.inheritedUpstreamCatalog.i2v.some(
      (m) => m.id === 'seedance-v2.0-i2v' && m.verification_status === 'catalog_only'
    )
  );

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

      // Unverified catalog-only model rejected before reservation
      await assert.rejects(
        () =>
          submitGenerationJob({
            session,
            body: {
              modality: 'video',
              model: 'veo3.1-text-to-video',
              inputs: { prompt: 'Unverified catalog_only model must fail closed before reservation' },
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
    model: 'nano-banana-pro-edit',
    inputs: {
      prompt: 'blend',
      image_urls: ['https://cdn.example.com/1.png', 'https://cdn.example.com/2.png'],
    },
  });
  const arr2 = normalizeAndFingerprintGenerationRequest({
    modality: 'i2i',
    model: 'nano-banana-pro-edit',
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
      TIMECAPSULE_DEFAULT_PROVIDER: 'kie',
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
      TIMECAPSULE_DEFAULT_PROVIDER: 'kie',
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
      TIMECAPSULE_DEFAULT_PROVIDER: 'kie',
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
        TIMECAPSULE_DEFAULT_PROVIDER: 'kie',
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
        TIMECAPSULE_DEFAULT_PROVIDER: 'kie',
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
        TIMECAPSULE_DEFAULT_PROVIDER: 'kie',
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
});

// ─── Checkpoint 3A Verified Provider Contracts & Muapi Integration Tests ────

test('Checkpoint 3A (Muapi Core Workflows): Muapi T2I, I2I, T2V, and I2V submission, polling, completion, and failure', async () => {
  const fakeMuapi = await startFakeMuapiProviderServer({
    pollsBeforeSuccess: 2,
    providerCost: 0.15,
  });

  try {
    await withTestEnv(
      {
        TIMECAPSULE_SESSION_SECRET: 'checkpoint3a-secret-value-at-least-32-bytes',
        TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
        MUAPI_API_KEY: 'muapi-secret-key-do-not-expose',
        KIE_API_KEY: undefined,
        TIMECAPSULE_DEFAULT_PROVIDER: undefined,
        TIMECAPSULE_MUAPI_BASE_URL: fakeMuapi.baseUrl,
      },
      async () => {
        await resetStoreForTests(2000);
        const session = verifySessionToken(issuePreviewSessionToken());
        const worker = createDurableWorker({
          workerId: 'wrk_muapi_workflows',
          providerPollDelayMs: 10,
        });

        // 1. Muapi T2I (`nano-banana-pro`)
        const t2iSub = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_muapi_t2i',
          body: {
            modality: 'image',
            model: 'nano-banana-pro',
            inputs: {
              prompt: 'Obsidian monolith on Europa',
              aspect_ratio: '16:9',
              resolution: '2k',
            },
          },
        });
        assert.equal(t2iSub.job.provider, 'muapi');
        assert.equal(t2iSub.job.resolved_provider_model, 'nano-banana-pro');
        assert.equal(t2iSub.job.execution_route, 'muapi:predictions/v1:nano-banana-pro');
        assert.equal(t2iSub.job.pricing_policy_version, 'tc-pricing-v1');

        // 2. Muapi I2I (`nano-banana-pro-edit`)
        const i2iSub = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_muapi_i2i',
          body: {
            modality: 'i2i',
            model: 'nano-banana-pro-edit',
            inputs: {
              prompt: 'Add aurora borealis in sky',
              image_urls: ['https://cdn.timecapsule.studio/muapi-uploads/ref1.png'],
              aspect_ratio: '16:9',
              resolution: '1k',
            },
          },
        });
        assert.equal(i2iSub.job.provider, 'muapi');
        assert.equal(i2iSub.job.resolved_provider_model, 'nano-banana-pro-edit');
        assert.equal(i2iSub.job.execution_route, 'muapi:predictions/v1:nano-banana-pro-edit');

        // 3. Muapi T2V (`seedance-pro-t2v`)
        const t2vSub = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_muapi_t2v',
          body: {
            modality: 'video',
            model: 'seedance-pro-t2v',
            inputs: {
              prompt: 'Slow dolly shot into bioluminescent cave',
              aspect_ratio: '16:9',
              resolution: '1080p',
              duration_seconds: 5,
            },
          },
        });
        assert.equal(t2vSub.job.provider, 'muapi');
        assert.equal(t2vSub.job.resolved_provider_model, 'seedance-pro-t2v');
        assert.equal(t2vSub.job.execution_route, 'muapi:predictions/v1:seedance-pro-t2v');

        // 4. Muapi I2V (`seedance-pro-i2v`)
        const i2vSub = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_muapi_i2v',
          body: {
            modality: 'i2v',
            model: 'seedance-pro-i2v',
            inputs: {
              prompt: 'Camera orbits subject in slow motion',
              image_url: 'https://cdn.timecapsule.studio/muapi-uploads/start_frame.png',
              aspect_ratio: '16:9',
              resolution: '720p',
              duration_seconds: 5,
            },
          },
        });
        assert.equal(i2vSub.job.provider, 'muapi');
        assert.equal(i2vSub.job.resolved_provider_model, 'seedance-pro-i2v');
        assert.equal(i2vSub.job.execution_route, 'muapi:predictions/v1:seedance-pro-i2v');

        await worker.drainUntilSettled({ waitMs: 15, maxIterations: 50 });

        // Verify exact Muapi endpoints and payloads
        const endpointsCalled = fakeMuapi.submitRequests.map((r) => r.endpoint);
        assert.deepEqual(endpointsCalled, [
          'nano-banana-pro',
          'nano-banana-pro-edit',
          'seedance-pro-t2v',
          'seedance-pro-i2v',
        ]);
        for (const req of fakeMuapi.submitRequests) {
          assert.equal(req.headers['x-api-key'], 'muapi-secret-key-do-not-expose');
        }
        assert.equal(fakeMuapi.submitRequests[0].body.resolution, '2k');
        assert.deepEqual(fakeMuapi.submitRequests[1].body.images_list, [
          'https://cdn.timecapsule.studio/muapi-uploads/ref1.png',
        ]);
        assert.equal(fakeMuapi.submitRequests[2].body.quality, 'high');
        assert.equal(
          fakeMuapi.submitRequests[3].body.image_url,
          'https://cdn.timecapsule.studio/muapi-uploads/start_frame.png'
        );
        assert.equal(fakeMuapi.submitRequests[3].body.quality, 'medium');

        for (const sub of [t2iSub, i2iSub, t2vSub, i2vSub]) {
          const done = await getJob(sub.job.job_id);
          assert.equal(done.status, 'succeeded');
          assert.equal(done.provider, 'muapi');
          assert.equal(done.provider_reported_cost, 0.15);
          assert.equal(done.provider_cost_unit, 'muapi_usd');
          assert.equal(done.user_billed_credits, sub.job.estimated_cost);
          assert.ok(done.output?.url?.startsWith('https://cdn.timecapsule.studio/muapi-outputs/'));
        }

        // 5. Verify Muapi terminal failure releases credits cleanly
        const failMuapi = await startFakeMuapiProviderServer({
          pollsBeforeSuccess: 1,
          failOnPoll: true,
          failMessage: 'Muapi content safety filter triggered',
        });
        try {
          await withTestEnv({ TIMECAPSULE_MUAPI_BASE_URL: failMuapi.baseUrl }, async () => {
            const creditsBeforeFail = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
            const failSub = await submitGenerationJob({
              session,
              idempotencyKey: 'idem_muapi_fail_1',
              body: {
                modality: 'image',
                model: 'nano-banana-pro',
                inputs: { prompt: 'Trigger failure on poll', resolution: '1k' },
              },
            });
            await worker.drainUntilSettled({ waitMs: 15 });
            const failedJob = await getJob(failSub.job.job_id);
            assert.equal(failedJob.status, 'failed');
            assert.match(failedJob.error, /Muapi content safety filter triggered/);
            const creditsAfterFail = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
            assert.equal(creditsAfterFail.total_credits, creditsBeforeFail.total_credits);
            assert.equal(creditsAfterFail.reserved_credits, 0);
          });
        } finally {
          await failMuapi.close();
        }
      }
    );
  } finally {
    await fakeMuapi.close();
  }
});

test('Checkpoint 3A (Kie Alternative & Dedicated Veo Routes): Explicit Kie alternative execution for image/video and dedicated Kie Veo route', async () => {
  const fakeKie = await startFakeKieProviderServer({
    pollsBeforeSuccess: 2,
  });

  try {
    await withTestEnv(
      {
        TIMECAPSULE_SESSION_SECRET: 'checkpoint3a-secret-value-at-least-32-bytes',
        TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
        MUAPI_API_KEY: 'muapi-key-present',
        KIE_API_KEY: 'kie-explicit-alt-key',
        TIMECAPSULE_KIE_BASE_URL: fakeKie.baseUrl,
      },
      async () => {
        await resetStoreForTests(1500);
        const session = verifySessionToken(issuePreviewSessionToken());
        const worker = createDurableWorker({
          workerId: 'wrk_kie_alt',
          providerPollDelayMs: 10,
        });

        // 1. Explicit provider='kie' for image (`nano-banana-pro`)
        const kieImg = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_kie_alt_img',
          body: {
            modality: 'image',
            model: 'nano-banana-pro',
            provider: 'kie',
            inputs: { prompt: 'Kie alternative image', resolution: '2k', aspect_ratio: '1:1' },
          },
        });
        assert.equal(kieImg.job.provider, 'kie');
        assert.equal(kieImg.job.execution_route, 'kie:market-jobs/v1:nano-banana-pro');

        // 2. Explicit provider='kie' for video (`seedance-pro-t2v`)
        const kieVid = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_kie_alt_vid',
          body: {
            modality: 'video',
            model: 'seedance-pro-t2v',
            provider: 'kie',
            inputs: { prompt: 'Kie alternative video', duration_seconds: 5, resolution: '1080p' },
          },
        });
        assert.equal(kieVid.job.provider, 'kie');
        assert.equal(kieVid.job.resolved_provider_model, 'bytedance/seedance-1.5-pro');
        assert.equal(kieVid.job.execution_route, 'kie:market-jobs/v1:bytedance/seedance-1.5-pro');

        // 3. Dedicated Kie Veo route (`veo3.1-fast-text-to-video` -> `kie:veo/v1:veo3_fast`)
        const veoVid = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_kie_veo_fast',
          body: {
            modality: 'video',
            model: 'veo3.1-fast-text-to-video',
            inputs: { prompt: 'Veo fast aerial coastline', aspect_ratio: '16:9' },
          },
        });
        assert.equal(veoVid.job.provider, 'kie');
        assert.equal(veoVid.job.resolved_provider_model, 'veo3_fast');
        assert.equal(veoVid.job.execution_route, 'kie:veo/v1:veo3_fast');

        await worker.drainUntilSettled({ waitMs: 15, maxIterations: 50 });

        assert.equal(fakeKie.createTaskRequests.length, 2);
        assert.equal(fakeKie.createTaskRequests[0].body.model, 'nano-banana-pro');
        assert.equal(fakeKie.createTaskRequests[0].body.input.resolution, '2K');
        assert.equal(fakeKie.createTaskRequests[1].body.model, 'bytedance/seedance-1.5-pro');
        assert.equal(fakeKie.veoGenerateRequests.length, 1);
        assert.equal(fakeKie.veoGenerateRequests[0].body.model, 'veo3_fast');
        assert.ok(fakeKie.veoRecordInfoRequests.length >= 2);

        for (const sub of [kieImg, kieVid, veoVid]) {
          const done = await getJob(sub.job.job_id);
          assert.equal(done.status, 'succeeded');
          assert.equal(done.provider, 'kie');
        }
      }
    );
  } finally {
    await fakeKie.close();
  }
});

test('Checkpoint 3A (Uploads): Input upload authentication, MIME/byte-size validation, and provider_hosted_upload registration for Muapi and Kie', async () => {
  const fakeMuapi = await startFakeMuapiProviderServer();
  const fakeKie = await startFakeKieProviderServer();

  try {
    await withTestEnv(
      {
        TIMECAPSULE_SESSION_SECRET: 'checkpoint3a-secret-value-at-least-32-bytes',
        TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
        MUAPI_API_KEY: 'muapi-upload-secret',
        KIE_API_KEY: 'kie-upload-secret',
        TIMECAPSULE_MUAPI_BASE_URL: fakeMuapi.baseUrl,
        TIMECAPSULE_KIE_UPLOAD_BASE_URL: fakeKie.baseUrl,
      },
      async () => {
        await resetStoreForTests(1000);
        const token = issuePreviewSessionToken();

        // 1. Unauthenticated upload rejected with 401
        const unauthRes = await postUploadsRoute(
          new Request('http://localhost:3000/api/v1/uploads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Origin: 'http://localhost:3000',
            },
            body: JSON.stringify({
              dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
              filename: 'dot.png',
              contentType: 'image/png',
            }),
          })
        );
        assert.equal(unauthRes.status, 401);

        // 2. Disallowed MIME type (`application/x-msdownload` or `text/html`) rejected with 415
        const badMimeRes = await postUploadsRoute(
          new Request('http://localhost:3000/api/v1/uploads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Origin: 'http://localhost:3000',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              dataUrl: `data:text/html;base64,${Buffer.from('<script>alert(1)</script>').toString('base64')}`,
              filename: 'evil.html',
              contentType: 'text/html',
            }),
          })
        );
        assert.equal(badMimeRes.status, 415);
        assert.equal((await badMimeRes.json()).code, 'UNSUPPORTED_MEDIA_TYPE');

        // 3. Oversized image (> 10 MB) rejected with 413 PAYLOAD_TOO_LARGE
        const oversizedBuf = Buffer.alloc(10 * 1024 * 1024 + 64, 0x41);
        const formOversized = new FormData();
        formOversized.append(
          'file',
          new Blob([oversizedBuf], { type: 'image/png' }),
          'huge.png'
        );
        const oversizedRes = await postUploadsRoute(
          new Request('http://localhost:3000/api/v1/uploads', {
            method: 'POST',
            headers: {
              Origin: 'http://localhost:3000',
              Authorization: `Bearer ${token}`,
            },
            body: formOversized,
          })
        );
        assert.equal(oversizedRes.status, 413);
        assert.equal((await oversizedRes.json()).code, 'PAYLOAD_TOO_LARGE');

        // 4. Valid Muapi upload (default primary provider) registers provider_hosted_upload with durable=false
        const validPngDataUrl =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
        const muapiUploadRes = await postUploadsRoute(
          new Request('http://localhost:3000/api/v1/uploads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Origin: 'http://localhost:3000',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              dataUrl: validPngDataUrl,
              filename: 'reference_frame.png',
              contentType: 'image/png',
            }),
          })
        );
        assert.equal(muapiUploadRes.status, 200);
        const muapiUploadData = await muapiUploadRes.json();
        assert.equal(muapiUploadData.ok, true);
        assert.equal(muapiUploadData.provider, 'muapi');
        assert.equal(muapiUploadData.storage_type, 'provider_hosted_upload');
        assert.equal(muapiUploadData.durable, false);
        assert.equal(
          muapiUploadData.url,
          'https://cdn.timecapsule.studio/muapi-uploads/input_asset.png'
        );
        assert.equal(fakeMuapi.uploadRequests.length, 1);
        assert.equal(fakeMuapi.uploadRequests[0].headers['x-api-key'], 'muapi-upload-secret');

        // Confirm DB row records storage_type='provider_hosted_upload', durable=false, provider='muapi'
        const dbAssetRes = await query('SELECT * FROM assets WHERE asset_id = $1', [
          muapiUploadData.asset_id,
        ]);
        assert.equal(dbAssetRes.rows[0].storage_type, 'provider_hosted_upload');
        assert.equal(dbAssetRes.rows[0].durable, false);
        assert.equal(dbAssetRes.rows[0].provider, 'muapi');

        // 5. Explicit Kie upload registers provider_hosted_upload with durable=false and provider='kie'
        const kieUploadRes = await postUploadsRoute(
          new Request('http://localhost:3000/api/v1/uploads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Origin: 'http://localhost:3000',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              dataUrl: validPngDataUrl,
              filename: 'kie_input.png',
              contentType: 'image/png',
              provider: 'kie',
            }),
          })
        );
        assert.equal(kieUploadRes.status, 200);
        const kieUploadData = await kieUploadRes.json();
        assert.equal(kieUploadData.provider, 'kie');
        assert.equal(kieUploadData.storage_type, 'provider_hosted_upload');
        assert.equal(kieUploadData.durable, false);
        assert.equal(fakeKie.uploadRequests.length, 1);
      }
    );
  } finally {
    await fakeMuapi.close();
    await fakeKie.close();
  }
});

test('Checkpoint 3A (No Silent Fallback & Mid-Flight Immutability): Missing/failing provider never silently falls back, and in-flight jobs retain stored provider/route across config changes', async () => {
  const fakeMuapi = await startFakeMuapiProviderServer({ pollsBeforeSuccess: 2 });
  const fakeKie = await startFakeKieProviderServer();

  try {
    // 1. When Muapi is default/requested and MUAPI_API_KEY is missing, it MUST NOT fall back to KIE_API_KEY
    await withTestEnv(
      {
        TIMECAPSULE_SESSION_SECRET: 'checkpoint3a-secret-value-at-least-32-bytes',
        TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
        MUAPI_API_KEY: undefined,
        KIE_API_KEY: 'kie-key-is-present-but-must-not-be-used',
        TIMECAPSULE_DEFAULT_PROVIDER: 'muapi',
        TIMECAPSULE_KIE_BASE_URL: fakeKie.baseUrl,
      },
      async () => {
        await resetStoreForTests(1000);
        const session = verifySessionToken(issuePreviewSessionToken());

        await assert.rejects(
          () =>
            submitGenerationJob({
              session,
              idempotencyKey: 'idem_no_fallback_1',
              body: {
                modality: 'image',
                model: 'nano-banana-pro',
                inputs: { prompt: 'Must fail closed, not fall back to Kie' },
              },
            }),
          (err) => err.code === 'PROVIDER_CREDENTIALS_MISSING' && err.statusCode === 503
        );
        assert.equal(fakeKie.createTaskRequests.length, 0);
        const credits = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
        assert.equal(credits.reserved_credits, 0);
      }
    );

    // 2. Submit job under Muapi, then switch TIMECAPSULE_DEFAULT_PROVIDER to 'kie' while job is queued/running
    await withTestEnv(
      {
        TIMECAPSULE_SESSION_SECRET: 'checkpoint3a-secret-value-at-least-32-bytes',
        TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
        MUAPI_API_KEY: 'muapi-live-key',
        KIE_API_KEY: 'kie-live-key',
        TIMECAPSULE_DEFAULT_PROVIDER: 'muapi',
        TIMECAPSULE_MUAPI_BASE_URL: fakeMuapi.baseUrl,
        TIMECAPSULE_KIE_BASE_URL: fakeKie.baseUrl,
      },
      async () => {
        await resetStoreForTests(1000);
        const session = verifySessionToken(issuePreviewSessionToken());

        const { job } = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_midflight_immutability',
          body: {
            modality: 'image',
            model: 'nano-banana-pro',
            inputs: { prompt: 'Submitted when Muapi was default', resolution: '1k' },
          },
        });
        assert.equal(job.provider, 'muapi');
        assert.equal(job.execution_route, 'muapi:predictions/v1:nano-banana-pro');

        // Verify PostgreSQL trigger blocks mutating provider, resolved_provider_model, or execution_route
        await assert.rejects(
          () =>
            query('UPDATE jobs SET provider = $1 WHERE job_id = $2', ['kie', job.job_id]),
          /immutable after creation/
        );
        await assert.rejects(
          () =>
            query('UPDATE jobs SET execution_route = $1 WHERE job_id = $2', [
              'kie:market-jobs/v1:nano-banana-pro',
              job.job_id,
            ]),
          /immutable after creation/
        );

        // Now change TIMECAPSULE_DEFAULT_PROVIDER to 'kie' BEFORE worker claims and executes the queued job
        await withTestEnv({ TIMECAPSULE_DEFAULT_PROVIDER: 'kie' }, async () => {
          const worker = createDurableWorker({
            workerId: 'wrk_midflight',
            providerPollDelayMs: 10,
          });
          await worker.drainUntilSettled({ waitMs: 15 });
        });

        const completed = await getJob(job.job_id);
        assert.equal(completed.status, 'succeeded');
        assert.equal(completed.provider, 'muapi');
        assert.equal(completed.execution_route, 'muapi:predictions/v1:nano-banana-pro');
        assert.equal(fakeMuapi.submitRequests.length, 1, 'Must execute on stored provider Muapi');
        assert.equal(fakeKie.createTaskRequests.length, 0, 'Must not switch in-flight job to Kie');
      }
    );
  } finally {
    await fakeMuapi.close();
    await fakeKie.close();
  }
});

test('Checkpoint 3A (Resilience & Redaction): Poll timeout retries safely without failing job, and 401/403/429/malformed JSON fail cleanly with secret redaction', async () => {
  let pollAttemptCount = 0;
  const fakeMuapiTimeoutThenSuccess = await startFakeMuapiProviderServer({
    onPoll: async (requestId, req, res) => {
      pollAttemptCount += 1;
      if (pollAttemptCount === 1) {
        // Delay longer than TIMECAPSULE_PROVIDER_TIMEOUT_MS (60ms) to trigger poll timeout on first poll
        await new Promise((r) => setTimeout(r, 150));
      }
      return undefined; // fall through to normal success handler on 2nd poll
    },
  });

  try {
    await withTestEnv(
      {
        TIMECAPSULE_SESSION_SECRET: 'checkpoint3a-secret-value-at-least-32-bytes',
        TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
        MUAPI_API_KEY: 'super-secret-muapi-key-9999',
        TIMECAPSULE_MUAPI_BASE_URL: fakeMuapiTimeoutThenSuccess.baseUrl,
        TIMECAPSULE_PROVIDER_TIMEOUT_MS: '60',
      },
      async () => {
        await resetStoreForTests(1000);
        const session = verifySessionToken(issuePreviewSessionToken());
        const worker = createDurableWorker({
          workerId: 'wrk_poll_retry',
          providerPollDelayMs: 15,
        });

        const { job } = await submitGenerationJob({
          session,
          idempotencyKey: 'idem_poll_timeout_retry',
          body: {
            modality: 'image',
            model: 'nano-banana-pro',
            inputs: { prompt: 'Survive transient poll timeout', resolution: '1k' },
          },
        });

        // Step 1: Submit
        const step1 = await worker.runOnce();
        assert.equal(step1.action, 'submitted_and_scheduled_poll');

        // Step 2: First poll times out -> must return 'scheduled_poll_retry' and keep job queued for next poll
        await new Promise((r) => setTimeout(r, 20));
        const step2 = await worker.runOnce();
        assert.equal(step2.action, 'scheduled_poll_retry');
        assert.equal(step2.job.status, 'queued');

        // Step 3: Second poll succeeds -> job completes and settles credits
        await worker.drainUntilSettled({ waitMs: 35 });
        const finalJob = await getJob(job.job_id);
        assert.equal(finalJob.status, 'succeeded');
        assert.equal(
          fakeMuapiTimeoutThenSuccess.submitRequests.length,
          1,
          'Poll timeout must never resubmit task'
        );
      }
    );
  } finally {
    await fakeMuapiTimeoutThenSuccess.close();
  }

  // Test 401/403, 429, and Malformed JSON with secret redaction
  for (const scenario of [
    {
      name: '401_unauthorized',
      status: 401,
      body: JSON.stringify({
        error: 'Unauthorized x-api-key: super-secret-muapi-key-9999 rejected',
      }),
      expectedStatus: 'failed',
      expectedReserved: 0,
    },
    {
      name: '429_rate_limited',
      status: 429,
      body: JSON.stringify({
        error: 'Rate limit exceeded for Bearer super-secret-muapi-key-9999',
      }),
      maxAttempts: 1,
      expectedStatus: 'failed',
      expectedReserved: 0,
    },
    {
      name: '400_malformed_json',
      status: 400,
      body: '<<<NOT_VALID_JSON_AT_ALL x-api-key: super-secret-muapi-key-9999>>>',
      expectedStatus: 'failed',
      expectedReserved: 0,
    },
    {
      name: '200_malformed_json_ambiguous',
      status: 200,
      body: '<<<200_NOT_VALID_JSON_AT_ALL>>>',
      expectedStatus: 'reconciling_submission',
      expectedReserved: 15,
    },
  ]) {
    const errorServer = await startFakeMuapiProviderServer({
      onSubmit: async (_endpoint, _parsed, _req, res) => {
        res.writeHead(scenario.status, { 'Content-Type': 'application/json' });
        res.end(scenario.body);
        return true;
      },
    });

    try {
      await withTestEnv(
        {
          TIMECAPSULE_SESSION_SECRET: 'checkpoint3a-secret-value-at-least-32-bytes',
          TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
          MUAPI_API_KEY: 'super-secret-muapi-key-9999',
          TIMECAPSULE_MUAPI_BASE_URL: errorServer.baseUrl,
          TIMECAPSULE_PROVIDER_TIMEOUT_MS: '2000',
        },
        async () => {
          await resetStoreForTests(500);
          const session = verifySessionToken(issuePreviewSessionToken());
          const worker = createDurableWorker({
            workerId: `wrk_${scenario.name}`,
            providerPollDelayMs: 10,
          });

          const { job } = await submitGenerationJob({
            session,
            idempotencyKey: `idem_${scenario.name}`,
            body: {
              modality: 'image',
              model: 'nano-banana-pro',
              inputs: { prompt: `Test ${scenario.name}` },
            },
          });

          if (scenario.maxAttempts) {
            await query('UPDATE jobs SET max_submission_attempts = $1 WHERE job_id = $2', [
              scenario.maxAttempts,
              job.job_id,
            ]);
          }

          await worker.drainUntilSettled({ waitMs: 15 });

          const afterJob = await getJob(job.job_id);
          assert.equal(afterJob.status, scenario.expectedStatus);
          assert.ok(
            !String(afterJob.error || '').includes('super-secret-muapi-key-9999'),
            `Secret key must be redacted from job error in scenario ${scenario.name}`
          );

          const credits = await getTenantCredits(PREVIEW_IDENTITY.tenant_id);
          assert.equal(credits.total_credits, 500);
          assert.equal(credits.reserved_credits, scenario.expectedReserved);
        }
      );
    } finally {
      await errorServer.close();
    }
  }
});

test('Checkpoint 3A (Browser BFF Flow): Browser client executes upload, T2I, I2I, T2V, I2V, and models discovery through Timecapsule BFF without provider keys in browser context', async () => {
  const fakeMuapi = await startFakeMuapiProviderServer({
    pollsBeforeSuccess: 1,
    providerCost: 0.09,
  });

  // Start a local HTTP server hosting the BFF routes (`/api/v1/models`, `/api/v1/uploads`, `/api/v1/generations`, `/api/v1/generations/:jobId`)
  // and automatically running the durable worker in the background when a job is queued.
  const worker = createDurableWorker({
    workerId: 'wrk_bff_e2e',
    providerPollDelayMs: 10,
  });
  const pendingWorkerDrains = [];

  const bffServer = http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBody = Buffer.concat(chunks);

      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (Array.isArray(v)) headers.set(k, v.join(', '));
        else if (v !== undefined) headers.set(k, v);
      }
      if (!headers.has('origin')) {
        headers.set('origin', urlObj.origin);
      }

      const webReq = new Request(urlObj.toString(), {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? rawBody : undefined,
      });

      let webRes;
      if (urlObj.pathname === '/api/v1/models' && req.method === 'GET') {
        webRes = await getModelsRoute(webReq);
      } else if (urlObj.pathname === '/api/v1/uploads' && req.method === 'POST') {
        webRes = await postUploadsRoute(webReq);
      } else if (urlObj.pathname === '/api/v1/generations' && req.method === 'POST') {
        webRes = await postGenerationsRoute(webReq);
        // Trigger worker asynchronously just like the separate worker process
        pendingWorkerDrains.push(worker.drainUntilSettled({ waitMs: 10 }).catch(() => {}));
      } else if (urlObj.pathname === '/api/v1/generations' && req.method === 'GET') {
        webRes = await getGenerationsRoute(webReq);
      } else {
        const jobMatch = urlObj.pathname.match(/^\/api\/v1\/generations\/([^/]+)$/);
        if (jobMatch && req.method === 'GET') {
          webRes = await getJobDetailRoute(webReq, {
            params: Promise.resolve({ jobId: decodeURIComponent(jobMatch[1]) }),
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
        }
      }

      res.writeHead(webRes.status, Object.fromEntries(webRes.headers.entries()));
      const text = await webRes.text();
      res.end(text);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  await new Promise((r) => bffServer.listen(0, '127.0.0.1', r));
  const bffBaseUrl = `http://127.0.0.1:${bffServer.address().port}/api/v1`;

  try {
    await withTestEnv(
      {
        TIMECAPSULE_SESSION_SECRET: 'checkpoint3a-secret-value-at-least-32-bytes',
        TIMECAPSULE_PREVIEW_KEY: 'preview-operator-secret-key-2026',
        MUAPI_API_KEY: 'server-only-muapi-key-never-in-browser',
        KIE_API_KEY: undefined,
        TIMECAPSULE_MUAPI_BASE_URL: fakeMuapi.baseUrl,
      },
      async () => {
        await resetStoreForTests(2000);
        const sessionToken = issuePreviewSessionToken();

        // 1. Verify GET /api/v1/models exposes runtime availability and contract status without leaking keys
        const modelsRes = await fetch(`${bffBaseUrl}/models`);
        assert.equal(modelsRes.status, 200);
        const modelsText = await modelsRes.text();
        assert.ok(!modelsText.includes('server-only-muapi-key-never-in-browser'));
        const modelsData = JSON.parse(modelsText);
        assert.equal(modelsData.default_provider, 'muapi');
        assert.equal(modelsData.providers.muapi.configured, true);
        assert.equal(modelsData.providers.kie.configured, false);

        const nanoProEntry = modelsData.models.image.find((m) => m.id === 'nano-banana-pro');
        assert.ok(nanoProEntry);
        assert.equal(nanoProEntry.available, true);
        assert.equal(nanoProEntry.active_provider, 'muapi');
        assert.equal(nanoProEntry.verification_status, 'contract_tested');

        // Configure browser client to talk to our local BFF server using only the preview session token
        tcClient.configureTimecapsuleClient({
          mode: 'bff',
          bffBaseUrl,
          bffPollIntervalMs: 15,
          EventSourceImpl: false,
          fetchImpl: fetch,
        });

        // 2. Upload input image via browser client -> BFF -> Fake Muapi
        const fakeBlob = new Blob(
          [
            Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
              'base64'
            ),
          ],
          { type: 'image/png' }
        );
        fakeBlob.name = 'browser_input.png';
        const uploadedUrl = await studioClient.uploadFile(sessionToken, fakeBlob);
        assert.equal(
          uploadedUrl,
          'https://cdn.timecapsule.studio/muapi-uploads/input_asset.png'
        );

        // 3. Browser T2I (`nano-banana-pro`)
        const imgOut = await studioClient.generateImage(sessionToken, {
          model: 'nano-banana-pro',
          prompt: 'Browser BFF T2I test',
          aspect_ratio: '1:1',
          resolution: '1k',
        });
        assert.equal(imgOut.provider, 'muapi');
        assert.ok(imgOut.url.endsWith('.png'));

        // 4. Browser I2I (`nano-banana-pro-edit`) using uploaded asset URL
        const i2iOut = await studioClient.generateI2I(sessionToken, {
          model: 'nano-banana-pro-edit',
          prompt: 'Browser BFF I2I test',
          image_url: uploadedUrl,
          aspect_ratio: '1:1',
          resolution: '1k',
        });
        assert.equal(i2iOut.provider, 'muapi');
        assert.ok(i2iOut.url.endsWith('.png'));

        // 5. Browser T2V (`seedance-pro-t2v`)
        const t2vOut = await studioClient.generateVideo(sessionToken, {
          model: 'seedance-pro-t2v',
          prompt: 'Browser BFF T2V test',
          aspect_ratio: '16:9',
          resolution: '720p',
          duration: 5,
        });
        assert.equal(t2vOut.provider, 'muapi');
        assert.ok(t2vOut.url.endsWith('.mp4'));

        // 6. Browser I2V (`seedance-pro-i2v`) using uploaded asset URL
        const i2vOut = await studioClient.generateI2V(sessionToken, {
          model: 'seedance-pro-i2v',
          prompt: 'Browser BFF I2V test',
          image_url: uploadedUrl,
          aspect_ratio: '16:9',
          resolution: '720p',
          duration: 5,
        });
        assert.equal(i2vOut.provider, 'muapi');
        assert.ok(i2vOut.url.endsWith('.mp4'));
      }
    );
  } finally {
    await Promise.allSettled(pendingWorkerDrains);
    await new Promise((r) => bffServer.close(r));
    await fakeMuapi.close();
    await closePool();
  }
});
