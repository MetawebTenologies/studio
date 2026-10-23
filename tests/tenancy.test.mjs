import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  query,
  withTransaction,
  withTenantContext,
  withSystemContext,
  assertRuntimeRoleSafety,
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
  assertAdminRoleWithDatabaseCheck,
  extractSubdomain,
} from '../packages/timecapsule/src/server/tenancy.js';
import {
  resetStoreForTests,
  registerAsset,
  getAsset,
  createSubmissionTransaction,
  claimNextRunnableJob,
  listJobs,
  getJob,
  getJobPrivateProviderDetails,
  listTenantUploads,
  softDeleteAsset,
} from '../packages/timecapsule/src/server/store.js';
import { createDurableWorker } from '../packages/timecapsule/src/worker/index.js';
import {
  registerProviderAdapter,
  resetProviderAdapters,
} from '../packages/timecapsule/src/server/providers.js';
import { GET as getJobDetailRoute } from '../app/api/v1/generations/[jobId]/route.js';
import { GET as getGenerationsRoute } from '../app/api/v1/generations/route.js';
import { GET as getAssetRoute } from '../app/api/v1/assets/[assetId]/route.js';
import { GET as getTenantConfigRoute, sanitizePublicTenantConfig } from '../app/api/v1/tenant/config/route.js';
import {
  validateBrandingAtWriteTime,
  sanitizeBrandingAtReadTime,
} from '../packages/timecapsule/src/server/brandingValidation.js';
import {
  checkRateLimit,
  resetRateLimits,
  getClientIdentifier,
} from '../packages/timecapsule/src/server/rateLimit.js';
import {
  isOriginAllowed,
  getCorsHeaders,
  handleCorsPreflight,
} from '../packages/timecapsule/src/server/cors.js';
import {
  scrubSecrets,
  sanitizeError,
  assertNoExposedSecrets,
} from '../packages/timecapsule/src/server/credentials.js';
import {
  validateFileMagicBytes,
  POST as postUploadRoute,
  GET as getUploadsRoute,
} from '../app/api/v1/uploads/route.js';
import { DELETE as deleteUploadRoute } from '../app/api/v1/uploads/[assetId]/route.js';
import { POST as postSessionRoute } from '../app/api/v1/session/route.js';
import { POST as postGenerationsRoute } from '../app/api/v1/generations/route.js';
import {
  getTemplatesForTenant,
  getTemplateBySlug,
  synthesizeTemplatePrompt,
  MAX_TEMPLATE_USER_INPUT_LENGTH,
} from '../packages/timecapsule/src/server/templates.js';
import { GET as getTemplatesRoute } from '../app/api/v1/templates/route.js';
import { submitGenerationJob } from '../packages/timecapsule/src/server/orchestrator.js';

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

test('Condition 1 Integration: Worker claims and executes jobs under Row Level Security without starvation', async () => {
  assertDisposableTestDatabase();
  await runMigrations();

  const prevTestMode = process.env.TIMECAPSULE_TEST_MODE;
  process.env.TIMECAPSULE_TEST_MODE = '1';

  try {
    // 1. Verify RLS is enabled and forced on jobs and assets
    const rlsCheck = await query(`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname IN ('jobs', 'assets', 'credit_reservations', 'credit_ledger', 'idempotency_keys', 'memberships')
    `);
    assert.equal(rlsCheck.rows.length, 6, 'All 6 RLS tables found');
    for (const row of rlsCheck.rows) {
      assert.equal(row.relrowsecurity, true, `${row.relname} has RLS enabled`);
      assert.equal(row.relforcerowsecurity, true, `${row.relname} has FORCE RLS set`);
    }

    // 2. Set up Tenant A and Tenant B
    const tenantA = await createTenant({
      tenantId: 'tnt_rls_wrk_alpha',
      slug: 'rls-wrk-alpha',
      name: 'RLS Worker Alpha',
      initialCredits: 500,
    });
    const tenantB = await createTenant({
      tenantId: 'tnt_rls_wrk_beta',
      slug: 'rls-wrk-beta',
      name: 'RLS Worker Beta',
      initialCredits: 500,
    });

    // 3. Register a test provider adapter that completes immediately
    registerProviderAdapter('test-rls-prov', async (job) => {
      return {
        providerJobId: `test_prov_${job.job_id}`,
        sourceUrl: 'https://cdn.timecapsule.test/artwork_rls.webp',
        userBilledCredits: 15,
        providerReportedCost: 8,
        providerCostUnit: 'credits',
        providerDetails: { adapter: 'test-rls-prov', model: job.model },
      };
    });

    // 4. Seed a job for tenant A
    const { job: jobA } = await createSubmissionTransaction({
      jobId: 'job_rls_wrk_alpha_1',
      tenantId: tenantA.tenant_id,
      userId: 'usr_rls_wrk_a',
      modality: 'image',
      model: 'flux-dev',
      resolvedProviderModel: 'flux-dev',
      provider: 'test-rls-prov',
      executionRoute: 'test-rls-prov:predictions/v1:flux-dev',
      estimatedCost: 15,
      creditsReserved: 15,
      inputsJson: { prompt: 'Worker execution under RLS test' },
      workflowJson: {},
      deliveryJson: {},
    });

    assert.equal(jobA.status, 'queued');
    assert.equal(jobA.credits_reserved, 15);

    // 5. Worker claims and executes job under RLS
    const worker = createDurableWorker({
      workerId: 'wrk_rls_test_runner',
      idlePollIntervalMs: 50,
      leaseDurationMs: 10000,
    });

    const claim = await claimNextRunnableJob({ workerId: 'wrk_rls_test_runner' });
    assert.ok(claim, 'Worker successfully claimed job under RLS (no silent row starvation)');
    assert.equal(claim.job.job_id, jobA.job_id);
    assert.equal(claim.job.status, 'running');

    const stepRes = await worker.executeClaimedJob(claim.job);
    assert.equal(stepRes.processed, true);
    assert.equal(stepRes.action, 'succeeded');
    assert.equal(stepRes.job.status, 'succeeded');

    // 6. Verify persistence state: job is succeeded, output is set, reservation is settled
    const completedJobRes = await query(
      'SELECT status, output_json, actual_cost FROM jobs WHERE job_id = $1',
      [jobA.job_id]
    );
    assert.equal(completedJobRes.rows[0].status, 'succeeded');
    assert.ok(completedJobRes.rows[0].output_json.delivery_url.includes('/api/v1/assets/'));

    const resvRes = await query(
      'SELECT status FROM credit_reservations WHERE job_id = $1',
      [jobA.job_id]
    );
    assert.equal(resvRes.rows[0].status, 'settled');

    const tenantAfterRes = await query(
      'SELECT credits_reserved FROM tenants WHERE tenant_id = $1',
      [tenantA.tenant_id]
    );
    assert.equal(Number(tenantAfterRes.rows[0].credits_reserved), 0);

    // 7. Verify asset was persisted in assets table
    const assetRes = await query(
      'SELECT asset_id, tenant_id, source_url FROM assets WHERE tenant_id = $1',
      [tenantA.tenant_id]
    );
    assert.ok(assetRes.rows.length >= 1, 'Asset created for tenant A');
    assert.equal(assetRes.rows[0].tenant_id, tenantA.tenant_id);

    // 8. Verify RLS isolation under timecapsule_tenant_role
    await withTransaction(async (client) => {
      await client.query('SET LOCAL ROLE timecapsule_tenant_role');

      // Unset GUC -> sees 0 rows
      const unsetOnJobs = await client.query('SELECT job_id FROM jobs WHERE job_id = $1', [jobA.job_id]);
      assert.equal(unsetOnJobs.rows.length, 0, 'No jobs visible without app.tenant_id');

      // Scoped to Tenant A -> sees job and asset
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA.tenant_id]);
      const jobsA = await client.query('SELECT job_id FROM jobs WHERE job_id = $1', [jobA.job_id]);
      assert.equal(jobsA.rows.length, 1, 'Tenant A sees its job under RLS');
      const assetsA = await client.query('SELECT asset_id FROM assets WHERE tenant_id = $1', [tenantA.tenant_id]);
      assert.ok(assetsA.rows.length >= 1, 'Tenant A sees its asset under RLS');

      // Scoped to Tenant B -> sees 0 rows for Tenant A
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantB.tenant_id]);
      const jobsB = await client.query('SELECT job_id FROM jobs WHERE job_id = $1', [jobA.job_id]);
      assert.equal(jobsB.rows.length, 0, 'Tenant B cannot see Tenant A job under RLS');
      const assetsB = await client.query('SELECT asset_id FROM assets WHERE tenant_id = $1', [tenantA.tenant_id]);
      assert.equal(assetsB.rows.length, 0, 'Tenant B cannot see Tenant A asset under RLS');
    });
  } finally {
    resetProviderAdapters();
    process.env.TIMECAPSULE_TEST_MODE = prevTestMode;
  }
});

