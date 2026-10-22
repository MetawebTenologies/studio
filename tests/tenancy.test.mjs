import test from 'node:test';
import assert from 'node:assert/strict';

import {
  query,
  withTransaction,
  withTenantContext,
  runMigrations,
  closePool,
  assertDisposableTestDatabase,
} from '../packages/timecapsule/src/server/db.js';
import {
  createTenant,
  getTenant,
  getTenantBySlug,
  updateTenant,
  createUser,
  getUser,
  createMembership,
  getMembership,
  seedTenantWithAdmin,
} from '../packages/timecapsule/src/server/tenants.js';
import {
  PREVIEW_IDENTITY,
  issuePreviewSessionToken,
  issueTenantSessionToken,
  issueSessionTokenForTest,
  verifySessionToken,
  authorizeJobAccess,
} from '../packages/timecapsule/src/server/auth.js';
import {
  resolveTenantFromRequest,
  enforceTenantAccess,
  assertAdminRole,
  extractSubdomain,
} from '../packages/timecapsule/src/server/tenancy.js';
import {
  resetStoreForTests,
  registerAsset,
  createSubmissionTransaction,
  claimNextRunnableJob,
  listJobs,
} from '../packages/timecapsule/src/server/store.js';
import { createDurableWorker } from '../packages/timecapsule/src/worker/index.js';
import { GET as getJobDetailRoute } from '../app/api/v1/generations/[jobId]/route.js';
import { GET as getGenerationsRoute } from '../app/api/v1/generations/route.js';
import { GET as getAssetRoute } from '../app/api/v1/assets/[assetId]/route.js';

test('White-Label W0: Database schema & migration 004 verification', async (t) => {
  assertDisposableTestDatabase();
  await runMigrations();

  // Verify tenants table columns
  const tenantCols = await query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tenants'`
  );
  const colNames = new Set(tenantCols.rows.map((r) => r.column_name));
  assert.ok(colNames.has('slug'), 'tenants table has slug column');
  assert.ok(colNames.has('status'), 'tenants table has status column');
  assert.ok(colNames.has('plan'), 'tenants table has plan column');
  assert.ok(colNames.has('branding'), 'tenants table has branding column');
  assert.ok(colNames.has('legal'), 'tenants table has legal column');
  assert.ok(colNames.has('flags'), 'tenants table has flags column');
  assert.ok(colNames.has('spend_ceiling_credits'), 'tenants table has spend_ceiling_credits column');

  // Verify users table exists
  const usersTable = await query(`SELECT to_regclass('public.users') AS reg`);
  assert.ok(usersTable.rows[0]?.reg, 'users table exists');

  // Verify memberships table exists
  const memTable = await query(`SELECT to_regclass('public.memberships') AS reg`);
  assert.ok(memTable.rows[0]?.reg, 'memberships table exists');
});

test('White-Label W0: Tenant CRUD, slug resolution, and membership roles', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();

  const tenantAlpha = await createTenant({
    tenantId: 'tnt_alpha_test',
    slug: 'alpha-studio',
    name: 'Alpha Creative Studio',
    plan: 'growth',
    branding: { primary_color: '#ff0055', app_name: 'Alpha AI' },
    initialCredits: 1000,
  });

  assert.equal(tenantAlpha.tenant_id, 'tnt_alpha_test');
  assert.equal(tenantAlpha.slug, 'alpha-studio');
  assert.equal(tenantAlpha.name, 'Alpha Creative Studio');
  assert.equal(tenantAlpha.plan, 'growth');
  assert.equal(tenantAlpha.status, 'active');
  assert.equal(Number(tenantAlpha.credits_balance), 1000);

  // Slug resolution
  const bySlug = await getTenantBySlug('alpha-studio');
  assert.ok(bySlug, 'tenant found by slug');
  assert.equal(bySlug.tenant_id, 'tnt_alpha_test');

  // Update tenant branding and spend ceiling
  const updated = await updateTenant('tnt_alpha_test', {
    spendCeilingCredits: 50000,
    branding: { primary_color: '#00e5ff', app_name: 'Alpha Cinema' },
  });
  assert.equal(Number(updated.spend_ceiling_credits), 50000);
  assert.equal(updated.branding.app_name, 'Alpha Cinema');

  // User & Membership creation
  const user = await createUser({
    userId: 'usr_alpha_admin',
    email: 'admin@alphastudio.com',
  });
  assert.equal(user.email, 'admin@alphastudio.com');

  const membership = await createMembership({
    userId: user.user_id,
    tenantId: tenantAlpha.tenant_id,
    role: 'reseller_admin',
  });
  assert.equal(membership.role, 'reseller_admin');
  assert.equal(membership.status, 'active');

  const fetchedMem = await getMembership(user.user_id, tenantAlpha.tenant_id);
  assert.equal(fetchedMem.role, 'reseller_admin');
});

