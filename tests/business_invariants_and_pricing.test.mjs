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
  STORAGE_EGRESS_ASSUMPTION_PCT,
  PAYMENT_FEE_PROFILES,
  DEFAULT_PAYMENT_FEE_PROFILE,
  APPROVED_NANO_BANANA_PRO_TEST_RATE_CREDITS,
  SUPPLIER_COST_REGISTRY,
  calculateNetServiceRevenue,
  calculateRouteMinimumCredits,
  calculateRequiredCredits,
  calculatePlanContribution,
  calculateContributionMargin,
  getRoutePricingBreakdown,
  calculateDeliveryCostPerCredit,
  findHighestDeliveryCostRoute,
  runPlanFullRedemptionAnalysis,
  PRICING_POLICY_VERSION,
} from '../packages/timecapsule/src/models/economics.js';
import {
  SUPPORTED_RELEASE_MODELS,
  getSupportedReleaseModel,
  resolveReleaseRoute,
  getCascadeRoutesForModel,
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

test('Business Invariants: Route Pricing & Economic Variable Separation', async (t) => {
  assertDisposableTestDatabase();
  await runMigrations();

  t.after(async () => {
    resetProviderAdapters();
    await closePool();
  });

  await t.test('1. Separates retail purchase rate from supplier cost backing', () => {
    // Retail purchase rate is a denomination baseline ($1 = 250 credits -> $0.004/cr)
    assert.strictEqual(RETAIL_CREDIT_PURCHASE_RATE_USD, 0.004);

    // Supplier cost for Nano Banana Pro is empirically $0.120 on Muapi public price card
    const muapiNanoCost = SUPPLIER_COST_REGISTRY['muapi:nano-banana-pro'].supplier_cost_usd;
    assert.strictEqual(muapiNanoCost, 0.120);

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

  await t.test('3. Fixed payment fees are allocated across purchase credits (F / K)', () => {
    // Pack: $10 for 2,500 credits. Fixed fee $0.30, 2.9% fee, 1.5% storage, 60% margin.
    // Minimum credits with fixed fee allocated across pack:
    const minWithFixedFee = calculateRouteMinimumCredits({
      supplierCostUsd: 0.120,
      packPriceUsd: 10.0,
      packCredits: 2500,
      targetMarginPct: 0.60,
      paymentFeeProfile: PAYMENT_FEE_PROFILES.stripe_us_standard,
      storageEgressAssumptionPct: 0.015,
    });

    // P * (1 - 0.60 - 0.044) - F = 10 * 0.356 - 0.30 = 3.26
    // Credits = ceil(0.120 * 2500 / 3.26) = ceil(92.02) = 93 credits
    assert.strictEqual(minWithFixedFee, 93);

    // On $1,000 Enterprise Fleet (380,000 credits), the $0.30 fixed fee is negligible ($0.30 / 380,000):
    const minEnterprise = calculateRouteMinimumCredits({
      supplierCostUsd: 0.120,
      packPriceUsd: 1000.0,
      packCredits: 380000,
      targetMarginPct: 0.60,
      paymentFeeProfile: PAYMENT_FEE_PROFILES.stripe_us_standard,
      storageEgressAssumptionPct: 0.015,
    });
    // 1000 * 0.356 - 0.30 = 355.70
    // Credits = ceil(0.120 * 380000 / 355.70) = ceil(128.20) = 129 credits!
    assert.strictEqual(minEnterprise, 129);
  });

  await t.test('4. Configurable payment fees and tax separation (Net Revenue P vs Tax)', () => {
    // 18% GST in India
    const taxInclusive = calculateNetServiceRevenue({
      grossCollectedUsd: 118.0,
      taxRatePct: 0.18,
      isTaxInclusive: true,
    });
    assert.strictEqual(Math.round(taxInclusive.net_service_revenue_usd), 100);
    assert.strictEqual(Math.round(taxInclusive.tax_collected_usd), 18);

    // Configurable payment fee profiles
    assert.ok(PAYMENT_FEE_PROFILES.stripe_us_standard);
    assert.ok(PAYMENT_FEE_PROFILES.stripe_in_domestic);
    assert.ok(PAYMENT_FEE_PROFILES.stripe_in_international);
    assert.strictEqual(PAYMENT_FEE_PROFILES.stripe_in_domestic.percentage_fee, 0.020);
    assert.strictEqual(PAYMENT_FEE_PROFILES.stripe_in_international.percentage_fee + PAYMENT_FEE_PROFILES.stripe_in_international.fx_conversion_pct, 0.050);

    // Storage/egress assumption is explicitly labeled as unmeasured
    assert.strictEqual(STORAGE_EGRESS_ASSUMPTION_PCT, 0.015);
  });

  await t.test('5. Separates calculated minimum from discretionary commercial premiums', () => {
    // Flat $0.120 supplier cost across 1K/2K/4K:
    const breakdown1k = getRoutePricingBreakdown('nano-banana-pro', '1k');
    const breakdown2k = getRoutePricingBreakdown('nano-banana-pro', '2k');
    const breakdown4k = getRoutePricingBreakdown('nano-banana-pro', '4k');

    // Formula calculated minimum is identical for all three (129 credits)
    assert.strictEqual(breakdown1k.calculated_minimum_credits, 129);
    assert.strictEqual(breakdown2k.calculated_minimum_credits, 129);
    assert.strictEqual(breakdown4k.calculated_minimum_credits, 129);

    // Discretionary commercial premiums are labeled separately
    assert.strictEqual(breakdown1k.discretionary_commercial_premium_credits, 0);
    assert.strictEqual(breakdown2k.discretionary_commercial_premium_credits, 11);
    assert.strictEqual(breakdown4k.discretionary_commercial_premium_credits, 31);

    // Total test rates
    assert.strictEqual(breakdown1k.commercial_test_rate_credits, 129);
    assert.strictEqual(breakdown2k.commercial_test_rate_credits, 140);
    assert.strictEqual(breakdown4k.commercial_test_rate_credits, 160);
    assert.strictEqual(APPROVED_NANO_BANANA_PRO_TEST_RATE_CREDITS, 129);
  });

  await t.test('6. Cost evidence categorization: Conservative upper bounds used instead of midpoints', () => {
    // Veo 3 Fast: range $0.30 - $0.40. Conservative bound $0.400 is recorded, NOT midpoint $0.350!
    const veoRoute = SUPPLIER_COST_REGISTRY['kie:veo3_fast'];
    assert.strictEqual(veoRoute.evidence_type, 'range_bound');
    assert.strictEqual(veoRoute.range_min_usd, 0.300);
    assert.strictEqual(veoRoute.range_max_usd, 0.400);
    assert.strictEqual(veoRoute.supplier_cost_usd, 0.400);

    // Unknown costs cannot be labeled profitable
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
  });

  await t.test('7. Delivery cost per credit ranking & full-redemption stress testing', () => {
    const analysis = findHighestDeliveryCostRoute();
    assert.ok(analysis.highest_delivery_cost_route);

    // Nano Banana Pro at 129 credits: $0.120 / 129 = $0.0009302/cr
    const nanoDeliveryCost = calculateDeliveryCostPerCredit({
      supplierCostUsd: 0.120,
      creditsCharged: 129,
    });
    assert.ok(nanoDeliveryCost > 0.00093 && nanoDeliveryCost < 0.000931);

    // Seedance 720p at 350 credits: $0.180 / 350 = $0.000514/cr
    const seedanceDeliveryCost = calculateDeliveryCostPerCredit({
      supplierCostUsd: 0.180,
      creditsCharged: 350,
    });
    assert.ok(seedanceDeliveryCost < nanoDeliveryCost);

    // Veo 3 Fast at 450 credits: $0.400 / 450 = $0.000889/cr
    const veoDeliveryCost = calculateDeliveryCostPerCredit({
      supplierCostUsd: 0.400,
      creditsCharged: 450,
    });
    assert.ok(veoDeliveryCost < nanoDeliveryCost);

    // Stress test: +20% supplier price increase and 5% billable failure rate on Starter Pack
    const stressResults = runPlanFullRedemptionAnalysis({
      routeKey: 'muapi:nano-banana-pro-1k',
      supplierCostUsd: 0.120,
      creditsCharged: 129,
      stressSupplierHikePct: 0.20,
      stressBillableFailurePct: 0.05,
    });

    for (const res of stressResults) {
      assert.ok(res.completed_generations > 0);
      assert.strictEqual(res.is_profitable, true);
      assert.ok(res.contribution_margin_pct > 35.0, `Expected >35% margin under stress, got ${res.contribution_margin_pct.toFixed(1)}%`);
    }
  });

  await t.test('8. Execution Policy Invariant: FLUX Dev/Schnell must NOT silently replace Nano Banana Pro', () => {
    // Case A: Default request (allowAlternativeModels: false)
    const strictRoutes = getCascadeRoutesForModel('nano-banana-pro', 'image', {
      allowAlternativeModels: false,
    });
    // Must NOT contain Fal or Replicate
    assert.strictEqual(strictRoutes.some((r) => r.provider === 'fal'), false, 'Fal FLUX Dev must not be in default cascade');
    assert.strictEqual(strictRoutes.some((r) => r.provider === 'replicate'), false, 'Replicate FLUX Schnell must not be in default cascade');
    // Must contain same-model providers (Muapi, Kie)
    assert.strictEqual(strictRoutes.some((r) => r.provider === 'muapi'), true);
    assert.strictEqual(strictRoutes.some((r) => r.provider === 'kie'), true);

    // Case B: Explicit user opt-in (allowAlternativeModels: true)
    const optInRoutes = getCascadeRoutesForModel('nano-banana-pro', 'image', {
      allowAlternativeModels: true,
    });
    assert.strictEqual(optInRoutes.some((r) => r.provider === 'fal'), true);
    assert.strictEqual(optInRoutes.some((r) => r.provider === 'replicate'), true);
  });

  await t.test('9. Existing jobs retain accepted pricing policy version', async () => {
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

  await t.test('10. Fallback cannot change accepted customer pricing or bleed credits', async () => {
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

    // Explicitly allow alternative model for this test
    const { job: submittedJob } = await submitGenerationJob({
      session,
      idempotencyKey: `idem_fallback_pricing_${Date.now()}`,
      body: {
        model: 'nano-banana-pro',
        modality: 'image',
        inputs: {
          prompt: 'Fallback pricing invariant test',
          allow_alternative_models: true,
        },
        execution_policy: { allow_alternative_models: true },
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
