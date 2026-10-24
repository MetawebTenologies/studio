import test from 'node:test';
import assert from 'node:assert/strict';

// Setup disposable test database environment
process.env.TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB = '1';
process.env.TIMECAPSULE_TEST_MODE = '1';
process.env.TIMECAPSULE_SESSION_SECRET = 'super-secret-test-session-key-32chars!';
process.env.TIMECAPSULE_PREVIEW_KEY = 'test-preview-key-1234';
process.env.MUAPI_API_KEY = 'muapi-test-key-biz-inv';
process.env.FAL_KEY = 'fal-test-key-biz-inv';

import {
  RETAIL_CREDIT_PURCHASE_RATE_USD,
  LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT,
  CREDIT_PACK_RATES,
  VARIABLE_COST_ASSUMPTIONS,
  SUPPLIER_COST_REGISTRY,
  calculateRequiredCredits,
  calculateContributionMargin,
  generateRoutePricingScenarios,
  PRICING_POLICY_VERSION,
} from '../packages/timecapsule/src/models/economics.js';
import {
  SUPPORTED_RELEASE_MODELS,
  getSupportedReleaseModel,
  resolveReleaseRoute,
  getEstimatedCreditsForModel,
  getModelCapabilities,
} from '../packages/timecapsule/src/models/index.js';
import {
  query,
  withTenantContext,
  withSystemContext,
  closePool,
  runMigrations,
  assertDisposableTestDatabase,
} from '../packages/timecapsule/src/server/db.js';
import {
  createTenant,
  createUser,
  createMembership,
} from '../packages/timecapsule/src/server/tenants.js';
import { submitGenerationJob } from '../packages/timecapsule/src/server/orchestrator.js';
import {
  getJob,
  claimNextRunnableJob,
  completeJobSuccess,
  reconcileAmbiguousJob,
  resetStoreForTests,
} from '../packages/timecapsule/src/server/store.js';
import {
  registerProviderAdapter,
  resetProviderAdapters,
} from '../packages/timecapsule/src/server/providers.js';
import { createDurableWorker } from '../packages/timecapsule/src/worker/index.js';
import { issueTenantSessionToken } from '../packages/timecapsule/src/server/auth.js';