test('P0-1 / S8 Negative Test 1: Fail-open killer - non-tenant connection with no GUC sees zero rows', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  const tenant = await createTenant({
    tenantId: 'tnt_failopen_test',
    slug: 'failopen-test',
    name: 'FailOpen Test Studio',
    initialCredits: 500,
  });

  const { job } = await createSubmissionTransaction({
    jobId: 'job_failopen_1',
    tenantId: tenant.tenant_id,
    userId: 'usr_failopen',
    modality: 'image',
    model: 'flux-dev',
    resolvedProviderModel: 'flux-dev',
    provider: 'muapi',
    executionRoute: 'muapi:predictions/v1:flux-dev',
    estimatedCost: 10,
    creditsReserved: 10,
    inputsJson: { prompt: 'failopen check' },
    workflowJson: {},
    deliveryJson: {},
  });

  await withTransaction(async (client) => {
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tc_untrusted_client') THEN
          CREATE ROLE tc_untrusted_client NOINHERIT;
        END IF;
      END $$;
    `);
    await client.query('GRANT USAGE ON SCHEMA public TO tc_untrusted_client');
    await client.query('GRANT SELECT ON jobs, assets, credit_reservations, credit_ledger, idempotency_keys, memberships TO tc_untrusted_client');

    // Switch to unprivileged client with no GUC set
    await client.query('SET LOCAL ROLE tc_untrusted_client');

    const jobCheck = await client.query('SELECT count(*) FROM jobs');
    assert.equal(Number(jobCheck.rows[0].count), 0, 'Fail-open killer: jobs query returns 0 rows');

    const assetCheck = await client.query('SELECT count(*) FROM assets');
    assert.equal(Number(assetCheck.rows[0].count), 0, 'Fail-open killer: assets query returns 0 rows');

    const memCheck = await client.query('SELECT count(*) FROM memberships');
    assert.equal(Number(memCheck.rows[0].count), 0, 'Fail-open killer: memberships query returns 0 rows');

    const resvCheck = await client.query('SELECT count(*) FROM credit_reservations');
    assert.equal(Number(resvCheck.rows[0].count), 0, 'Fail-open killer: credit_reservations query returns 0 rows');

    const ledgerCheck = await client.query('SELECT count(*) FROM credit_ledger');
    assert.equal(Number(ledgerCheck.rows[0].count), 0, 'Fail-open killer: credit_ledger query returns 0 rows');

    const idemCheck = await client.query('SELECT count(*) FROM idempotency_keys');
    assert.equal(Number(idemCheck.rows[0].count), 0, 'Fail-open killer: idempotency_keys query returns 0 rows');
  });
});

test('P0-1 / S8 Negative Test 2: GUC escalation - tenant role setting app.is_system_actor cannot bypass RLS', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  const tenantA = await createTenant({
    tenantId: 'tnt_guc_a',
    slug: 'guc-a',
    name: 'Tenant A',
    initialCredits: 500,
  });

  const tenantB = await createTenant({
    tenantId: 'tnt_guc_b',
    slug: 'guc-b',
    name: 'Tenant B',
    initialCredits: 500,
  });

  const { job: jobA } = await createSubmissionTransaction({
    jobId: 'job_guc_a_1',
    tenantId: tenantA.tenant_id,
    userId: 'usr_guc_a',
    modality: 'image',
    model: 'flux-dev',
    resolvedProviderModel: 'flux-dev',
    provider: 'muapi',
    executionRoute: 'muapi:predictions/v1:flux-dev',
    estimatedCost: 10,
    creditsReserved: 10,
    inputsJson: { prompt: 'A artwork' },
    workflowJson: {},
    deliveryJson: {},
  });

  const { job: jobB } = await createSubmissionTransaction({
    jobId: 'job_guc_b_1',
    tenantId: tenantB.tenant_id,
    userId: 'usr_guc_b',
    modality: 'image',
    model: 'flux-dev',
    resolvedProviderModel: 'flux-dev',
    provider: 'muapi',
    executionRoute: 'muapi:predictions/v1:flux-dev',
    estimatedCost: 10,
    creditsReserved: 10,
    inputsJson: { prompt: 'B artwork' },
    workflowJson: {},
    deliveryJson: {},
  });

  await withTransaction(async (client) => {
    await client.query('SET LOCAL ROLE timecapsule_tenant_role');

    // Attempt escalation by setting app.is_system_actor = 'true'
    await client.query("SELECT set_config('app.is_system_actor', 'true', true)");

    // Case 1: tenant GUC unset + is_system_actor = true -> sees 0 rows (cannot view all jobs)
    const unsetWithEscalation = await client.query('SELECT job_id FROM jobs');
    assert.equal(unsetWithEscalation.rows.length, 0, 'Cannot see any jobs without app.tenant_id even with is_system_actor=true');

    // Case 2: tenant GUC set to Tenant A + is_system_actor = true -> sees ONLY Tenant A jobs, zero Tenant B jobs
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA.tenant_id]);
    const tenantAJobs = await client.query('SELECT job_id FROM jobs');
    assert.equal(tenantAJobs.rows.length, 1, 'Sees only Tenant A job');
    assert.equal(tenantAJobs.rows[0].job_id, jobA.job_id);

    const bDirectQuery = await client.query('SELECT job_id FROM jobs WHERE job_id = $1', [jobB.job_id]);
    assert.equal(bDirectQuery.rows.length, 0, 'Cannot see Tenant B job despite is_system_actor=true');
  });
});

test('P0-1 / S8 Negative Test 3: Membership escape - cross-tenant membership read/write denied under RLS', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  const { tenant: tenantA, user: userA, membership: memA } = await seedTenantWithAdmin({
    tenantId: 'tnt_mem_esc_a',
    slug: 'mem-esc-a',
    name: 'Tenant Mem A',
    adminEmail: 'admin-a@example.com',
    initialCredits: 100,
  });

  const { tenant: tenantB, user: userB, membership: memB } = await seedTenantWithAdmin({
    tenantId: 'tnt_mem_esc_b',
    slug: 'mem-esc-b',
    name: 'Tenant Mem B',
    adminEmail: 'admin-b@example.com',
    initialCredits: 100,
  });

  await withTransaction(async (client) => {
    await client.query('SET LOCAL ROLE timecapsule_tenant_role');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA.tenant_id]);

    // Read escape: Tenant A cannot see Tenant B memberships
    const bMemberships = await client.query(
      'SELECT * FROM memberships WHERE tenant_id = $1',
      [tenantB.tenant_id]
    );
    assert.equal(bMemberships.rows.length, 0, 'Tenant A sees 0 memberships for Tenant B');

    // Write escape: Tenant A cannot insert a membership for Tenant B
    await assert.rejects(
      async () => {
        await client.query(
          `INSERT INTO memberships (membership_id, user_id, tenant_id, role, status)
           VALUES ('mem_escape_injected', $1, $2, 'tenant_admin', 'active')`,
          [userA.user_id, tenantB.tenant_id]
        );
      },
      (err) => {
        return err.message.includes('row-level security policy') || err.code === '42501';
      },
      'Cross-tenant membership insertion violates RLS WITH CHECK'
    );
  });
});

test('P0-1 / S8 Negative Test 4: Worker running under RLS via system context - claims and processes jobs across tenants', async (t) => {
  const prevTestMode = process.env.TIMECAPSULE_TEST_MODE;
  process.env.TIMECAPSULE_TEST_MODE = '1';

  try {
    assertDisposableTestDatabase();
    await resetStoreForTests();
    await runMigrations();

    const tenantA = await createTenant({
      tenantId: 'tnt_wrk_rls_a',
      slug: 'wrk-rls-a',
      name: 'Worker RLS Tenant A',
      initialCredits: 500,
    });

    const tenantB = await createTenant({
      tenantId: 'tnt_wrk_rls_b',
      slug: 'wrk-rls-b',
      name: 'Worker RLS Tenant B',
      initialCredits: 500,
    });

    registerProviderAdapter('muapi', async (job) => {
      return {
        providerJobId: `muapi_worker_cross_${job.job_id}`,
        sourceUrl: 'https://cdn.timecapsule.test/outputs/cross_tenant_gen.png',
        userBilledCredits: Number(job.credits_reserved) || 15,
        providerReportedCost: 0.002,
        providerCostUnit: 'USD',
        providerDetails: { adapter: 'muapi', model: job.model },
      };
    });

    const { job: jobA } = await createSubmissionTransaction({
      jobId: 'job_wrk_cross_a',
      tenantId: tenantA.tenant_id,
      userId: 'usr_wrk_a',
      modality: 'image',
      model: 'flux-dev',
      resolvedProviderModel: 'flux-dev',
      provider: 'muapi',
      executionRoute: 'muapi:predictions/v1:flux-dev',
      estimatedCost: 15,
      creditsReserved: 15,
      inputsJson: { prompt: 'Cross tenant test A' },
      workflowJson: {},
      deliveryJson: {},
    });

    const { job: jobB } = await createSubmissionTransaction({
      jobId: 'job_wrk_cross_b',
      tenantId: tenantB.tenant_id,
      userId: 'usr_wrk_b',
      modality: 'image',
      model: 'flux-dev',
      resolvedProviderModel: 'flux-dev',
      provider: 'muapi',
      executionRoute: 'muapi:predictions/v1:flux-dev',
      estimatedCost: 20,
      creditsReserved: 20,
      inputsJson: { prompt: 'Cross tenant test B' },
      workflowJson: {},
      deliveryJson: {},
    });

    // Execute durable worker claiming jobs across tenants via withSystemContext
    const worker = createDurableWorker({
      workerId: 'wrk_cross_tenant_runner',
      idlePollIntervalMs: 50,
      leaseDurationMs: 10000,
    });

    // Claim and process first job (from tenant A)
    const claim1 = await claimNextRunnableJob({ workerId: 'wrk_cross_tenant_runner' });
    assert.ok(claim1, 'Worker claimed first job under RLS');
    assert.equal(claim1.job.job_id, jobA.job_id);
    const step1 = await worker.executeClaimedJob(claim1.job);
    assert.equal(step1.processed, true);
    assert.equal(step1.job.status, 'succeeded');

    // Claim and process second job (from tenant B)
    const claim2 = await claimNextRunnableJob({ workerId: 'wrk_cross_tenant_runner' });
    assert.ok(claim2, 'Worker claimed second job under RLS');
    assert.equal(claim2.job.job_id, jobB.job_id);
    const step2 = await worker.executeClaimedJob(claim2.job);
    assert.equal(step2.processed, true);
    assert.equal(step2.job.status, 'succeeded');

    // Verify both jobs are succeeded in the DB
    const finalJobA = await getJob(jobA.job_id);
    const finalJobB = await getJob(jobB.job_id);
    assert.equal(finalJobA.status, 'succeeded');
    assert.equal(finalJobB.status, 'succeeded');
  } finally {
    resetProviderAdapters();
    process.env.TIMECAPSULE_TEST_MODE = prevTestMode;
  }
});

test('P0-2 / S5: /api/v1/tenant/config field whitelisting and Cache-Control: private enforcement', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  const tenant = await createTenant({
    tenantId: 'tnt_whitelist_audit',
    slug: 'whitelist-audit',
    name: 'Whitelist Audit Studio',
    status: 'active',
    branding: {
      app_name: 'Whitelisted App',
      primary_color: '#00e5ff',
      internal_theme_secret: 'LEAK_SECRET_1',
    },
    flags: {
      enable_video: true,
      maintenance_mode: false,
      internal_admin_token: 'LEAK_RAW_FLAG_SECRET_2',
      billing_secret_key: 'sk_live_secret_3',
      bypass_rls_flag: true,
    },
    spendCeilingCredits: 50000,
  });

  // Call /api/v1/tenant/config via route handler
  const req = new Request('http://localhost:3000/api/v1/tenant/config', {
    method: 'GET',
    headers: {
      'x-timecapsule-tenant-id': tenant.tenant_id,
    },
  });

  const res = await getTenantConfigRoute(req);
  assert.equal(res.status, 200);

  // 1. Verify Cache-Control header is private
  const cacheControl = res.headers.get('cache-control') || '';
  assert.match(cacheControl, /private/i, 'Cache-Control header MUST be private (S5)');
  assert.ok(!cacheControl.includes('public'), 'Cache-Control MUST NOT be public');

  const body = await res.json();
  assert.equal(body.ok, true);

  // 2. Verify whitelisted top-level fields only
  const ALLOWED_TOP_LEVEL_FIELDS = new Set([
    'ok',
    'tenant_id',
    'slug',
    'name',
    'status',
    'branding',
    'flags',
  ]);

  for (const field of Object.keys(body)) {
    assert.ok(
      ALLOWED_TOP_LEVEL_FIELDS.has(field),
      `Non-whitelisted top-level field appeared in /api/v1/tenant/config: "${field}"`
    );
  }

  // 3. Verify sensitive DB fields are NOT exposed
  assert.equal(body.spend_ceiling_credits, undefined, 'spend_ceiling_credits must NOT be exposed');
  assert.equal(body.credits_balance, undefined, 'credits_balance must NOT be exposed in config');
  assert.equal(body.credits_reserved, undefined, 'credits_reserved must NOT be exposed in config');
  assert.equal(body.legal, undefined, 'raw legal object must NOT be exposed in config');

  // 4. Verify branding object is sanitized to whitelist
  assert.equal(body.branding.app_name, 'Whitelisted App');
  assert.equal(body.branding.primary_color, '#00e5ff');
  assert.equal(body.branding.internal_theme_secret, undefined, 'internal_theme_secret was stripped');

  // 5. Verify flags object is sanitized: NEVER raw flags object
  assert.equal(body.flags.enable_video, true);
  assert.equal(body.flags.maintenance_mode, false);
  assert.equal(body.flags.internal_admin_token, undefined, 'internal_admin_token flag was stripped');
  assert.equal(body.flags.billing_secret_key, undefined, 'billing_secret_key flag was stripped');
  assert.equal(body.flags.bypass_rls_flag, undefined, 'bypass_rls_flag flag was stripped');

  const ALLOWED_FLAG_KEYS = new Set([
    'enable_video',
    'enable_upscale',
    'custom_domain_enabled',
    'allow_user_registration',
    'maintenance_mode',
  ]);
  for (const flagKey of Object.keys(body.flags)) {
    assert.ok(
      ALLOWED_FLAG_KEYS.has(flagKey),
      `Non-whitelisted flag appeared in config.flags: "${flagKey}"`
    );
  }

  // 6. Direct unit assertion: sanitizePublicTenantConfig fails if unwhitelisted field is injected
  const poisonedTenant = {
    ...tenant,
    injected_leak: 'malicious_data',
    flags: { enable_video: true, leaked_raw_secret: 'bad' },
  };
  const sanitized = sanitizePublicTenantConfig(poisonedTenant);
  assert.equal(sanitized.injected_leak, undefined, 'sanitizePublicTenantConfig strips unwhitelisted fields');
  assert.equal(sanitized.flags.leaked_raw_secret, undefined, 'sanitizePublicTenantConfig strips unwhitelisted flags');
});

test('P0-1 / S8 / A1 Negative Test: Tenant role querying tenants table cannot see other tenants or balances', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  const tenantA = await createTenant({
    tenantId: 'tnt_leak_test_a',
    slug: 'leak-test-a',
    name: 'Tenant Leak A',
    initialCredits: 500,
  });

  const tenantB = await createTenant({
    tenantId: 'tnt_leak_test_b',
    slug: 'leak-test-b',
    name: 'Tenant Leak B',
    initialCredits: 9999,
  });

  await withTransaction(async (client) => {
    await client.query('SET LOCAL ROLE timecapsule_tenant_role');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA.tenant_id]);

    // 1. SELECT * FROM tenants must only return tenantA
    const allTenants = await client.query('SELECT tenant_id, name, credits_balance FROM tenants');
    assert.equal(allTenants.rows.length, 1, 'Tenant role sees exactly 1 tenant row (itself)');
    assert.equal(allTenants.rows[0].tenant_id, tenantA.tenant_id);
    assert.equal(allTenants.rows[0].credits_balance, '500');

    // 2. Direct lookup of tenantB must return 0 rows
    const bLookup = await client.query('SELECT tenant_id, credits_balance FROM tenants WHERE tenant_id = $1', [
      tenantB.tenant_id,
    ]);
    assert.equal(bLookup.rows.length, 0, 'Tenant A cannot query Tenant B balance or metadata');
  });
});

test('P0-1 / S8 / A1 Negative Test: Tenant role querying users table cannot see other tenants user emails', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  await createTenant({
    tenantId: 'tnt_usr_test_a',
    slug: 'usr-test-a',
    name: 'User Test Tenant A',
  });
  await createTenant({
    tenantId: 'tnt_usr_test_b',
    slug: 'usr-test-b',
    name: 'User Test Tenant B',
  });

  const userA = await createUser({
    userId: 'usr_rls_test_a',
    email: 'user-a@tenant-a.com',
  });
  const userB = await createUser({
    userId: 'usr_rls_test_b',
    email: 'user-b@tenant-b.com',
  });

  await createMembership({
    membershipId: 'mem_rls_test_a',
    userId: userA.user_id,
    tenantId: 'tnt_usr_test_a',
    role: 'end_user',
  });
  await createMembership({
    membershipId: 'mem_rls_test_b',
    userId: userB.user_id,
    tenantId: 'tnt_usr_test_b',
    role: 'end_user',
  });

  await withTransaction(async (client) => {
    await client.query('SET LOCAL ROLE timecapsule_tenant_role');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", ['tnt_usr_test_a']);

    // 1. SELECT user_id, email FROM users must only return userA
    const visibleUsers = await client.query('SELECT user_id, email FROM users');
    assert.equal(visibleUsers.rows.length, 1, 'Tenant A sees only user A');
    assert.equal(visibleUsers.rows[0].user_id, userA.user_id);
    assert.equal(visibleUsers.rows[0].email, 'user-a@tenant-a.com');

    // 2. Direct query for userB email must return 0 rows
    const bEmail = await client.query('SELECT email FROM users WHERE user_id = $1', [userB.user_id]);
    assert.equal(bEmail.rows.length, 0, 'Tenant A cannot query User B email address');
  });
});

test('P0-1 / S8 / A2 Negative Test: Tenant-scoped reads enforce RLS without relying on app-layer checks', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  const tenantA = await createTenant({
    tenantId: 'tnt_read_a',
    slug: 'read-a',
    name: 'Read Tenant A',
    initialCredits: 500,
  });
  const tenantB = await createTenant({
    tenantId: 'tnt_read_b',
    slug: 'read-b',
    name: 'Read Tenant B',
    initialCredits: 500,
  });

  const subB = await createSubmissionTransaction({
    tenantId: tenantB.tenant_id,
    userId: 'usr_b',
    modality: 'image',
    model: 'nano-banana-2',
    resolvedProviderModel: 'nano-banana-2',
    provider: 'muapi',
    estimatedCost: 10,
    inputs: { prompt: 'Secret project B' },
  });
  const jobB = subB.job;

  const assetB = await registerAsset({
    tenant_id: tenantB.tenant_id,
    user_id: 'usr_b',
    job_id: jobB.job_id,
    source_url: 'https://example.com/secret_b.png',
    modality: 'image',
    content_type: 'image/png',
  });

  // 1. getJob with tenantA context must return null for jobB (RLS blocks row)
  const jobLookupA = await getJob(jobB.job_id, { tenant_id: tenantA.tenant_id });
  assert.equal(jobLookupA, null, 'getJob with tenant A context returns null for tenant B job');

  // 2. getAsset with tenantA context must return null for assetB (RLS blocks row)
  const assetLookupA = await getAsset(assetB.asset_id, { tenant_id: tenantA.tenant_id });
  assert.equal(assetLookupA, null, 'getAsset with tenant A context returns null for tenant B asset');

  // 3. getJobPrivateProviderDetails with tenantA context must return null
  const detailsA = await getJobPrivateProviderDetails(jobB.job_id, { tenant_id: tenantA.tenant_id });
  assert.equal(detailsA, null, 'getJobPrivateProviderDetails returns null for cross-tenant job');

  // 4. softDeleteAsset called by tenantA on assetB must return false (0 rows updated)
  const deleteAttempt = await softDeleteAsset({
    tenant_id: tenantA.tenant_id,
    asset_id: assetB.asset_id,
  });
  assert.equal(deleteAttempt, false, 'softDeleteAsset by tenant A cannot delete tenant B asset');

  // 5. Verify assetB remains intact
  const assetBIntact = await getAsset(assetB.asset_id, { tenant_id: tenantB.tenant_id });
  assert.ok(assetBIntact, 'Asset B is intact and readable by tenant B');
  assert.equal(assetBIntact.deleted_at, null, 'Asset B was not soft-deleted');
});

test('Task A4 Guard Test: app/api never imports withSystemContext and raw query() does not touch tenant tables outside context wrapper', async (t) => {
  // Part (a): Check app/api/ for withSystemContext imports
  const apiDir = path.resolve('app/api');
  function findFiles(dir, ext = '.js') {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(findFiles(fullPath, ext));
      } else if (item.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const apiFiles = findFiles(apiDir);
  assert.ok(apiFiles.length > 0, 'Found api route files');
  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(
      !content.includes('withSystemContext'),
      `Route file ${file} must NEVER import or use withSystemContext`
    );
  }

  // Part (b): Verify raw query() calls in packages/timecapsule/src/server/ do not touch tenant tables
  // outside context wrappers. Allowed exceptions: schema_migrations in db.js
  const serverDir = path.resolve('packages/timecapsule/src/server');
  const serverFiles = findFiles(serverDir);
  const TENANT_TABLES = [
    'tenants',
    'users',
    'jobs',
    'assets',
    'credit_reservations',
    'credit_ledger',
    'idempotency_keys',
    'memberships',
    'job_events',
  ];

  for (const file of serverFiles) {
    const basename = path.basename(file);
    if (basename === 'db.js') continue; // db.js contains low-level driver primitives

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match raw query(...) from db.js, not client.query(...) or pool.query(...)
      const rawQueryMatch = /(?<!client\.|pool\.)\bquery\(/.test(line);
      if (rawQueryMatch) {
        for (const tbl of TENANT_TABLES) {
          const tableRegex = new RegExp(`\\b${tbl}\\b`, 'i');
          if (tableRegex.test(line)) {
            assert.fail(
              `Raw query() touches tenant table "${tbl}" outside context wrapper at ${basename}:${i + 1}: ${line.trim()}`
            );
          }
        }
      }
    }
  }
});

test('Task A5 Test: assertRuntimeRoleSafety refuses superuser or BYPASSRLS in production', async (t) => {
  const originalEnv = process.env.NODE_ENV;
  const originalOverride = process.env.TIMECAPSULE_ALLOW_INSECURE_DEV_ROLE;
  const originalDestructive = process.env.TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB;
  const originalTestMode = process.env.TIMECAPSULE_TEST_MODE;

  try {
    // 1. Mock insecure role (superuser = true) under NODE_ENV=production
    process.env.NODE_ENV = 'production';
    const mockInsecureClient = {
      query: async (sql) => {
        if (sql.includes('pg_roles')) {
          return { rowCount: 1, rows: [{ current_user: 'postgres', rolsuper: true, rolbypassrls: true }] };
        }
        return { rowCount: 0, rows: [] };
      },
    };

    await assert.rejects(
      async () => {
        await assertRuntimeRoleSafety(mockInsecureClient);
      },
      (err) => {
        assert.equal(err.code, 'INSECURE_RUNTIME_ROLE');
        assert.ok(err.message.includes('insecure (superuser=true, bypassrls=true)'));
        return true;
      },
      'assertRuntimeRoleSafety strictly refuses superuser connection in production'
    );

    // 2. In non-production without dev override, it must also fail
    process.env.NODE_ENV = 'development';
    delete process.env.TIMECAPSULE_ALLOW_INSECURE_DEV_ROLE;
    delete process.env.TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB;
    delete process.env.TIMECAPSULE_TEST_MODE;

    await assert.rejects(
      async () => {
        await assertRuntimeRoleSafety(mockInsecureClient);
      },
      (err) => {
        assert.equal(err.code, 'INSECURE_RUNTIME_ROLE');
        assert.ok(err.message.includes('TIMECAPSULE_ALLOW_INSECURE_DEV_ROLE=1'));
        return true;
      },
      'assertRuntimeRoleSafety refuses superuser connection in dev without explicit override'
    );

    // 3. Secure role (non-superuser, no bypassrls) passes cleanly in production
    process.env.NODE_ENV = 'production';
    const mockSecureClient = {
      query: async (sql) => {
        if (sql.includes('pg_roles')) {
          return { rowCount: 1, rows: [{ current_user: 'timecapsule_app_user', rolsuper: false, rolbypassrls: false }] };
        }
        return { rowCount: 0, rows: [] };
      },
    };
    await assertRuntimeRoleSafety(mockSecureClient);
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalOverride !== undefined) {
      process.env.TIMECAPSULE_ALLOW_INSECURE_DEV_ROLE = originalOverride;
    }
    if (originalDestructive !== undefined) {
      process.env.TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB = originalDestructive;
    }
    if (originalTestMode !== undefined) {
      process.env.TIMECAPSULE_TEST_MODE = originalTestMode;
    }
  }
});

test('Task B1: Branding validation at write and read time (rejects javascript:, CSS injection, non-hex colors)', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  // 1. Write-time rejection of non-hex primary_color
  await assert.rejects(
    async () => {
      await createTenant({
        tenantId: 'tnt_bad_color',
        name: 'Bad Color Tenant',
        branding: { primary_color: 'red' },
      });
    },
    (err) => {
      assert.equal(err.code, 'INVALID_BRANDING_PRIMARY_COLOR');
      return true;
    },
    'createTenant must reject non-hex primary_color at write time'
  );

  // 2. Write-time rejection of javascript: logo_url
  await assert.rejects(
    async () => {
      await createTenant({
        tenantId: 'tnt_bad_logo',
        name: 'Bad Logo Tenant',
        branding: { logo_url: 'javascript:alert(document.cookie)' },
      });
    },
    (err) => {
      assert.equal(err.code, 'INVALID_BRANDING_LOGO_URL');
      return true;
    },
    'createTenant must reject javascript: logo_url at write time'
  );

  // 3. Write-time rejection of CSS injection in font_family
  await assert.rejects(
    async () => {
      await createTenant({
        tenantId: 'tnt_bad_font',
        name: 'Bad Font Tenant',
        branding: { font_family: 'Inter; } body { display:none } /*' },
      });
    },
    (err) => {
      assert.equal(err.code, 'INVALID_BRANDING_FONT_FAMILY');
      return true;
    },
    'createTenant must reject CSS injection in font_family at write time'
  );

  // 4. Valid branding writes succeed cleanly
  const validTenant = await createTenant({
    tenantId: 'tnt_valid_branding',
    slug: 'valid-branding',
    name: 'Valid Branding Studio',
    branding: {
      app_name: 'Studio Prime',
      primary_color: '#00e5ff',
      secondary_color: '#9b8cff',
      logo_url: 'https://cdn.timecapsule.ai/logo.png',
      favicon_url: '/favicon.svg',
      font_family: 'Inter, sans-serif',
    },
  });
  assert.equal(validTenant.branding.primary_color, '#00e5ff');

  // 5. Read-time sanitization strips dirty DB records if injected directly into database
  const dirtyBranding = {
    app_name: '<script>alert(1)</script>Injected',
    primary_color: '#00e5ff; background: red;',
    secondary_color: '#9b8cff',
    logo_url: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    favicon_url: 'https://cdn.timecapsule.ai/favicon.ico',
    font_family: 'Roboto"; @import url("evil.css");',
    theme_preset: 'cyberpunk',
  };
  const sanitized = sanitizeBrandingAtReadTime(dirtyBranding);
  assert.equal(sanitized.primary_color, undefined, 'Invalid color with CSS injection stripped');
  assert.equal(sanitized.secondary_color, '#9b8cff');
  assert.equal(sanitized.logo_url, undefined, 'data: URI stripped at read time');
  assert.equal(sanitized.favicon_url, 'https://cdn.timecapsule.ai/favicon.ico');
  assert.equal(sanitized.font_family, undefined, 'Font with CSS injection stripped at read time');
  assert.equal(sanitized.app_name, undefined, 'app_name with HTML tags stripped');
  assert.equal(sanitized.theme_preset, 'cyberpunk');
});

test('Task B3: /api/v1/tenant/config returns private max-age=60 with deterministic ETag and 304 Not Modified', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  const tenant = await createTenant({
    tenantId: 'tnt_etag_test',
    slug: 'etag-studio',
    name: 'ETag Studio',
    status: 'active',
    branding: {
      app_name: 'ETag App',
      primary_color: '#00e5ff',
    },
  });

  // First request: returns 200 with Cache-Control and ETag header
  const req1 = new Request('http://localhost:3000/api/v1/tenant/config', {
    method: 'GET',
    headers: {
      'x-timecapsule-tenant-id': tenant.tenant_id,
    },
  });

  const res1 = await getTenantConfigRoute(req1);
  assert.equal(res1.status, 200);

  const cacheControl = res1.headers.get('cache-control') || '';
  assert.ok(cacheControl.includes('private'), 'Cache-Control must be private');
  assert.ok(cacheControl.includes('max-age=60'), 'Cache-Control must specify max-age=60');

  const etag = res1.headers.get('etag');
  assert.ok(etag && etag.startsWith('W/"'), 'ETag must be returned as weak validator');

  // Second request: If-None-Match matches ETag -> returns 304 Not Modified with empty body
  const req2 = new Request('http://localhost:3000/api/v1/tenant/config', {
    method: 'GET',
    headers: {
      'x-timecapsule-tenant-id': tenant.tenant_id,
      'if-none-match': etag,
    },
  });

  const res2 = await getTenantConfigRoute(req2);
  assert.equal(res2.status, 304, 'Server must return 304 Not Modified when ETag matches');
  assert.equal(res2.headers.get('etag'), etag);
  const text2 = await res2.text();
  assert.equal(text2, '', '304 response body must be empty');
});

test('Task S3: Recheck user role in database on privileged operations (assertAdminRole rejects revoked/downgraded role)', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  const tenant = await createTenant({
    tenantId: 'tnt_s3_audit',
    slug: 's3-audit',
    name: 'S3 Audit Studio',
  });

  const user = await createUser({
    userId: 'usr_s3_admin',
    email: 'admin@s3audit.com',
  });

  // Initially active platform_admin membership in database
  await createMembership({
    userId: user.user_id,
    tenantId: tenant.tenant_id,
    role: 'platform_admin',
    status: 'active',
  });

  // Client holds session claiming platform_admin
  const session = {
    user_id: user.user_id,
    tenant_id: tenant.tenant_id,
    role: 'platform_admin',
  };

  // 1. Initial check passes
  await assertAdminRoleWithDatabaseCheck(session);

  // 2. User role is downgraded to 'end_user' in PostgreSQL
  await createMembership({
    userId: user.user_id,
    tenantId: tenant.tenant_id,
    role: 'end_user',
    status: 'active',
  });

  // Rechecking DB strictly rejects the stale session role
  await assert.rejects(
    async () => {
      await assertAdminRoleWithDatabaseCheck(session);
    },
    (err) => {
      assert.equal(err.code, 'ROLE_DOWNGRADED');
      return true;
    },
    'assertAdminRoleWithDatabaseCheck must reject user whose DB role was downgraded despite token claim'
  );

  // 3. User membership is revoked / inactive in PostgreSQL
  await createMembership({
    userId: user.user_id,
    tenantId: tenant.tenant_id,
    role: 'platform_admin',
    status: 'suspended',
  });

  await assert.rejects(
    async () => {
      await assertAdminRoleWithDatabaseCheck(session);
    },
    (err) => {
      assert.equal(err.code, 'MEMBERSHIP_REVOKED');
      return true;
    },
    'assertAdminRoleWithDatabaseCheck must reject user whose DB membership is suspended or revoked'
  );
});

test('Task S4: PREVIEW_IDENTITY platform_admin fallback is env-gated OFF in production', async (t) => {
  const originalEnv = process.env.NODE_ENV;
  try {
    // 1. In non-production, preview session token can issue platform_admin for local dev
    process.env.NODE_ENV = 'development';
    const devToken = issuePreviewSessionToken();
    const devSession = verifySessionToken(devToken);
    assert.equal(devSession.role, 'platform_admin');

    // 2. In production, issuePreviewSessionToken forces 'end_user' role
    process.env.NODE_ENV = 'production';
    const prodToken = issuePreviewSessionToken();
    const prodSession = verifySessionToken(prodToken);
    assert.equal(
      prodSession.role,
      'end_user',
      'Preview token must be demoted to end_user in production (S4)'
    );

    // 3. Even if a token forged or claimed platform_admin with preview identity, verifySessionToken forces end_user
    const spoofedDevToken = devToken; // signed with platform_admin
    const spoofedInProd = verifySessionToken(spoofedDevToken);
    assert.equal(
      spoofedInProd.role,
      'end_user',
      'verifySessionToken must strictly demote preview identity role to end_user in production'
    );

    // 4. assertAdminRole rejects private_preview sessions in production
    await assert.rejects(
      async () => {
        await assertAdminRole(spoofedInProd);
      },
      (err) => {
        assert.equal(err.code, 'PREVIEW_ADMIN_FORBIDDEN_IN_PRODUCTION');
        return true;
      },
      'assertAdminRole must refuse preview identity admin rights in production'
    );
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test('Task S6: Anonymous client headers x-timecapsule-tenant-id/slug cannot spoof tenant resolution', async (t) => {
  assertDisposableTestDatabase();
  await resetStoreForTests();
  await runMigrations();

  const victimTenant = await createTenant({
    tenantId: 'tnt_victim_corp',
    slug: 'victim-corp',
    name: 'Victim Corp Private Data',
  });

  const originalEnv = process.env.NODE_ENV;
  const originalTestMode = process.env.TIMECAPSULE_TEST_MODE;
  try {
    // Simulate production / untrusted external request
    process.env.NODE_ENV = 'production';
    delete process.env.TIMECAPSULE_TEST_MODE;

    // Anonymous attacker passes x-timecapsule-tenant-id header aiming to resolve victim tenant
    const spoofReq = new Request('http://localhost:3002/api/v1/tenant/config', {
      headers: {
        'x-timecapsule-tenant-id': victimTenant.tenant_id,
        'x-timecapsule-tenant-slug': victimTenant.slug,
      },
    });

    const resolvedTenant = await resolveTenantFromRequest(spoofReq, null);

    // Must NOT resolve to victim tenant!
    assert.notEqual(
      resolvedTenant.tenant_id,
      victimTenant.tenant_id,
      'Anonymous request with x-timecapsule-tenant-id MUST NOT resolve to victim tenant (S6)'
    );
    assert.equal(
      resolvedTenant.slug,
      'default',
      'Untrusted client headers must be ignored, falling back to public default tenant'
    );
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalTestMode !== undefined) {
      process.env.TIMECAPSULE_TEST_MODE = originalTestMode;
    }
  }
});

test('Security Task B1: Rate-Limiting & Abuse Prevention (Token bucket/sliding window, 429 Retry-After, IP/user isolation)', async (t) => {
  resetRateLimits();

  // 1. Client under limit passes successfully
  const dummyReq = new Request('http://localhost:3000/api/v1/generations', {
    headers: { 'x-forwarded-for': '203.0.113.10' },
  });

  const status1 = checkRateLimit(dummyReq, { action: 'auth', limit: 3, windowMs: 10000 });
  assert.equal(status1.remaining, 2);
  assert.equal(status1.headers['X-RateLimit-Limit'], '3');
  assert.equal(status1.headers['X-RateLimit-Remaining'], '2');

  const status2 = checkRateLimit(dummyReq, { action: 'auth', limit: 3, windowMs: 10000 });
  assert.equal(status2.remaining, 1);

  const status3 = checkRateLimit(dummyReq, { action: 'auth', limit: 3, windowMs: 10000 });
  assert.equal(status3.remaining, 0);

  // 4th request must throw 429 with Retry-After header
  assert.throws(
    () => {
      checkRateLimit(dummyReq, { action: 'auth', limit: 3, windowMs: 10000 });
    },
    (err) => {
      assert.equal(err.statusCode, 429);
      assert.equal(err.code, 'RATE_LIMIT_EXCEEDED');
      assert.ok(Number(err.headers['Retry-After']) >= 1);
      return true;
    },
    'Exceeding limit must throw RATE_LIMIT_EXCEEDED with 429'
  );

  // 2. Different client IP has a separate bucket (no noisy neighbor starvation)
  const anotherClientReq = new Request('http://localhost:3000/api/v1/generations', {
    headers: { 'x-forwarded-for': '203.0.113.20' },
  });
  const anotherStatus = checkRateLimit(anotherClientReq, { action: 'auth', limit: 3, windowMs: 10000 });
  assert.equal(anotherStatus.remaining, 2, 'Separate IP address has distinct bucket');

  // 3. User session keying isolates authenticated users
  const userAReq = new Request('http://localhost:3000/api/v1/generations');
  const userBReq = new Request('http://localhost:3000/api/v1/generations');
  const sessionA = { user_id: 'usr_alpha', tenant_id: 'tnt_1' };
  const sessionB = { user_id: 'usr_beta', tenant_id: 'tnt_1' };

  checkRateLimit(userAReq, { action: 'generation', limit: 1, session: sessionA });
  assert.throws(
    () => checkRateLimit(userAReq, { action: 'generation', limit: 1, session: sessionA }),
    (err) => err.statusCode === 429
  );
  // User B still has their full quota
  const uBStatus = checkRateLimit(userBReq, { action: 'generation', limit: 1, session: sessionB });
  assert.equal(uBStatus.remaining, 0);

  resetRateLimits();
});

test('Security Task B2: CORS & Origin Isolation (Strict preflight OPTIONS, allowed origin reflection, unauthorized rejection)', async (t) => {
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;
  try {
    process.env.ALLOWED_ORIGINS = 'https://partner.timecapsule.studio,https://custom-studio.com';

    // 1. Same origin request is allowed
    const sameOriginReq = new Request('http://localhost:3000/api/v1/models', {
      headers: { host: 'localhost:3000', origin: 'http://localhost:3000' },
    });
    const sameOriginEval = isOriginAllowed(sameOriginReq);
    assert.equal(sameOriginEval.allowed, true);
    assert.equal(sameOriginEval.isSameOrigin, true);

    // 2. Explicitly allowed origin reflects CORS headers
    const allowedPartnerReq = new Request('http://localhost:3000/api/v1/models', {
      headers: { host: 'localhost:3000', origin: 'https://partner.timecapsule.studio' },
    });
    const partnerEval = isOriginAllowed(allowedPartnerReq);
    assert.equal(partnerEval.allowed, true);
    assert.equal(partnerEval.isSameOrigin, false);

    const partnerHeaders = getCorsHeaders(allowedPartnerReq);
    assert.equal(partnerHeaders['Access-Control-Allow-Origin'], 'https://partner.timecapsule.studio');
    assert.equal(partnerHeaders['Access-Control-Allow-Credentials'], 'true');

    // 3. Unauthorized attacker origin is rejected
    const evilOriginReq = new Request('http://localhost:3000/api/v1/models', {
      headers: { host: 'localhost:3000', origin: 'https://evil-attacker-site.com' },
    });
    const evilEval = isOriginAllowed(evilOriginReq);
    assert.equal(evilEval.allowed, false);

    const evilHeaders = getCorsHeaders(evilOriginReq);
    assert.equal(evilHeaders['Access-Control-Allow-Origin'], undefined, 'Unauthorized origin does not receive Allow-Origin header');

    // 4. Preflight OPTIONS for evil origin returns 403 Forbidden
    const evilPreflightReq = new Request('http://localhost:3000/api/v1/generations', {
      method: 'OPTIONS',
      headers: {
        host: 'localhost:3000',
        origin: 'https://evil-attacker-site.com',
        'access-control-request-method': 'POST',
      },
    });
    const preflightEvilRes = handleCorsPreflight(evilPreflightReq);
    assert.equal(preflightEvilRes.status, 403);
    const evilPreflightData = await preflightEvilRes.json();
    assert.equal(evilPreflightData.code, 'CORS_ORIGIN_DENIED');

    // 5. Preflight OPTIONS for allowed origin returns 204 No Content
    const allowedPreflightReq = new Request('http://localhost:3000/api/v1/generations', {
      method: 'OPTIONS',
      headers: {
        host: 'localhost:3000',
        origin: 'https://custom-studio.com',
        'access-control-request-method': 'POST',
      },
    });
    const preflightAllowedRes = handleCorsPreflight(allowedPreflightReq);
    assert.equal(preflightAllowedRes.status, 204);
    assert.equal(preflightAllowedRes.headers.get('Access-Control-Allow-Origin'), 'https://custom-studio.com');
    assert.equal(preflightAllowedRes.headers.get('Access-Control-Allow-Credentials'), 'true');
    assert.ok(preflightAllowedRes.headers.get('Access-Control-Allow-Methods').includes('POST'));
  } finally {
    process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
  }
});

test('Security Task B3: Credential Handling & Secret Scrubbing (Masking API keys, tokens, and DB connection strings)', async (t) => {
  // 1. Database URL with raw credentials is scrubbed
  const rawDbUrl = 'postgresql://timecapsule_admin:SuperSecretPass123!@localhost:5432/timecapsule_prod';
  const scrubbedDb = scrubSecrets({ databaseUrl: rawDbUrl });
  assert.equal(
    scrubbedDb.databaseUrl,
    'postgresql://timecapsule_admin:[REDACTED]@localhost:5432/timecapsule_prod',
    'Database passwords must be scrubbed from connection strings'
  );

  // 2. Sensitive object keys are scrubbed
  const payloadWithSecrets = {
    user: 'tester',
    api_key: 'muapi-sk-live-1234567890abcdef',
    token: 'jwt.header.payload.signature',
    credentials: {
      password: 'mypassword',
      nested_key: 'public_value',
    },
    headers: {
      authorization: 'Bearer super_secret_access_token_12345',
    },
  };
  const cleanPayload = scrubSecrets(payloadWithSecrets);
  assert.equal(cleanPayload.api_key, '[REDACTED]');
  assert.equal(cleanPayload.token, '[REDACTED]');
  assert.equal(cleanPayload.credentials.password, '[REDACTED]');
  assert.equal(cleanPayload.credentials.nested_key, 'public_value');
  assert.equal(cleanPayload.headers.authorization, '[REDACTED]');

  // 3. assertNoExposedSecrets catches leaks
  assert.throws(
    () => assertNoExposedSecrets('Connection error: postgresql://admin:p@ssword@db.host:5432/db failed'),
    (err) => err.message.includes('database credentials detected')
  );

  // 4. sanitizeError in production shields internal error stacks and 5xx details
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const internalErr = new Error('Database connection failed at postgresql://user:pass@internal.db:5432/db');
    internalErr.statusCode = 500;
    const safeRes = sanitizeError(internalErr);
    assert.equal(safeRes.statusCode, 500);
    assert.equal(safeRes.error, 'An unexpected server error occurred. Please try again later.');
    assert.ok(!safeRes.error.includes('pass'));
    assert.ok(!safeRes.error.includes('internal.db'));
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test('Task C1 & C2: User-Scoped Uploads Deletion and No Source URL Exposure', async (t) => {
  assertDisposableTestDatabase();
  process.env.TIMECAPSULE_SESSION_SECRET = 'checkpoint3a-secret-value-at-least-32-bytes';
  process.env.TIMECAPSULE_TEST_MODE = '1';
  await runMigrations();
  await resetStoreForTests();

  const tenantId = 'tnt_scope_test';
  await createTenant({ tenantId, slug: 'scope-test', name: 'Scope Test Studio' });

  const tokenUser1 = issueTenantSessionToken({ tenantId, userId: 'usr_owner_1', role: 'end_user' });
  const tokenUser2 = issueTenantSessionToken({ tenantId, userId: 'usr_stranger_2', role: 'end_user' });
  const tokenAdmin = issueTenantSessionToken({ tenantId, userId: 'usr_admin', role: 'admin' });

  // 1. User 1 uploads an asset
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03]);
  const postReq = new Request('http://localhost:3000/api/v1/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Timecapsule-CSRF': '1',
      cookie: `tc_session=${tokenUser1}`,
    },
    body: JSON.stringify({
      dataUrl: `data:image/png;base64,${pngBytes.toString('base64')}`,
      contentType: 'image/png',
      filename: 'my_private_ref.png',
    }),
  });
  const postRes = await postUploadRoute(postReq);
  const postData = await postRes.json();
  assert.equal(postRes.status, 200);
  const assetId = postData.asset_id;

  // 2. User 2 (same tenant, different user) attempts to DELETE asset -> 403 Forbidden (Task C1)
  const delReqUser2 = new Request(`http://localhost:3000/api/v1/uploads/${assetId}`, {
    method: 'DELETE',
    headers: {
      'X-Timecapsule-CSRF': '1',
      cookie: `tc_session=${tokenUser2}`,
    },
  });
  const delResUser2 = await deleteUploadRoute(delReqUser2, { params: Promise.resolve({ assetId }) });
  assert.equal(delResUser2.status, 403, 'Same-tenant different-user delete must return 403');
  const delDataUser2 = await delResUser2.json();
  assert.equal(delDataUser2.code, 'FORBIDDEN_ASSET_DELETE');

  // 3. User 1 lists uploads: GET /api/v1/uploads must NOT return source_url (Task C2)
  const listReq = new Request('http://localhost:3000/api/v1/uploads?limit=invalid_nan', {
    method: 'GET',
    headers: {
      cookie: `tc_session=${tokenUser1}`,
    },
  });
  const listRes = await getUploadsRoute(listReq);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.equal(listData.ok, true);
  const found = listData.uploads.find((u) => u.asset_id === assetId);
  assert.ok(found);
  assert.equal(found.source_url, undefined, 'source_url must NOT be exposed in GET /api/v1/uploads (Task C2)');
  assert.ok(found.url);
  assert.equal(found.filename, 'my_private_ref.png');

  // 4. Admin deletes the asset -> 200 OK (Task C1)
  const delReqAdmin = new Request(`http://localhost:3000/api/v1/uploads/${assetId}`, {
    method: 'DELETE',
    headers: {
      'X-Timecapsule-CSRF': '1',
      cookie: `tc_session=${tokenAdmin}`,
    },
  });
  const delResAdmin = await deleteUploadRoute(delReqAdmin, { params: Promise.resolve({ assetId }) });
  assert.equal(delResAdmin.status, 200, 'Admin can delete any tenant asset');
  const delDataAdmin = await delResAdmin.json();
  assert.equal(delDataAdmin.deleted, true);
});

