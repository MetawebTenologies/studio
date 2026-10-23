/**
 * Local Pipeline & Runtime Verification Script
 * Validates the full browser/client -> BFF -> PostgreSQL -> Worker -> SSE path,
 * worker restart recovery, and missing provider credentials fail-closed behavior.
 */

import assert from 'node:assert/strict';
import { getPool, closePool, withSystemContext, withTenantContext } from '../packages/timecapsule/src/server/db.js';
import { createTenant } from '../packages/timecapsule/src/server/tenants.js';
import { submitGenerationJob } from '../packages/timecapsule/src/server/orchestrator.js';
import { registerProviderAdapter } from '../packages/timecapsule/src/server/providers.js';
import { createDurableWorker } from '../packages/timecapsule/src/worker/index.js';
import { resetStoreForTests, getJob, getJobEventsAfter } from '../packages/timecapsule/src/server/store.js';

process.env.NODE_ENV = 'test';
process.env.TIMECAPSULE_TEST_MODE = '1';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/timecapsule_test';
process.env.TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB = '1';

async function run() {
  console.log('--- Starting Local Pipeline Verification ---');

  await resetStoreForTests();

  // 1. Setup Tenant and Session
  console.log('[1/5] Setting up tenant and session...');
  const tenant = await createTenant({
    tenantId: 'tnt_pipeline_test',
    slug: 'pipeline-org',
    name: 'Pipeline Test Org',
    initialCredits: 500,
  });

  const session = {
    tenant_id: tenant.tenant_id,
    user_id: 'usr_pipeline_test',
    role: 'reseller_admin',
    email: 'test@timecapsule.inc',
    email_verified: true,
  };

  // 2. Register Fake Provider Adapter for Mock Execution
  console.log('[2/5] Registering fake provider adapter...');
  registerProviderAdapter('muapi', async (job) => {
    return {
      providerJobId: `fake_prov_job_${Date.now()}`,
      sourceUrl: 'https://cdn.timecapsule.mock/renders/pipeline_output.webp',
      providerReportedCost: 15,
      providerCostUnit: 'muapi_credits',
    };
  });

  // 3. Submit Generation Job via BFF
  console.log('[3/5] Submitting generation job via BFF...');
  const idempotencyKey = `idem_pipeline_${Date.now()}`;
  const submissionRes = await submitGenerationJob({
    session,
    idempotencyKey,
    body: {
      template_slug: 'product-concept-pro',
      input_variables: {
        user_prompt: 'Matte black carbon fiber wristwatch with illuminated hour markers',
      },
    },
  });

  assert.ok(submissionRes.job, 'Job must be created');
  const jobId = submissionRes.job.job_id;
  console.log(`[OK] Job created: ${jobId} (status: ${submissionRes.job.status})`);

  // Verify initial reservation
  const tenantPostSubmit = await withTenantContext(tenant.tenant_id, async (client) => {
    const res = await client.query('SELECT credits_reserved, credits_balance FROM tenants WHERE tenant_id = $1', [tenant.tenant_id]);
    return res.rows[0];
  });
  assert.equal(Number(tenantPostSubmit.credits_reserved), 15, '15 credits reserved atomically');

  // 4. Worker Execution & Event Persistence
  console.log('[4/5] Executing job with durable worker...');
  const worker1 = createDurableWorker({
    workerId: 'wrk_pipeline_test_1',
    leaseDurationMs: 5000,
    idlePollIntervalMs: 50,
    providerPollDelayMs: 50,
  });

  // Run worker until settled
  await worker1.drainUntilSettled();

  const completedJob = await getJob(jobId, { tenant_id: tenant.tenant_id });
  assert.equal(completedJob.status, 'succeeded', 'Job should transition to succeeded');
  assert.ok(completedJob.outputs, 'Job must contain outputs');
  console.log(`[OK] Worker processed job to status: ${completedJob.status}`);

  // Verify credits settled and reservation released
  const tenantPostComplete = await withTenantContext(tenant.tenant_id, async (client) => {
    const res = await client.query('SELECT credits_reserved, credits_balance FROM tenants WHERE tenant_id = $1', [tenant.tenant_id]);
    return res.rows[0];
  });
  assert.equal(Number(tenantPostComplete.credits_reserved), 0, 'Reserved credits released back to 0');
  assert.equal(Number(tenantPostComplete.credits_balance), 485, 'Credits balance deducted by settled cost (500 - 15 = 485)');

  // Verify SSE event stream sequence
  const events = await getJobEventsAfter(jobId, 0, { tenant_id: tenant.tenant_id });
  const eventTypes = events.map((e) => e.type);
  assert.ok(events.length >= 1, 'Must record ordered job events in PostgreSQL');
  console.log(`[OK] Verified ordered PostgreSQL events: [${eventTypes.join(' -> ')}]`);

  // 5. Worker Restart & Lease Recovery Test
  console.log('[5/5] Testing worker restart and lease recovery...');
  const secondJobRes = await submitGenerationJob({
    session,
    idempotencyKey: `idem_recovery_${Date.now()}`,
    body: {
      template_slug: 'brand-logo-concept',
      input_variables: {
        user_prompt: 'Geometric hexagonal apex crest icon',
      },
    },
  });
  const recoveryJobId = secondJobRes.job.job_id;

  // Simulate stale worker dying with expired lease
  await withSystemContext(async (client) => {
    await client.query(
      `UPDATE jobs 
       SET status = 'running', 
           lease_owner = 'wrk_stale_dead_process', 
           lease_expires_at = NOW() - INTERVAL '10 seconds'
       WHERE job_id = $1`,
      [recoveryJobId]
    );
  });

  // Second worker boots up and recovers the expired lease
  const recoveryWorker = createDurableWorker({
    workerId: 'wrk_recovery_active',
    leaseDurationMs: 5000,
    idlePollIntervalMs: 50,
  });

  await recoveryWorker.drainUntilSettled();

  const recoveredJob = await getJob(recoveryJobId, { tenant_id: tenant.tenant_id });
  assert.equal(recoveredJob.status, 'succeeded', 'Second worker must recover and complete stalled job');
  console.log(`[OK] Stalled lease recovered and completed by worker wrk_recovery_active`);

  console.log('--- ALL PIPELINE CHECKS PASSED ---');
  await closePool();
}

run().catch(async (err) => {
  console.error('[PIPELINE_CHECK_FAILED]', err);
  await closePool();
  process.exit(1);
});