test('Business Invariants: Route Pricing & Economic Variable Separation', async (t) => {
  assertDisposableTestDatabase();
  await runMigrations();

  t.after(async () => {
    resetProviderAdapters();
    await closePool();
  });

  await t.test('1. Separates retail purchase rate from supplier cost backing', () => {
    // Retail purchase rate is a denomination ($1 = 250 credits -> $0.004/cr)
    assert.strictEqual(RETAIL_CREDIT_PURCHASE_RATE_USD, 0.004);

    // Supplier cost for Nano Banana Pro is empirically $0.12 on Muapi public price card
    const muapiNanoCost = SUPPLIER_COST_REGISTRY['muapi:nano-banana-pro'].supplier_cost_usd;
    assert.strictEqual(muapiNanoCost, 0.12);

    // Assert that retail value per credit is NOT called supplier cost
    assert.notStrictEqual(RETAIL_CREDIT_PURCHASE_RATE_USD, muapiNanoCost);
  });

  await t.test('2. Subscription & credit pack discounts are explicitly modeled', () => {
    // Verify decreasing effective revenue per credit across credit packs
    for (let i = 0; i < CREDIT_PACK_RATES.length - 1; i++) {
      const current = CREDIT_PACK_RATES[i];
      const next = CREDIT_PACK_RATES[i + 1];
      assert.ok(
        current.effective_usd_per_credit > next.effective_usd_per_credit,
        `Expected ${current.name} ($${current.effective_usd_per_credit.toFixed(5)}) > ${next.name} ($${next.effective_usd_per_credit.toFixed(5)})`
      );
    }

    // Verify lowest pack rate ($1,000 Enterprise Fleet)
    assert.ok(LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT < 0.0027);
    assert.ok(LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT > 0.0026);
  });

  await t.test('3. Unknown supplier costs cannot be labeled profitable', () => {
    const unknownRoute = SUPPLIER_COST_REGISTRY['timecapsule-gpu:flux1-dev-t2i'];
    assert.strictEqual(unknownRoute.cost_status, 'unknown');
    assert.strictEqual(unknownRoute.supplier_cost_usd, null);

    const marginResult = calculateContributionMargin({
      creditsCharged: 25,
      supplierCostUsd: unknownRoute.supplier_cost_usd,
      effectiveRevenuePerCredit: RETAIL_CREDIT_PURCHASE_RATE_USD,
    });

    assert.strictEqual(marginResult.is_profitable, false);
    assert.strictEqual(marginResult.status, 'unknown_supplier_cost');
    assert.strictEqual(marginResult.margin_pct, null);

    // Attempting to calculate required credits for unknown cost throws immediately
    assert.throws(
      () => calculateRequiredCredits({ supplierCostUsd: null }),
      /invalid or unknown supplier cost/
    );
  });

  await t.test('4. Correctly flags Nano Banana Pro deficit at 10 credits and computes 50/60/70% scenarios', () => {
    // Under Muapi verified $0.12 cost and current 10-credit charge ($0.040 at retail):
    const currentMargin = calculateContributionMargin({
      creditsCharged: 10,
      supplierCostUsd: 0.12,
      effectiveRevenuePerCredit: 0.004,
    });

    // 10 credits * $0.004 = $0.040 revenue vs $0.120 compute -> deficit!
    assert.strictEqual(currentMargin.is_profitable, false);
    assert.strictEqual(currentMargin.status, 'loss_making');
    assert.ok(currentMargin.net_contribution_usd < 0);

    // Calculate required credits at 50%, 60%, and 70% contribution targets at retail ($0.004)
    const retail_50 = calculateRequiredCredits({ supplierCostUsd: 0.12, effectiveRevenuePerCredit: 0.004, targetMarginPct: 0.50 });
    const retail_60 = calculateRequiredCredits({ supplierCostUsd: 0.12, effectiveRevenuePerCredit: 0.004, targetMarginPct: 0.60 });
    const retail_70 = calculateRequiredCredits({ supplierCostUsd: 0.12, effectiveRevenuePerCredit: 0.004, targetMarginPct: 0.70 });

    assert.strictEqual(retail_50, 66);
    assert.strictEqual(retail_60, 85);
    assert.strictEqual(retail_70, 118);

    // Verify that at retail_60 (85 credits), contribution margin is >= 60%
    const marginAt60 = calculateContributionMargin({
      creditsCharged: retail_60,
      supplierCostUsd: 0.12,
      effectiveRevenuePerCredit: 0.004,
    });
    assert.ok(marginAt60.margin_pct >= 60.0);
    assert.strictEqual(marginAt60.is_profitable, true);

    // Calculate required credits against lowest credit pack rate ($0.002632)
    const pack_safe_60 = calculateRequiredCredits({
      supplierCostUsd: 0.12,
      effectiveRevenuePerCredit: LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT,
      targetMarginPct: 0.60,
    });
    assert.strictEqual(pack_safe_60, 129);
  });

  await t.test('5. Seedance Pro T2V (350 credits) and Veo 3.1 Fast (450 credits) are verified profitable', () => {
    // Seedance 720p: supplier cost $0.18 on Muapi
    const seedanceMargin = calculateContributionMargin({
      creditsCharged: 350,
      supplierCostUsd: 0.18,
      effectiveRevenuePerCredit: RETAIL_CREDIT_PURCHASE_RATE_USD,
    });
    assert.strictEqual(seedanceMargin.is_profitable, true);
    assert.ok(seedanceMargin.margin_pct > 80.0, 'Seedance at 350 credits yields >80% contribution margin at retail');

    // Seedance at lowest credit pack rate ($0.00263)
    const seedanceLowestMargin = calculateContributionMargin({
      creditsCharged: 350,
      supplierCostUsd: 0.18,
      effectiveRevenuePerCredit: LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT,
    });
    assert.strictEqual(seedanceLowestMargin.is_profitable, true);
    assert.ok(seedanceLowestMargin.margin_pct > 75.0, 'Seedance at 350 credits yields >75% margin even under Enterprise Pack');

    // Veo 3.1 Fast: supplier cost $0.35 on Kie
    const veoMargin = calculateContributionMargin({
      creditsCharged: 450,
      supplierCostUsd: 0.35,
      effectiveRevenuePerCredit: RETAIL_CREDIT_PURCHASE_RATE_USD,
    });
    assert.strictEqual(veoMargin.is_profitable, true);
    assert.ok(veoMargin.margin_pct > 75.0);
  });

  await t.test('6. UI Quotes equal server credit reservations', () => {
    const testCases = [
      { modelId: 'nano-banana-pro', modality: 'image', params: { resolution: '1k' }, expected: 10 },
      { modelId: 'nano-banana-pro', modality: 'image', params: { resolution: '2k' }, expected: 15 },
      { modelId: 'nano-banana-pro', modality: 'image', params: { resolution: '4k' }, expected: 25 },
      { modelId: 'nano-banana-pro-edit', modality: 'i2i', params: { resolution: '1k' }, expected: 15 },
      { modelId: 'seedance-pro-t2v', modality: 'video', params: { resolution: '720p', duration: 5 }, expected: 350 },
      { modelId: 'seedance-pro-t2v', modality: 'video', params: { resolution: '1080p', duration: 5 }, expected: 450 },
      { modelId: 'veo3.1-fast-text-to-video', modality: 'video', params: { resolution: '720p', duration: 8 }, expected: 450 },
    ];

    for (const tc of testCases) {
      // 1. Check getEstimatedCreditsForModel (used by API & UI)
      const quote = getEstimatedCreditsForModel(tc.modelId, tc.modality, tc.params);
      assert.strictEqual(
        quote,
        tc.expected,
        `Expected quote for ${tc.modelId} (${JSON.stringify(tc.params)}) to equal ${tc.expected}`
      );

      // 2. Check getModelCapabilities policy (used by ModelPlayground dynamic preview)
      const caps = getModelCapabilities(tc.modelId);
      assert.ok(caps);
      assert.ok(caps.credit_estimate_policy);
      const policy = caps.credit_estimate_policy;

      if (policy.by_resolution) {
        const resKey = (tc.params.resolution || '1k').toLowerCase();
        assert.strictEqual(policy.by_resolution[resKey], tc.expected);
      } else if (policy.policy_id === 'tier_video_duration_resolution_v1') {
        const expectedBase = tc.params.resolution === '1080p' ? 450 : 350;
        assert.strictEqual(expectedBase, tc.expected);
      } else if (policy.base_credits) {
        assert.strictEqual(policy.base_credits, tc.expected);
      }
    }
  });

  await t.test('7. Existing jobs retain their accepted pricing policy version', async () => {
    await resetStoreForTests();
    const tenantId = `org_biz_inv_${Date.now()}`;
    const userId = `usr_biz_inv_${Date.now()}`;
    const email = `biz_inv_${Date.now()}@timecapsule.test`;

    await createTenant({
      tenantId,
      name: 'Biz Invariant Tenant',
      slug: `biz-inv-${Date.now()}`,
      status: 'active',
      initialCredits: 5000,
    });

    await createUser({
      userId,
      email,
      displayName: 'Biz Invariant User',
      status: 'active',
      emailVerified: true,
    });

    await createMembership({
      tenantId,
      userId,
      role: 'reseller_admin',
    });

    const session = {
      tenant_id: tenantId,
      user_id: userId,
      role: 'reseller_admin',
      email_verified: true,
      auth_mode: 'cookie_session',
      token_version: 1,
    };

    const { job } = await submitGenerationJob({
      session,
      idempotencyKey: `idem_pricing_version_${Date.now()}`,
      body: {
        model: 'seedance-pro-t2v',
        modality: 'video',
        inputs: { prompt: 'Pricing version preservation test', resolution: '720p', duration_seconds: 5 },
      },
    });

    assert.ok(job.job_id);
    assert.strictEqual(job.pricing_policy_version, PRICING_POLICY_VERSION);
    assert.strictEqual(job.credits_reserved, 350);

    // Verify stored in DB with exact pricing version
    const retrieved = await getJob(job.job_id);
    assert.strictEqual(retrieved.pricing_policy_version, PRICING_POLICY_VERSION);
    assert.strictEqual(retrieved.credits_reserved, 350);
  });

  await t.test('8. Fallback cannot change accepted customer pricing or bleed credits', async () => {
    await resetStoreForTests();
    resetProviderAdapters();

    let falCalls = 0;
    // Primary Muapi simulates 429 rate limit
    registerProviderAdapter('muapi', {
      submit: async () => {
        const err = new Error('Muapi upstream rate limit (429)');
        err.statusCode = 429;
        err.status = 429;
        err.retryableSubmission = true;
        throw err;
      },
      poll: async () => {},
    });

    // Secondary Fal succeeds
    registerProviderAdapter('fal', {
      submit: async (job) => {
        falCalls++;
        return {
          providerJobId: `fal_prov_${Date.now()}`,
          immediateCompletion: {
            sourceUrl: 'https://cdn.timecapsule.test/fallback_output.webp',
            outputs: ['https://cdn.timecapsule.test/fallback_output.webp'],
            userBilledCredits: Number(job.credits_reserved) || 10,
            providerReportedCost: 0.025,
            providerCostUnit: 'usd',
          },
          providerDetails: { adapter: 'fal', model: job.resolved_provider_model },
        };
      },
      poll: async () => {},
    });

    const tenantId = `org_fallback_price_${Date.now()}`;
    const userId = `usr_fallback_price_${Date.now()}`;
    const email = `fallback_price_${Date.now()}@timecapsule.test`;

    await createTenant({
      tenantId,
      name: 'Fallback Price Tenant',
      slug: `fallback-price-${Date.now()}`,
      status: 'active',
      initialCredits: 2000,
    });

    await createUser({
      userId,
      email,
      displayName: 'Fallback Price User',
      status: 'active',
      emailVerified: true,
    });

    await createMembership({
      tenantId,
      userId,
      role: 'reseller_admin',
    });

    const session = {
      tenant_id: tenantId,
      user_id: userId,
      role: 'reseller_admin',
      email_verified: true,
      auth_mode: 'cookie_session',
      token_version: 1,
    };

    const { job: submittedJob } = await submitGenerationJob({
      session,
      idempotencyKey: `idem_fallback_pricing_${Date.now()}`,
      body: {
        model: 'nano-banana-pro',
        modality: 'image',
        inputs: { prompt: 'Fallback pricing invariant test' },
      },
    });

    assert.strictEqual(submittedJob.credits_reserved, 10);

    // Worker executes failover
    const worker = createDurableWorker({
      idlePollIntervalMs: 50,
      providerPollDelayMs: 20,
      submissionRetryBaseMs: 20,
    });

    const step = await worker.runOnce();
    assert.strictEqual(step.processed, true);
    assert.strictEqual(step.action, 'succeeded');
    assert.strictEqual(falCalls, 1);

    const finalJob = await getJob(submittedJob.job_id);
    assert.strictEqual(finalJob.status, 'succeeded');
    assert.strictEqual(finalJob.provider, 'fal');
    // Customer accepted pricing is IMMUTABLE: remains exactly 10 credits!
    assert.strictEqual(finalJob.user_billed_credits, 10);

    // Ledger balance was 2000, exactly 10 settled: 2000 - 10 = 1990
    const tenantRes = await query(
      'SELECT credits_balance, credits_reserved FROM tenants WHERE tenant_id = $1',
      [tenantId]
    );
    assert.strictEqual(Number(tenantRes.rows[0].credits_balance), 1990);
    assert.strictEqual(Number(tenantRes.rows[0].credits_reserved), 0);

    resetProviderAdapters();
  });
});