test('White-Label W0: Multi-tenant session tokens carrying tenant_id and role', async (t) => {
  process.env.TIMECAPSULE_SESSION_SECRET = 'super-secret-session-key-minimum-16-bytes';
  process.env.TIMECAPSULE_TEST_MODE = '1';

  // 1. Platform admin token
  const adminToken = issuePreviewSessionToken();
  const adminSession = verifySessionToken(adminToken);
  assert.ok(adminSession);
  assert.equal(adminSession.role, 'platform_admin');
  assert.equal(adminSession.tenant_id, PREVIEW_IDENTITY.tenant_id);

  // 2. Reseller admin token
  const resellerToken = issueTenantSessionToken({
    userId: 'usr_reseller_1',
    tenantId: 'tnt_reseller_1',
    role: 'reseller_admin',
    email: 'boss@reseller.com',
  });
  const resellerSession = verifySessionToken(resellerToken);
  assert.ok(resellerSession);
  assert.equal(resellerSession.role, 'reseller_admin');
  assert.equal(resellerSession.tenant_id, 'tnt_reseller_1');
  assert.equal(resellerSession.email, 'boss@reseller.com');

  // 3. End user token
  const userToken = issueTenantSessionToken({
    userId: 'usr_end_user_1',
    tenantId: 'tnt_reseller_1',
    role: 'end_user',
    email: 'client@reseller.com',
  });
  const userSession = verifySessionToken(userToken);
  assert.ok(userSession);
  assert.equal(userSession.role, 'end_user');
  assert.equal(userSession.tenant_id, 'tnt_reseller_1');

  // Role assertions
  assert.doesNotThrow(() => assertAdminRole(adminSession));
  assert.doesNotThrow(() => assertAdminRole(resellerSession));
  assert.throws(
    () => assertAdminRole(userSession),
    (err) => err.code === 'ADMIN_ROLE_REQUIRED'
  );
});

test('White-Label W0: Tenant resolution from session, headers, and hostname', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();

  const tenantBeta = await createTenant({
    tenantId: 'tnt_beta_media',
    slug: 'beta-media',
    name: 'Beta Media Productions',
    initialCredits: 500,
  });

  // 1. Subdomain parsing
  assert.equal(extractSubdomain('beta-media.timecapsule.ai'), 'beta-media');
  assert.equal(extractSubdomain('beta-media.timecapsule.ai:3000'), 'beta-media');
  assert.equal(extractSubdomain('api.timecapsule.ai'), null);
  assert.equal(extractSubdomain('localhost:3002'), null);

  // 2. Request resolution via Host header
  const reqWithHost = new Request('http://beta-media.timecapsule.ai/explore', {
    headers: { host: 'beta-media.timecapsule.ai' },
  });
  const resolvedByHost = await resolveTenantFromRequest(reqWithHost);
  assert.equal(resolvedByHost.tenant_id, 'tnt_beta_media');

  // 3. Request resolution via X-Timecapsule-Tenant-Slug header
  const reqWithHeader = new Request('http://localhost:3002/explore', {
    headers: { 'x-timecapsule-tenant-slug': 'beta-media' },
  });
  const resolvedByHeader = await resolveTenantFromRequest(reqWithHeader);
  assert.equal(resolvedByHeader.tenant_id, 'tnt_beta_media');

  // 4. Request resolution via session takes precedence
  const sessionAlpha = { tenant_id: 'tnt_alpha_test', role: 'end_user' };
  const reqWithBoth = new Request('http://beta-media.timecapsule.ai/explore', {
    headers: { host: 'beta-media.timecapsule.ai' },
  });
  const resolvedBySession = await resolveTenantFromRequest(reqWithBoth, sessionAlpha);
  assert.equal(resolvedBySession.tenant_id, 'tnt_alpha_test');
});

