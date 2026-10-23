import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

import {
  query,
  withTransaction,
  withTenantContext,
  withSystemContext,
  runMigrations,
  closePool,
  assertDisposableTestDatabase,
} from '../packages/timecapsule/src/server/db.js';
import {
  createTenant,
  createUser,
  createMembership,
} from '../packages/timecapsule/src/server/tenants.js';
import {
  createCustomerApiKey,
  listCustomerApiKeys,
  revokeCustomerApiKey,
  authenticateCustomerApiKey,
  hashApiKeySecret,
  isCustomerApiKey,
} from '../packages/timecapsule/src/server/keys.js';
import {
  requireSession,
  issueTenantSessionToken,
} from '../packages/timecapsule/src/server/auth.js';
import {
  ProviderConcurrencyGovernor,
  calculateBackoffMs,
} from '../packages/timecapsule/src/server/governor.js';
import {
  buildFalSubmissionPayload,
  submitFalTask,
  pollFalTaskStatus,
} from '../packages/timecapsule/src/server/adapters/fal.js';
import {
  buildReplicateSubmissionPayload,
  submitReplicateTask,
  pollReplicateTaskStatus,
} from '../packages/timecapsule/src/server/adapters/replicate.js';
import {
  registerProviderAdapter,
  resetProviderAdapters,
} from '../packages/timecapsule/src/server/providers.js';
import {
  submitGenerationJob,
} from '../packages/timecapsule/src/server/orchestrator.js';
import {
  createDurableWorker,
} from '../packages/timecapsule/src/worker/index.js';
import {
  getJob,
  getJobEventsAfter,
  resetStoreForTests,
} from '../packages/timecapsule/src/server/store.js';
import {
  POST as createGenerationRoute,
  GET as listGenerationsRoute,
} from '../app/api/v1/generations/route.js';
import {
  GET as getJobDetailRoute,
} from '../app/api/v1/generations/[jobId]/route.js';
import {
  GET as getKeysRoute,
  POST as createKeyRoute,
} from '../app/api/v1/keys/route.js';
import {
  DELETE as revokeKeyRoute,
} from '../app/api/v1/keys/[keyId]/route.js';

// Setup disposable test database environment
process.env.TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB = '1';
process.env.TIMECAPSULE_TEST_MODE = '1';
process.env.TIMECAPSULE_SESSION_SECRET = 'super-secret-test-session-key-32chars!';
process.env.TIMECAPSULE_PREVIEW_KEY = 'test-preview-key-1234';

async function setupFreshTenant(suffix) {
  const tenantId = `org_test_${suffix}_${Date.now()}`;
  const userId = `usr_test_${suffix}_${Date.now()}`;
  const email = `operator_${suffix}_${Date.now()}@timecapsule.test`;

  await createTenant({
    tenantId,
    name: `Test Tenant ${suffix}`,
    slug: `test-tenant-${suffix}-${Date.now()}`,
    status: 'active',
    initialCredits: 1000,
  });

  await createUser({
    userId,
    email,
    displayName: `Operator ${suffix}`,
    status: 'active',
    emailVerified: true,
  });

  await createMembership({
    tenantId,
    userId,
    role: 'reseller_admin',
  });

  return { tenantId, userId, email };
}