test('Task C3: validateFileMagicBytes fails closed for unhandled MIME types', async (t) => {
  // Valid PNG passes
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  assert.equal(validateFileMagicBytes(pngBytes, 'image/png'), true);

  // Unhandled MIME type fails closed (throws 415 MAGIC_BYTE_MISMATCH)
  assert.throws(
    () => {
      validateFileMagicBytes(Buffer.from('arbitrary binary payload header'), 'application/x-shockwave-flash');
    },
    (err) => {
      assert.equal(err.statusCode, 415);
      assert.equal(err.code, 'MAGIC_BYTE_MISMATCH');
      return true;
    },
    'validateFileMagicBytes must fail closed on unhandled MIME types (Task C3)'
  );
});

test('Template Registry Track: Multi-tenant RLS isolation on app_templates', async (t) => {
  assertDisposableTestDatabase();
  await runMigrations();

  const tenantA = await createTenant({
    tenantId: 'tnt_tmpl_alpha',
    slug: 'tmpl-alpha',
    name: 'Template Tenant Alpha',
    initialCredits: 1000,
  });
  const tenantB = await createTenant({
    tenantId: 'tnt_tmpl_beta',
    slug: 'tmpl-beta',
    name: 'Template Tenant Beta',
    initialCredits: 1000,
  });

  // System context inserts a private template owned exclusively by tenantA
  await withSystemContext(async (client) => {
    await client.query(
      `INSERT INTO app_templates (
        id, slug, tenant_id, version, title, category, description,
        model_id, prompt_template, default_parameters, status
      ) VALUES (
        'tmpl_priv_alpha',
        'alpha-private-concept',
        'tnt_tmpl_alpha',
        1,
        'Alpha Private Ceramic Design',
        'Ceramic Concept',
        'Private ceramic prompt framework for tenant alpha.',
        'nano-banana-pro',
        'Studio ceramic photography, {user_prompt}, warm lighting',
        '{"aspect_ratio": "1:1", "resolution": "1k"}'::jsonb,
        'published'
      ) ON CONFLICT (slug) DO NOTHING`
    );
  });

  // 1. Tenant Alpha queries templates: sees published global templates + their private template
  const alphaTemplates = await getTemplatesForTenant(tenantA.tenant_id);
  const alphaSlugs = alphaTemplates.map((tmpl) => tmpl.slug);
  assert.ok(alphaSlugs.includes('product-concept-pro'), 'Alpha sees global product concept');
  assert.ok(alphaSlugs.includes('brand-logo-concept'), 'Alpha sees global brand logo');
  assert.ok(alphaSlugs.includes('alpha-private-concept'), 'Alpha sees their own private template');

  const alphaPrivateDirect = await getTemplateBySlug('alpha-private-concept', tenantA.tenant_id);
  assert.ok(alphaPrivateDirect);
  assert.equal(alphaPrivateDirect.title, 'Alpha Private Ceramic Design');

  // 2. Tenant Beta queries templates: sees ONLY published global templates; Alpha private template is invisible under RLS
  const betaTemplates = await getTemplatesForTenant(tenantB.tenant_id);
  const betaSlugs = betaTemplates.map((tmpl) => tmpl.slug);
  assert.ok(betaSlugs.includes('product-concept-pro'), 'Beta sees global product concept');
  assert.ok(betaSlugs.includes('brand-logo-concept'), 'Beta sees global brand logo');
  assert.equal(betaSlugs.includes('alpha-private-concept'), false, 'Beta CANNOT see Alpha private template under RLS');

  const betaPrivateDirect = await getTemplateBySlug('alpha-private-concept', tenantB.tenant_id);
  assert.equal(betaPrivateDirect, null, 'Direct slug lookup for foreign private template returns null under RLS');
});