test('White-Label W0: Cross-tenant job and asset isolation (403/404)', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  process.env.TIMECAPSULE_SESSION_SECRET = 'super-secret-session-key-minimum-16-bytes';
  process.env.TIMECAPSULE_TEST_MODE = '1';

  // Seed two distinct tenants
  await createTenant({
    tenantId: 'tnt_alpha',
    slug: 'alpha',
    name: 'Tenant Alpha',
    initialCredits: 1000,
  });
  await createTenant({
    tenantId: 'tnt_beta',
    slug: 'beta',
    name: 'Tenant Beta',
    initialCredits: 1000,
  });

  // Create a job belonging to Tenant Beta
  const { job: betaJob } = await createSubmissionTransaction({
    jobId: 'job_beta_secret_123',
    tenantId: 'tnt_beta',
    userId: 'usr_beta_author',
    modality: 'image',
    model: 'flux-dev',
    resolvedProviderModel: 'flux-dev',
    provider: 'muapi',
    executionRoute: 'muapi:predictions/v1:flux-dev',
    creditsReserved: 25,
    estimatedCost: 25,
    inputsJson: { prompt: 'Secret Beta Asset' },
    workflowJson: {},
    deliveryJson: {},
  });

  // Create an asset belonging to Tenant Beta
  await registerAsset({
    asset_id: 'ast_beta_confidential',
    tenant_id: 'tnt_beta',
    job_id: betaJob.job_id,
    source_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    storage_type: 'inline_data_url',
    content_type: 'image/png',
  });

  // Session for Tenant Alpha user
  const alphaToken = issueTenantSessionToken({
    userId: 'usr_alpha_user',
    tenantId: 'tnt_alpha',
    role: 'end_user',
  });

  // Session for Tenant Beta user
  const betaToken = issueTenantSessionToken({
    userId: 'usr_beta_user',
    tenantId: 'tnt_beta',
    role: 'end_user',
  });

  // Session for Platform Admin
  const adminToken = issuePreviewSessionToken();

  // --- 1. Job Access Isolation ---
  // Alpha user cannot access Beta job via authorizeJobAccess
  const alphaSession = verifySessionToken(alphaToken);
  await assert.rejects(
    async () => {
      await authorizeJobAccess(alphaSession, betaJob.job_id);
    },
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );

  // Beta user CAN access Beta job
  const betaSession = verifySessionToken(betaToken);
  const authorizedBetaJob = await authorizeJobAccess(betaSession, betaJob.job_id);
  assert.equal(authorizedBetaJob.job_id, betaJob.job_id);

  // Platform admin CAN access Beta job
  const adminSession = verifySessionToken(adminToken);
  const adminAuthorized = await authorizeJobAccess(adminSession, betaJob.job_id);
  assert.equal(adminAuthorized.job_id, betaJob.job_id);

  // --- 2. API Route Job Detail Isolation (GET /api/v1/generations/[jobId]) ---
  const reqAlphaJob = new Request(`http://localhost/api/v1/generations/${betaJob.job_id}`, {
    headers: { authorization: `Bearer ${alphaToken}` },
  });
  const resAlphaJob = await getJobDetailRoute(reqAlphaJob, {
    params: Promise.resolve({ jobId: betaJob.job_id }),
  });
  assert.equal(resAlphaJob.status, 403, 'Alpha user receives 403 Forbidden on Beta job');

  const reqBetaJob = new Request(`http://localhost/api/v1/generations/${betaJob.job_id}`, {
    headers: { authorization: `Bearer ${betaToken}` },
  });
  const resBetaJob = await getJobDetailRoute(reqBetaJob, {
    params: Promise.resolve({ jobId: betaJob.job_id }),
  });
  assert.equal(resBetaJob.status, 200, 'Beta user receives 200 OK on Beta job');

  // --- 3. API Route Job Listing Isolation (GET /api/v1/generations) ---
  const reqAlphaList = new Request('http://localhost/api/v1/generations', {
    headers: { authorization: `Bearer ${alphaToken}` },
  });
  const resAlphaList = await getGenerationsRoute(reqAlphaList);
  const alphaListData = await resAlphaList.json();
  assert.equal(alphaListData.items.length, 0, 'Alpha list shows 0 jobs (Beta jobs filtered out)');

  const reqBetaList = new Request('http://localhost/api/v1/generations', {
    headers: { authorization: `Bearer ${betaToken}` },
  });
  const resBetaList = await getGenerationsRoute(reqBetaList);
  const betaListData = await resBetaList.json();
  assert.equal(betaListData.items.length, 1, 'Beta list shows 1 job');
  assert.equal(betaListData.items[0].job_id, betaJob.job_id);

  // --- 4. Asset Access Isolation (GET /api/v1/assets/[assetId]) ---
  const reqAlphaAsset = new Request('http://localhost/api/v1/assets/ast_beta_confidential', {
    headers: { authorization: `Bearer ${alphaToken}` },
  });
  const resAlphaAsset = await getAssetRoute(reqAlphaAsset, {
    params: Promise.resolve({ assetId: 'ast_beta_confidential' }),
  });
  assert.equal(resAlphaAsset.status, 403, 'Alpha user receives 403 on Beta asset');

  const reqBetaAsset = new Request('http://localhost/api/v1/assets/ast_beta_confidential', {
    headers: { authorization: `Bearer ${betaToken}` },
  });
  const resBetaAsset = await getAssetRoute(reqBetaAsset, {
    params: Promise.resolve({ assetId: 'ast_beta_confidential' }),
  });
  assert.equal(resBetaAsset.status, 200, 'Beta user receives 200 on Beta asset');

  const reqAdminAsset = new Request('http://localhost/api/v1/assets/ast_beta_confidential', {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  const resAdminAsset = await getAssetRoute(reqAdminAsset, {
    params: Promise.resolve({ assetId: 'ast_beta_confidential' }),
  });
  assert.equal(resAdminAsset.status, 200, 'Platform admin receives 200 on Beta asset');

  // --- 5. Database Trigger Protection: tenant_id immutability ---
  await assert.rejects(
    async () => {
      await query(`UPDATE jobs SET tenant_id = 'tnt_alpha' WHERE job_id = $1`, [betaJob.job_id]);
    },
    (err) => {
      assert.ok(err.message.includes('immutable'), 'DB trigger enforces tenant_id immutability');
      return true;
    }
  );
});

test('White-Label S1: Row Level Security & GUC Tenant Isolation (Migration 005)', async (t) => {
  assertDisposableTestDatabase();
  await runMigrations();
  await resetStoreForTests();

  const tenantA = await createTenant({
    tenantId: 'tnt_rls_alpha',
    slug: 'rls-alpha',
    name: 'RLS Alpha',
    initialCredits: 1000,
  });
  const tenantB = await createTenant({
    tenantId: 'tnt_rls_beta',
    slug: 'rls-beta',
    name: 'RLS Beta',
    initialCredits: 1000,
  });

  // Create jobs for both tenants
  const { job: jobA } = await createSubmissionTransaction({
    jobId: 'job_rls_alpha_1',
    tenantId: tenantA.tenant_id,
    userId: 'usr_rls_a',
    modality: 'image',
    model: 'flux-dev',
    resolvedProviderModel: 'flux-dev',
    provider: 'muapi',
    executionRoute: 'muapi:predictions/v1:flux-dev',
    estimatedCost: 10,
    creditsReserved: 10,
    inputsJson: { prompt: 'Alpha artwork' },
    workflowJson: {},
    deliveryJson: {},
  });

  const { job: jobB } = await createSubmissionTransaction({
    jobId: 'job_rls_beta_1',
    tenantId: tenantB.tenant_id,
    userId: 'usr_rls_b',
    modality: 'image',
    model: 'flux-dev',
    resolvedProviderModel: 'flux-dev',
    provider: 'muapi',
    executionRoute: 'muapi:predictions/v1:flux-dev',
    estimatedCost: 10,
    creditsReserved: 10,
    inputsJson: { prompt: 'Beta artwork' },
    workflowJson: {},
    deliveryJson: {},
  });

  // Verify RLS under timecapsule_tenant_role
  await withTransaction(async (client) => {
    // Switch to non-bypass tenant role
    await client.query('SET LOCAL ROLE timecapsule_tenant_role');

    // 1. When app.tenant_id is not set, 0 rows should be visible
    const unsetOnJobs = await client.query('SELECT job_id, tenant_id FROM jobs');
    assert.equal(unsetOnJobs.rows.length, 0, 'No jobs visible without app.tenant_id GUC set');

    // 2. Set GUC to tenant A -> only tenant A jobs visible
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA.tenant_id]);
    const alphaJobs = await client.query('SELECT job_id, tenant_id FROM jobs');
    assert.equal(alphaJobs.rows.length, 1, 'Tenant A sees exactly 1 job');
    assert.equal(alphaJobs.rows[0].job_id, jobA.job_id);

    // 3. Set GUC to tenant B -> only tenant B jobs visible
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantB.tenant_id]);
    const betaJobs = await client.query('SELECT job_id, tenant_id FROM jobs');
    assert.equal(betaJobs.rows.length, 1, 'Tenant B sees exactly 1 job');
    assert.equal(betaJobs.rows[0].job_id, jobB.job_id);

    // 4. Attempting to cross-insert into jobs for tenant B while scoped to tenant A violates RLS
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA.tenant_id]);
    await assert.rejects(
      async () => {
        await client.query(`
          INSERT INTO jobs (job_id, tenant_id, project_id, modality, model, provider, status, inputs_json, submission_state)
          VALUES ('job_cross_leak', $1, 'prj_x', 'image', 'nano-banana-pro', 'muapi', 'queued', '{}', 'not_submitted')
        `, [tenantB.tenant_id]);
      },
      (err) => {
        assert.ok(err.message.includes('row-level security') || err.code === '42501', 'RLS rejects cross-tenant insertion');
        return true;
      }
    );
  });
});