test('Multi-Provider Cascade & Credential Layer (Approach 2)', async (t) => {
  assertDisposableTestDatabase();
  await runMigrations();
  await resetStoreForTests();

  t.after(async () => {
    resetProviderAdapters();
    await closePool();
  });

  await t.test('KEY-1: Customer Developer API Key Lifecycle', async () => {
    const { tenantId, userId } = await setupFreshTenant('keys1');

    // 1. Create a customer developer API key
    const created = await createCustomerApiKey({
      tenantId,
      userId,
      name: 'Production CLI Key',
      scopes: ['generations:write', 'generations:read', 'models:read'],
    });

    assert.ok(created.key_id.startsWith('key_'));
    assert.strictEqual(created.tenant_id, tenantId);
    assert.strictEqual(created.user_id, userId);
    assert.strictEqual(created.name, 'Production CLI Key');
    assert.ok(created.key_prefix.startsWith('tcs_live_'));
    assert.ok(created.secret_key.startsWith('tcs_live_'));
    assert.deepStrictEqual(created.scopes, ['generations:write', 'generations:read', 'models:read']);

    // 2. Secret and hash are NEVER returned in listCustomerApiKeys
    const list = await listCustomerApiKeys({ tenantId });
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].key_id, created.key_id);
    assert.strictEqual(list[0].secret_key, undefined);
    assert.strictEqual(list[0].key_hash, undefined);
    assert.strictEqual(list[0].key_prefix, created.key_prefix);
    assert.strictEqual(list[0].revoked_at, null);

    // 3. Authenticate with valid Bearer token
    const session = await authenticateCustomerApiKey(created.secret_key);
    assert.ok(session);
    assert.strictEqual(session.auth_mode, 'customer_api_key');
    assert.strictEqual(session.tenant_id, tenantId);
    assert.strictEqual(session.user_id, userId);
    assert.strictEqual(session.role, 'reseller_admin');
    assert.strictEqual(session.email_verified, true);
    assert.deepStrictEqual(session.scopes, ['generations:write', 'generations:read', 'models:read']);

    // 4. Require session with matching scope succeeds
    const req = {
      headers: {
        authorization: `Bearer ${created.secret_key}`,
      },
    };
    const resolvedSession = await requireSession(req, { requiredScope: 'generations:write' });
    assert.strictEqual(resolvedSession.tenant_id, tenantId);

    // 5. Require session with missing scope fails with 403 INSUFFICIENT_SCOPE
    await assert.rejects(
      async () => {
        await requireSession(req, { requiredScope: 'uploads:write' });
      },
      (err) => err.code === 'INSUFFICIENT_SCOPE' && err.statusCode === 403
    );

    // 6. Tampered or invalid API key fails with 401
    await assert.rejects(
      async () => {
        await authenticateCustomerApiKey(`${created.secret_key}fake`);
      },
      (err) => err.code === 'INVALID_API_KEY' && err.statusCode === 401
    );

    // 7. Instant Revocation
    const revRes = await revokeCustomerApiKey(created.key_id, { tenantId });
    assert.strictEqual(revRes.revoked, true);
    assert.strictEqual(revRes.alreadyRevoked, false);

    // Calling requireSession with revoked key immediately rejects with 401
    await assert.rejects(
      async () => {
        await authenticateCustomerApiKey(created.secret_key);
      },
      (err) => err.code === 'API_KEY_REVOKED' && err.statusCode === 401
    );

    // 8. RLS Isolation: Another tenant cannot list or revoke this tenant's keys
    const tenantB = await setupFreshTenant('keys2');
    const listB = await listCustomerApiKeys({ tenantId: tenantB.tenantId });
    assert.strictEqual(listB.length, 0);

    const crossRev = await revokeCustomerApiKey(created.key_id, { tenantId: tenantB.tenantId });
    assert.strictEqual(crossRev.alreadyRevoked, true);
  });

  await t.test('CONC-1: Fenced Concurrency Governor & 429 Backoff', async () => {
    const gov = new ProviderConcurrencyGovernor({
      limits: { fal: 2, replicate: 3 },
      failureThreshold: 2,
      cooldownMs: 50,
    });

    // 1. Initial State
    assert.strictEqual(gov.getInFlight('fal'), 0);
    assert.strictEqual(gov.canAcquire('fal'), true);

    // 2. Concurrency limiting
    gov.acquireSlot('fal');
    assert.strictEqual(gov.getInFlight('fal'), 1);
    gov.acquireSlot('fal');
    assert.strictEqual(gov.getInFlight('fal'), 2);
    assert.strictEqual(gov.canAcquire('fal'), false);

    // Exceeding throws 429
    assert.throws(
      () => gov.acquireSlot('fal'),
      (err) => err.code === 'PROVIDER_CONCURRENCY_EXCEEDED' && err.statusCode === 429
    );

    // Release slot
    gov.releaseSlot('fal');
    assert.strictEqual(gov.getInFlight('fal'), 1);
    assert.strictEqual(gov.canAcquire('fal'), true);
    gov.releaseSlot('fal');
    assert.strictEqual(gov.getInFlight('fal'), 0);

    // 3. Circuit Breaker
    assert.strictEqual(gov.isCircuitOpen('replicate'), false);

    // Record 429 error -> trips circuit immediately
    gov.recordFailure('replicate', { status: 429, message: 'Too Many Requests' });
    assert.strictEqual(gov.isCircuitOpen('replicate'), true);

    // Attempting to acquire slot on open circuit throws 503
    assert.throws(
      () => gov.acquireSlot('replicate'),
      (err) => err.code === 'PROVIDER_CIRCUIT_OPEN' && err.statusCode === 503
    );

    // Wait for cooldown
    await new Promise((res) => setTimeout(res, 60));
    // After cooldown, transitions to HALF_OPEN (probe allowed)
    assert.strictEqual(gov.isCircuitOpen('replicate'), false);

    // Success resets circuit to CLOSED
    gov.recordSuccess('replicate');
    assert.strictEqual(gov.getCircuitState('replicate').state, 'CLOSED');

    // 4. Jitter Backoff calculation
    const delay = calculateBackoffMs({ attempt: 2, baseMs: 100 });
    assert.ok(delay >= 50 && delay <= 200);

    const retryAfterDelay = calculateBackoffMs({ attempt: 1, retryAfterHeader: '5' });
    assert.strictEqual(retryAfterDelay, 5000);
  });

  await t.test('Multi-Provider Adapters: Fal.ai & Replicate Contracts', async () => {
    // 1. Fal submission payload formatting
    const falJob = {
      model: 'nano-banana-pro',
      resolved_provider_model: 'fal-ai/flux/dev',
      modality: 'image',
      inputs: {
        prompt: 'A sleek ceramic teacup on marble table',
        aspect_ratio: '16:9',
        seed: 42,
      },
    };
    const { endpoint: falEp, payload: falPayload } = buildFalSubmissionPayload(falJob);
    assert.strictEqual(falEp, 'fal-ai/flux/dev');
    assert.strictEqual(falPayload.prompt, 'A sleek ceramic teacup on marble table');
    assert.strictEqual(falPayload.image_size, 'landscape_16_9');
    assert.strictEqual(falPayload.seed, 42);

    // 2. Replicate submission payload formatting
    const repJob = {
      model: 'nano-banana-pro',
      resolved_provider_model: 'black-forest-labs/flux-schnell',
      modality: 'image',
      inputs: {
        prompt: 'Futuristic solar hovercraft',
        aspect_ratio: '1:1',
      },
    };
    const { model: repModel, payload: repPayload } = buildReplicateSubmissionPayload(repJob);
    assert.strictEqual(repModel, 'black-forest-labs/flux-schnell');
    assert.strictEqual(repPayload.input.prompt, 'Futuristic solar hovercraft');
    assert.strictEqual(repPayload.input.aspect_ratio, '1:1');
  });

  await t.test('Cascade Failover: MuAPI 429 -> Fal 503 -> Replicate 200 (Single 2PC Settlement)', async () => {
    const { tenantId, userId } = await setupFreshTenant('cascade1');
    resetProviderAdapters();

    let muapiCalls = 0;
    let falCalls = 0;
    let replicateCalls = 0;

    // Register test adapters to simulate provider responses
    registerProviderAdapter('muapi', {
      submit: async (job) => {
        muapiCalls += 1;
        const err = new Error('Muapi upstream rate limit (429)');
        err.status = 429;
        err.statusCode = 429;
        err.retryableSubmission = true;
        throw err;
      },
      poll: async () => {},
    });

    registerProviderAdapter('fal', {
      submit: async (job) => {
        falCalls += 1;
        const err = new Error('Fal GPU cold-start timeout (503)');
        err.status = 503;
        err.statusCode = 503;
        err.retryableSubmission = true;
        throw err;
      },
      poll: async () => {},
    });

    registerProviderAdapter('replicate', {
      submit: async (job) => {
        replicateCalls += 1;
        return {
          providerJobId: `rep_task_${Date.now()}`,
          immediateCompletion: {
            sourceUrl: 'https://cdn.timecapsule.test/replicate_output.webp',
            outputs: ['https://cdn.timecapsule.test/replicate_output.webp'],
            userBilledCredits: 15,
            providerReportedCost: 0.003,
            providerCostUnit: 'usd',
          },
          providerDetails: { adapter: 'replicate', provider: 'replicate' },
        };
      },
      poll: async () => {},
    });

    // Submit job (15 credits estimated)
    const session = {
      tenant_id: tenantId,
      user_id: userId,
      role: 'reseller_admin',
      auth_mode: 'customer_api_key',
      email_verified: true,
      scopes: ['generations:write', 'generations:read'],
    };

    const { job: submittedJob } = await submitGenerationJob({
      session,
      idempotencyKey: `idem_cascade_${Date.now()}`,
      body: {
        model: 'nano-banana-pro',
        modality: 'image',
        inputs: { prompt: 'Epic cybernetic dragon' },
      },
    });

    assert.strictEqual(submittedJob.status, 'queued');
    assert.strictEqual(submittedJob.credits_reserved, 15);
    assert.strictEqual(submittedJob.provider, 'muapi');

    // Run durable worker to execute the cascade
    const worker = createDurableWorker({
      idlePollIntervalMs: 50,
      providerPollDelayMs: 20,
      submissionRetryBaseMs: 20,
    });

    const stepResult = await worker.runOnce();
    assert.strictEqual(stepResult.processed, true);
    assert.strictEqual(stepResult.action, 'succeeded');

    // Verify calls: Muapi failed -> Fal failed -> Replicate succeeded!
    assert.strictEqual(muapiCalls, 1);
    assert.strictEqual(falCalls, 1);
    assert.strictEqual(replicateCalls, 1);

    // Verify job in database: status succeeded, provider transitioned to replicate!
    const finalJob = await getJob(submittedJob.job_id);
    assert.strictEqual(finalJob.status, 'succeeded');
    assert.strictEqual(finalJob.provider, 'replicate');
    assert.strictEqual(finalJob.user_billed_credits, 15);
    assert.strictEqual(finalJob.output.url, 'https://cdn.timecapsule.test/replicate_output.webp');

    // Verify cascade events recorded in job_events audit trail
    const events = await getJobEventsAfter(submittedJob.job_id);
    const cascadeEvents = events.filter((e) => e.type === 'generation.cascade_failover');
    assert.strictEqual(cascadeEvents.length, 2);

    // Event 1: muapi -> fal
    assert.strictEqual(cascadeEvents[0].data.from_provider, 'muapi');
    assert.strictEqual(cascadeEvents[0].data.to_provider, 'fal');

    // Event 2: fal -> replicate
    assert.strictEqual(cascadeEvents[1].data.from_provider, 'fal');
    assert.strictEqual(cascadeEvents[1].data.to_provider, 'replicate');

    // Verify credit ledger: EXACTLY 1 reserve, EXACTLY 1 settle (1000 - 15 = 985, reserved = 0)
    const tenantRes = await query(
      'SELECT credits_balance, credits_reserved FROM tenants WHERE tenant_id = $1',
      [tenantId]
    );
    assert.strictEqual(Number(tenantRes.rows[0].credits_balance), 985);
    assert.strictEqual(Number(tenantRes.rows[0].credits_reserved), 0);

    resetProviderAdapters();
  });

  await t.test('Total Cascade Outage: All routes fail -> Atomic Release of Reserved Credits (Zero Bleed)', async () => {
    const { tenantId, userId } = await setupFreshTenant('cascade_outage');
    resetProviderAdapters();

    // All providers fail
    registerProviderAdapter('muapi', {
      submit: async () => {
        const err = new Error('Muapi 503');
        err.status = 503;
        err.retryableSubmission = true;
        throw err;
      },
    });
    registerProviderAdapter('fal', {
      submit: async () => {
        const err = new Error('Fal 503');
        err.status = 503;
        err.retryableSubmission = true;
        throw err;
      },
    });
    registerProviderAdapter('replicate', {
      submit: async () => {
        const err = new Error('Replicate 503');
        err.status = 503;
        err.retryableSubmission = true;
        throw err;
      },
    });
    registerProviderAdapter('kie', {
      submit: async () => {
        const err = new Error('Kie 503 fatal');
        err.status = 503;
        err.retryableSubmission = false; // Terminal failure
        throw err;
      },
    });

    const session = {
      tenant_id: tenantId,
      user_id: userId,
      role: 'reseller_admin',
      auth_mode: 'customer_api_key',
      email_verified: true,
      scopes: ['generations:write'],
    };

    const { job: submittedJob } = await submitGenerationJob({
      session,
      body: {
        model: 'nano-banana-pro',
        modality: 'image',
        inputs: { prompt: 'Doomed request' },
      },
    });

    const worker = createDurableWorker({
      idlePollIntervalMs: 50,
      providerPollDelayMs: 20,
    });

    const stepResult = await worker.runOnce();
    assert.strictEqual(stepResult.processed, true);
    assert.strictEqual(stepResult.action, 'failed_submission');

    // Verify job is failed
    const failedJob = await getJob(submittedJob.job_id);
    assert.strictEqual(failedJob.status, 'failed');

    // Invariant: Balance must be 100% restored (1000 balance, 0 reserved)
    const tenantRes = await query(
      'SELECT credits_balance, credits_reserved FROM tenants WHERE tenant_id = $1',
      [tenantId]
    );
    assert.strictEqual(Number(tenantRes.rows[0].credits_balance), 1000);
    assert.strictEqual(Number(tenantRes.rows[0].credits_reserved), 0);

    resetProviderAdapters();
  });

  await t.test('HTTP API Key Endpoints & Bearer Authentication on /api/v1/generations', async () => {
    const { tenantId, userId } = await setupFreshTenant('http_keys');
    resetProviderAdapters();

    // Mock test adapter for muapi
    registerProviderAdapter('muapi', {
      submit: async (job) => ({
        providerJobId: `task_${Date.now()}`,
        immediateCompletion: {
          sourceUrl: 'https://cdn.timecapsule.test/http_output.webp',
          userBilledCredits: 15,
        },
      }),
      poll: async () => {},
    });

    // 1. Admin creates key via POST /api/v1/keys
    const adminToken = issueTenantSessionToken({
      userId,
      tenantId,
      role: 'reseller_admin',
      emailVerified: true,
    });

    const createReq = new Request('http://localhost:8080/api/v1/keys', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
        'x-timecapsule-csrf': '1',
      },
      body: JSON.stringify({
        name: 'Agent Key 1',
        scopes: ['generations:write', 'generations:read'],
      }),
    });

    const createRes = await createKeyRoute(createReq);
    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    assert.strictEqual(createData.ok, true);
    assert.ok(createData.key.secret_key.startsWith('tcs_live_'));
    const generatedSecret = createData.key.secret_key;
    const keyId = createData.key.key_id;

    // 2. Non-admin user attempting to create key receives 403
    const userToken = issueTenantSessionToken({
      userId: `usr_regular_${Date.now()}`,
      tenantId,
      role: 'end_user',
      emailVerified: true,
    });
    const unauthCreateReq = new Request('http://localhost:8080/api/v1/keys', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': 'application/json',
        'x-timecapsule-csrf': '1',
      },
      body: JSON.stringify({ name: 'Hacker Key' }),
    });
    const unauthCreateRes = await createKeyRoute(unauthCreateReq);
    assert.strictEqual(unauthCreateRes.status, 403);

    // 3. List keys via GET /api/v1/keys
    const listReq = new Request('http://localhost:8080/api/v1/keys', {
      method: 'GET',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const listRes = await getKeysRoute(listReq);
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.strictEqual(listData.ok, true);
    assert.strictEqual(listData.items.length, 1);
    assert.strictEqual(listData.items[0].key_id, keyId);
    assert.strictEqual(listData.items[0].secret_key, undefined);

    // 4. Submit generation job using the customer developer API key (Bearer tcs_live_...)
    const genReq = new Request('http://localhost:8080/api/v1/generations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${generatedSecret}`,
        'content-type': 'application/json',
        'idempotency-key': `idem_http_${Date.now()}`,
      },
      body: JSON.stringify({
        model: 'nano-banana-pro',
        modality: 'image',
        inputs: { prompt: 'A magnificent sunrise over snow peaks' },
      }),
    });
    const genRes = await createGenerationRoute(genReq);
    assert.strictEqual(genRes.status, 202);
    const genData = await genRes.json();
    assert.ok(genData.job_id.startsWith('job_'));

    // 5. Query job detail using the customer developer API key
    const detailReq = new Request(`http://localhost:8080/api/v1/generations/${genData.job_id}`, {
      method: 'GET',
      headers: { authorization: `Bearer ${generatedSecret}` },
    });
    const detailRes = await getJobDetailRoute(detailReq, {
      params: Promise.resolve({ jobId: genData.job_id }),
    });
    assert.strictEqual(detailRes.status, 200);
    const detailData = await detailRes.json();
    assert.strictEqual(detailData.job_id, genData.job_id);

    // 6. Revoke key via DELETE /api/v1/keys/:keyId
    const delReq = new Request(`http://localhost:8080/api/v1/keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'x-timecapsule-csrf': '1',
      },
    });
    const delRes = await revokeKeyRoute(delReq, {
      params: Promise.resolve({ keyId }),
    });
    assert.strictEqual(delRes.status, 200);

    // 7. Subsequent requests with revoked key return 401 API_KEY_REVOKED
    const revokedReq = new Request('http://localhost:8080/api/v1/generations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${generatedSecret}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nano-banana-pro',
        modality: 'image',
        inputs: { prompt: 'Should fail' },
      }),
    });
    const revokedRes = await createGenerationRoute(revokedReq);
    assert.strictEqual(revokedRes.status, 401);
    const revokedData = await revokedRes.json();
    assert.strictEqual(revokedData.code, 'API_KEY_REVOKED');

    resetProviderAdapters();
  });
});