test('Template Registry Track: Global draft and archived templates are hidden from tenants', async (t) => {
  assertDisposableTestDatabase();
  await runMigrations();

  const tenant = await createTenant({
    tenantId: 'tnt_tmpl_gamma',
    slug: 'tmpl-gamma',
    name: 'Template Tenant Gamma',
    initialCredits: 1000,
  });

  // System context inserts a global draft and a global archived template
  await withSystemContext(async (client) => {
    await client.query(
      `INSERT INTO app_templates (
        id, slug, tenant_id, version, title, category, description,
        model_id, prompt_template, default_parameters, status
      ) VALUES (
        'tmpl_global_draft_01',
        'global-draft-template',
        NULL,
        1,
        'Unreleased Global Template',
        'Experimental',
        'Draft template not yet approved for public registry.',
        'nano-banana-pro',
        'Draft experiment: {user_prompt}',
        '{"aspect_ratio": "1:1", "resolution": "1k"}'::jsonb,
        'draft'
      ), (
        'tmpl_global_arch_01',
        'global-archived-template',
        NULL,
        1,
        'Deprecated Global Template',
        'Legacy',
        'Archived template retired from active registry.',
        'nano-banana-pro',
        'Archived prompt: {user_prompt}',
        '{"aspect_ratio": "1:1", "resolution": "1k"}'::jsonb,
        'archived'
      ) ON CONFLICT (slug) DO UPDATE SET status = EXCLUDED.status`
    );
  });

  // 1. Database layer: Ordinary tenant cannot see draft or archived global templates
  const tenantTemplates = await getTemplatesForTenant(tenant.tenant_id);
  const slugs = tenantTemplates.map((tmpl) => tmpl.slug);
  assert.equal(slugs.includes('global-draft-template'), false, 'Draft global template must NOT be visible');
  assert.equal(slugs.includes('global-archived-template'), false, 'Archived global template must NOT be visible');

  assert.equal(await getTemplateBySlug('global-draft-template', tenant.tenant_id), null);
  assert.equal(await getTemplateBySlug('global-archived-template', tenant.tenant_id), null);

  // 2. HTTP API layer: GET /api/v1/templates returns only published templates with ETag
  const user = await createUser({
    userId: 'usr_tmpl_gamma',
    email: 'gamma@timecapsule.test',
  });
  await createMembership({
    tenantId: tenant.tenant_id,
    userId: user.user_id,
    role: 'end_user',
  });
  const token = issueTenantSessionToken({
    userId: user.user_id,
    tenantId: tenant.tenant_id,
    role: 'end_user',
    emailVerified: true,
  });

  const req = new Request('http://localhost:3000/api/v1/templates', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: 'http://localhost:3000',
    },
  });

  const res = await getTemplatesRoute(req);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'private, max-age=60');
  const etag = res.headers.get('etag');
  assert.ok(etag, 'ETag header is present');

  const data = await res.json();
  assert.equal(data.ok, true);
  const routeSlugs = data.templates.map((t) => t.slug);
  assert.ok(routeSlugs.includes('product-concept-pro'));
  assert.ok(routeSlugs.includes('brand-logo-concept'));
  assert.equal(routeSlugs.includes('global-draft-template'), false);
  assert.equal(routeSlugs.includes('global-archived-template'), false);

  // 3. ETag 304 Not Modified validation
  const cachedReq = new Request('http://localhost:3000/api/v1/templates', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'If-None-Match': etag,
    },
  });
  const cachedRes = await getTemplatesRoute(cachedReq);
  assert.equal(cachedRes.status, 304, 'Returns 304 on matching ETag');
});