test('White-Label S2: Worker tenant status gate refuses jobs for suspended and killed tenants', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();

  const tenantSuspended = await createTenant({
    tenantId: 'tnt_suspended',
    slug: 'suspended-org',
    name: 'Suspended Org',
    initialCredits: 1000,
  });

  const tenantKilled = await createTenant({
    tenantId: 'tnt_killed',
    slug: 'killed-org',
    name: 'Killed Org',
    initialCredits: 1000,
  });

  // 1. Seed jobs for both tenants
  await createSubmissionTransaction({
    jobId: 'job_susp_1',
    tenantId: tenantSuspended.tenant_id,
    userId: 'usr_susp_user',
    modality: 'image',
    model: 'flux-dev',
    resolvedProviderModel: 'flux-dev',
    provider: 'muapi',
    executionRoute: 'muapi:predictions/v1:flux-dev',
    estimatedCost: 10,
    creditsReserved: 10,
    inputsJson: { prompt: 'Suspended job' },
    workflowJson: {},
    deliveryJson: {},
  });

  await createSubmissionTransaction({
    jobId: 'job_kill_1',
    tenantId: tenantKilled.tenant_id,
    userId: 'usr_kill_user',
    modality: 'image',
    model: 'flux-dev',
    resolvedProviderModel: 'flux-dev',
    provider: 'muapi',
    executionRoute: 'muapi:predictions/v1:flux-dev',
    estimatedCost: 10,
    creditsReserved: 10,
    inputsJson: { prompt: 'Killed job' },
    workflowJson: {},
    deliveryJson: {},
  });

  // Suspend and kill tenants
  await updateTenant(tenantSuspended.tenant_id, { status: 'suspended' });
  await updateTenant(tenantKilled.tenant_id, { status: 'killed' });

  // CLAIM PATH VERIFICATION:
  // Neither suspended nor killed jobs should be claimed by the worker
  const claimed1 = await claimNextRunnableJob({ workerId: 'wrk_test_s2' });
  assert.equal(claimed1, null, 'Worker claim path refuses to claim job for suspended/killed tenant');

  // EXECUTE PATH VERIFICATION:
  // Create an active tenant and a job, claim it, then suspend tenant before execution
  const tenantActive = await createTenant({
    tenantId: 'tnt_active_to_suspend',
    slug: 'active-to-suspend',
    name: 'Active to Suspend',
    initialCredits: 1000,
  });
  const { job: activeJob } = await createSubmissionTransaction({
    jobId: 'job_act_to_susp',
    tenantId: tenantActive.tenant_id,
    userId: 'usr_act_user',
    modality: 'image',
    model: 'flux-dev',
    resolvedProviderModel: 'flux-dev',
    provider: 'muapi',
    executionRoute: 'muapi:predictions/v1:flux-dev',
    estimatedCost: 20,
    creditsReserved: 20,
    inputsJson: { prompt: 'Active to suspend prompt' },
    workflowJson: {},
    deliveryJson: {},
  });

  const claimedActiveJob = await claimNextRunnableJob({ workerId: 'wrk_test_s2_exec' });
  assert.ok(claimedActiveJob, 'Active job was claimed');
  assert.equal(claimedActiveJob.job.job_id, activeJob.job_id);

  // Now suspend the tenant while job is in claimed state
  await updateTenant(tenantActive.tenant_id, { status: 'suspended' });

  // Create worker and execute claimed job directly
  const worker = createDurableWorker({
    workerId: 'wrk_test_s2_exec',
    idlePollIntervalMs: 50,
  });

  const stepRes = await worker.executeClaimedJob(claimedActiveJob.job);
  assert.equal(stepRes.processed, true);
  assert.equal(stepRes.action, 'refused_suspended');

  // Verify job is marked failed in DB with refusal message
  const failedJobRes = await query('SELECT status, error FROM jobs WHERE job_id = $1', [claimedActiveJob.job.job_id]);
  assert.equal(failedJobRes.rows[0].status, 'failed');
  assert.ok(failedJobRes.rows[0].error.includes('tenant is suspended'));

  // Test repeat for killed tenant in execute path
  const tenantActive2 = await createTenant({
    tenantId: 'tnt_active_to_kill',
    slug: 'active-to-kill',
    name: 'Active to Kill',
    initialCredits: 1000,
  });
  const { job: activeJob2 } = await createSubmissionTransaction({
    jobId: 'job_act_to_kill',
    tenantId: tenantActive2.tenant_id,
    userId: 'usr_act_user2',
    modality: 'image',
    model: 'flux-dev',
    resolvedProviderModel: 'flux-dev',
    provider: 'muapi',
    executionRoute: 'muapi:predictions/v1:flux-dev',
    estimatedCost: 20,
    creditsReserved: 20,
    inputsJson: { prompt: 'Active to kill prompt' },
    workflowJson: {},
    deliveryJson: {},
  });
  const claimedActiveJob2 = await claimNextRunnableJob({ workerId: 'wrk_test_s2_exec2' });
  assert.ok(claimedActiveJob2, 'Second active job claimed');

  // Kill tenant
  await updateTenant(tenantActive2.tenant_id, { status: 'killed' });
  const worker2 = createDurableWorker({
    workerId: 'wrk_test_s2_exec2',
    idlePollIntervalMs: 50,
  });
  const stepRes2 = await worker2.executeClaimedJob(claimedActiveJob2.job);
  assert.equal(stepRes2.processed, true);
  assert.equal(stepRes2.action, 'refused_killed');

  const failedJobRes2 = await query('SELECT status, error FROM jobs WHERE job_id = $1', [claimedActiveJob2.job.job_id]);
  assert.equal(failedJobRes2.rows[0].status, 'failed');
  assert.ok(failedJobRes2.rows[0].error.includes('tenant is killed'));
});