test('Template Registry Track: Server-side prompt synthesis, parameter snapshot, and credit safety', async (t) => {
  assertDisposableTestDatabase();
  await runMigrations();

  const tenant = await createTenant({
    tenantId: 'tnt_tmpl_delta',
    slug: 'tmpl-delta',
    name: 'Template Tenant Delta',
    initialCredits: 1000,
  });
  const user = await createUser({
    userId: 'usr_tmpl_delta',
    email: 'delta@timecapsule.test',
  });
  await createMembership({
    tenantId: tenant.tenant_id,
    userId: user.user_id,
    role: 'end_user',
  });

  const session = {
    user_id: user.user_id,
    tenant_id: tenant.tenant_id,
    role: 'end_user',
    auth_mode: 'tenant_session',
    email_verified: true,
  };

  // 1. Validation Failures (missing prompt, excessive prompt, non-existent template)
  await assert.rejects(
    async () => {
      await submitGenerationJob({
        session,
        body: {
          template_slug: 'product-concept-pro',
          input_variables: { user_prompt: '' },
        },
      });
    },
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'MISSING_TEMPLATE_VARIABLE');
      return true;
    },
    'Rejects empty user_prompt with MISSING_TEMPLATE_VARIABLE'
  );

  await assert.rejects(
    async () => {
      await submitGenerationJob({
        session,
        body: {
          template_slug: 'product-concept-pro',
          input_variables: { user_prompt: 'x'.repeat(MAX_TEMPLATE_USER_INPUT_LENGTH + 1) },
        },
      });
    },
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'TEMPLATE_VARIABLE_TOO_LONG');
      return true;
    },
    'Rejects oversized user_prompt with TEMPLATE_VARIABLE_TOO_LONG'
  );

  await assert.rejects(
    async () => {
      await submitGenerationJob({
        session,
        body: {
          template_slug: 'non-existent-template-slug',
          input_variables: { user_prompt: 'A ceramic vase' },
        },
      });
    },
    (err) => {
      assert.equal(err.statusCode, 404);
      assert.equal(err.code, 'TEMPLATE_NOT_FOUND');
      return true;
    },
    'Rejects invalid template slug with TEMPLATE_NOT_FOUND (404)'
  );

  // 2. Successful job submission with template prompt synthesis
  const originalEnv = process.env.MUAPI_API_KEY;
  try {
    process.env.MUAPI_API_KEY = 'muapi-test-key-contract-tested';

    const { job } = await submitGenerationJob({
      session,
      body: {
        template_slug: 'product-concept-pro',
        input_variables: {
          user_prompt: 'Minimalist matte obsidian travel tumbler with copper accents',
        },
      },
    });

    assert.ok(job.job_id);
    assert.equal(job.model, 'nano-banana-pro', 'Model forced to template model_id (nano-banana-pro)');
    assert.equal(job.provider, 'muapi');
    assert.equal(job.execution_route, 'muapi:predictions/v1:nano-banana-pro');
    assert.equal(job.credits_reserved, 15, 'Base 1K resolution reserves exactly 15 credits under tier_image_resolution_v1');

    // Verify snapshot in job inputs
    assert.equal(job.inputs.template_slug, 'product-concept-pro');
    assert.equal(job.inputs.template_version, 1);
    assert.equal(job.inputs.aspect_ratio, '1:1');
    assert.equal(job.inputs.resolution, '1k');

    // Verify synthesized prompt has the curated studio photography harness
    const expectedPrompt =
      'Commercial studio product concept photography, Minimalist matte obsidian travel tumbler with copper accents, centered composition, soft diffuse studio strobe lighting, clean commercial backdrop, f/4 aperture, crisp packaging typography, photorealistic 8k';
    assert.equal(job.inputs.prompt, expectedPrompt, 'Synthesizes server-side prompt using DB prompt_template');

    // Verify persisted job record from DB
    const persisted = await getJob(job.job_id);
    assert.equal(persisted.inputs.prompt, expectedPrompt);
    assert.equal(persisted.inputs.template_slug, 'product-concept-pro');
    assert.equal(persisted.inputs.template_version, 1);
  } finally {
    process.env.MUAPI_API_KEY = originalEnv;
  }
});
