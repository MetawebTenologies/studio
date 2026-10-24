/**
 * Timecapsule Studio — Pricing Economics & Supplier Cost Registry
 *
 * Strict Economic Principles:
 *   1. Retail credit purchase rate != Supplier cost backing.
 *   2. Fixed payment fees (F) are charged ONCE per purchase and allocated across credits (F/K).
 *   3. Payment fee profiles are configurable by account, method, currency, and card origin.
 *   4. Taxes collected (e.g. GST/VAT) are strictly separated from net service revenue (P).
 *   5. Storage and egress allowances (1.5%) are explicitly labeled as unmeasured assumptions.
 *   6. Contribution margin uses one consistent formula for packs and subscriptions:
 *        Margin = 1 - p - s - (N*C + F + V) / P
 *   7. Calculated minimum sustainable charges are strictly separated from discretionary commercial premiums:
 *        Commercial Quote = Calculated Minimum + Optional Discretionary Premium.
 *   8. Cost evidence types are explicitly tagged:
 *        'published_list_price' | 'range_bound' | 'account_quotation' | 'observed_charge' | 'unverified'
 *      Midpoints are NEVER labeled exact verified costs; conservative upper bounds are applied.
 *   9. Full-redemption stress-testing evaluates max(delivery_cost / credits_charged) across all enabled routes.
 *  10. "Guaranteed profitability" claims are prohibited; reported as "scenario results under stated assumptions."
 */

export const PRICING_POLICY_VERSION = 'tc-pricing-v1';
export const PROPOSED_PRICING_POLICY_VERSION = 'tc-pricing-v2-draft';

/**
 * Approved internal test scenario for Nano Banana Pro.
 * Approved ONLY as an internal provisional test scenario — not enabled for live commercial billing.
 */
export const APPROVED_NANO_BANANA_PRO_TEST_RATE_CREDITS = 129;

/**
 * Proposed base retail denomination: $1.00 USD = 250 credits.
 * This represents the face-value purchasing rate ($0.004000/cr) before volume discounts.
 */
export const RETAIL_CREDIT_PURCHASE_RATE_USD = 0.004000;

/**
 * Storage, egress, and telemetry assumption.
 * Explicitly labeled as an unmeasured model allowance — NOT measured invoice COGS.
 */
export const STORAGE_EGRESS_ASSUMPTION_PCT = 0.015; // 1.5% unmeasured allowance

/**
 * Configurable Payment Gateway Fee Profiles
 * Accounts for domestic vs international card origins, presentment currencies, and FX markups.
 */
export const PAYMENT_FEE_PROFILES = Object.freeze({
  stripe_us_standard: {
    id: 'stripe_us_standard',
    name: 'Stripe US Standard (Domestic Cards)',
    currency: 'USD',
    percentage_fee: 0.029, // 2.9%
    fixed_fee_usd: 0.30,   // $0.30
    fx_conversion_pct: 0.0,
    notes: 'Standard US merchant domestic card pricing',
  },
  stripe_in_domestic: {
    id: 'stripe_in_domestic',
    name: 'Stripe India Domestic (INR Cards, RBI compliant)',
    currency: 'INR',
    percentage_fee: 0.020, // 2.0%
    fixed_fee_usd: 0.00,   // ₹0 / negligible
    fx_conversion_pct: 0.0,
    notes: 'Stripe India domestic card rate',
  },
  stripe_in_international: {
    id: 'stripe_in_international',
    name: 'Stripe India International (USD Presentment + Export FX)',
    currency: 'USD',
    percentage_fee: 0.030, // 3.0% international card fee
    fixed_fee_usd: 0.00,
    fx_conversion_pct: 0.020, // 2.0% currency conversion markup
    notes: 'Stripe India export transaction with cross-border currency conversion (effective 5.0%)',
  },
  zero_fee_test: {
    id: 'zero_fee_test',
    name: 'Zero Fee Simulation (Test Baseline)',
    currency: 'USD',
    percentage_fee: 0.0,
    fixed_fee_usd: 0.0,
    fx_conversion_pct: 0.0,
    notes: 'Pure compute baseline without payment friction',
  },
});

export const DEFAULT_PAYMENT_FEE_PROFILE = PAYMENT_FEE_PROFILES.stripe_us_standard;

/**
 * Legacy variable cost assumption compatibility helper.
 */
export const VARIABLE_COST_ASSUMPTIONS = Object.freeze({
  payment_gateway_fee_pct: DEFAULT_PAYMENT_FEE_PROFILE.percentage_fee,
  payment_gateway_fixed_usd: DEFAULT_PAYMENT_FEE_PROFILE.fixed_fee_usd,
  infra_egress_storage_pct: STORAGE_EGRESS_ASSUMPTION_PCT,
  get total_variable_cost_pct() {
    return this.payment_gateway_fee_pct + this.infra_egress_storage_pct; // 0.044 (4.4%)
  },
});

/**
 * Separates taxes collected (e.g. 18% GST or local VAT) from net service revenue.
 * Taxes are pass-through liabilities and never constitute operating revenue.
 */
export function calculateNetServiceRevenue({
  grossCollectedUsd,
  taxRatePct = 0.0, // e.g. 0.18 for 18% GST
  isTaxInclusive = false,
}) {
  if (typeof grossCollectedUsd !== 'number' || grossCollectedUsd <= 0) {
    throw new Error(`Invalid gross collected amount: ${grossCollectedUsd}`);
  }
  if (taxRatePct < 0 || taxRatePct > 1.0) {
    throw new Error(`Invalid tax rate percentage: ${taxRatePct}`);
  }

  if (isTaxInclusive) {
    const netServiceRevenue = grossCollectedUsd / (1.0 + taxRatePct);
    const taxCollected = grossCollectedUsd - netServiceRevenue;
    return {
      gross_collected_usd: grossCollectedUsd,
      net_service_revenue_usd: netServiceRevenue,
      tax_collected_usd: taxCollected,
      tax_rate_pct: taxRatePct,
    };
  }

  const netServiceRevenue = grossCollectedUsd;
  const taxCollected = grossCollectedUsd * taxRatePct;
  return {
    gross_collected_usd: netServiceRevenue + taxCollected,
    net_service_revenue_usd: netServiceRevenue,
    tax_collected_usd: taxCollected,
    tax_rate_pct: taxRatePct,
  };
}

/**
 * Credit Top-Up Packs & Effective Revenue per Credit
 * Categorized into Small Initial Offering (self-serve) and Enterprise Packs (quotation-only).
 */
export const CREDIT_PACK_RATES = Object.freeze([
  // Proposed Small Initial Offering (Self-Serve)
  {
    id: 'starter',
    name: 'Starter Pack',
    price_usd: 10.0,
    credits: 2500,
    effective_usd_per_credit: 10.0 / 2500, // $0.004000
    discount_pct: 0.0,
    is_public_offering: true,
    status: 'proposed_initial_offering',
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    price_usd: 25.0,
    credits: 6800,
    effective_usd_per_credit: 25.0 / 6800, // ~$0.003676
    discount_pct: 8.1,
    is_public_offering: true,
    status: 'proposed_initial_offering',
  },
  {
    id: 'studio_pro',
    name: 'Studio Pro',
    price_usd: 75.0,
    credits: 22500,
    effective_usd_per_credit: 75.0 / 22500, // ~$0.003333
    discount_pct: 16.7,
    is_public_offering: true,
    status: 'proposed_initial_offering',
  },
  // Enterprise Fleet Packs (Quotation-Only / Internal Planning Scenario)
  {
    id: 'production_house',
    name: 'Production House',
    price_usd: 250.0,
    credits: 85000,
    effective_usd_per_credit: 250.0 / 85000, // ~$0.002941
    discount_pct: 26.5,
    is_public_offering: false,
    status: 'quotation_only',
  },
  {
    id: 'enterprise_fleet',
    name: 'Enterprise Fleet',
    price_usd: 1000.0,
    credits: 380000,
    effective_usd_per_credit: 1000.0 / 380000, // ~$0.002632
    discount_pct: 34.2,
    is_public_offering: false,
    status: 'quotation_only',
  },
]);

/**
 * Monthly Studio Plans — KEPT UNPUBLISHED / QUOTATION-ONLY
 * Allowances are NOT approved for public release pending custom client scoping.
 */
export const MONTHLY_STUDIO_PLANS = Object.freeze([
  {
    id: 'studio_scale',
    name: 'Studio Scale',
    price_usd: 3000.0,
    is_published: false,
    status: 'quotation_only_unapproved_allowance',
    unapproved_prior_fast_credits: 4000000,
    notes: 'Unpublished. Large subscription allowances not approved for self-serve.',
  },
  {
    id: 'agency_master',
    name: 'Agency Master',
    price_usd: 5000.0,
    is_published: false,
    status: 'quotation_only_unapproved_allowance',
    unapproved_prior_fast_credits: 7500000,
    notes: 'Unpublished. Large subscription allowances not approved for self-serve.',
  },
  {
    id: 'sovereign_vip',
    name: 'Sovereign VIP',
    price_usd: 10000.0,
    is_published: false,
    status: 'quotation_only_unapproved_allowance',
    unapproved_prior_fast_credits: 16000000,
    notes: 'Unpublished. Large subscription allowances not approved for self-serve.',
  },
]);

/**
 * Lowest effective revenue per credit among standard credit packs ($1,000 Enterprise Fleet)
 */
export const LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT =
  CREDIT_PACK_RATES[CREDIT_PACK_RATES.length - 1].effective_usd_per_credit; // ~$0.002632

/**
 * Empirical Supplier Cost Registry
 * Categorizes evidence: 'published_list_price' | 'range_bound' | 'account_quotation' | 'observed_charge' | 'unverified'
 * Midpoints are NEVER certified as exact verified costs; conservative upper bounds are applied.
 */
export const SUPPLIER_COST_REGISTRY = Object.freeze({
  // 1. Muapi: Nano Banana Pro (T2I)
  'muapi:nano-banana-pro': {
    provider: 'muapi',
    endpoint: 'nano-banana-pro',
    model_id: 'nano-banana-pro',
    configuration: { resolution: '1k/standard', aspect_ratio: 'any' },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.120,
    cost_status: 'verified',
    evidence_type: 'published_list_price',
    source_url: 'https://muapi.ai/pricing and https://muapi.ai/playground/nano-banana-pro',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none (standard public list price)',
    resolution_tiered: false,
    notes: 'Muapi lists nano-banana-pro at $0.120 per generation. Public price card does not document resolution tiering.',
  },

  // 2. Muapi: Nano Banana Pro Edit (I2I)
  'muapi:nano-banana-pro-edit': {
    provider: 'muapi',
    endpoint: 'nano-banana-pro-edit',
    model_id: 'nano-banana-pro-edit',
    configuration: { resolution: '1k/standard', reference_images: 1 },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.120,
    cost_status: 'verified',
    evidence_type: 'published_list_price',
    source_url: 'https://muapi.ai/pricing',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none',
    resolution_tiered: false,
    notes: 'Muapi lists nano-banana-pro-edit at $0.120 per generation.',
  },

  // 3. Muapi: Seedance Pro T2V
  'muapi:seedance-pro-t2v': {
    provider: 'muapi',
    endpoint: 'seedance-pro-t2v',
    model_id: 'seedance-pro-t2v',
    configuration: { duration_seconds: 5, resolution: '720p' },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.180,
    cost_status: 'verified',
    evidence_type: 'published_list_price',
    source_url: 'https://muapi.ai/pricing',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none',
    resolution_tiered: false,
    resolution_1080p_cost_status: 'unverified',
    notes: 'Base 5s 720p generation is listed at $0.180. 1080p surcharge is unverified on public card and remains provisional.',
  },

  // 4. Muapi: Seedance Pro I2V
  'muapi:seedance-pro-i2v': {
    provider: 'muapi',
    endpoint: 'seedance-pro-i2v',
    model_id: 'seedance-pro-i2v',
    configuration: { duration_seconds: 5, resolution: '720p' },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.180,
    cost_status: 'verified',
    evidence_type: 'published_list_price',
    source_url: 'https://muapi.ai/pricing',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none',
    resolution_tiered: false,
    notes: 'Base 5s 720p generation is listed at $0.180.',
  },

  // 5. Kie: Veo 3 Fast (T2V & I2V)
  'kie:veo3_fast': {
    provider: 'kie',
    endpoint: '/api/v1/veo/generate',
    model_id: 'veo3_fast',
    configuration: { duration_seconds: 8, resolution: '720p' },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.400, // Conservative upper bound (not midpoint)
    range_min_usd: 0.300,
    range_max_usd: 0.400,
    cost_status: 'verified_range',
    evidence_type: 'range_bound',
    source_url: 'https://docs.kie.ai/veo3-api/generate-veo-3-video',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none (60-80 Kie points per generation @ $0.005/pt)',
    resolution_tiered: true,
    notes: 'Kie documents 60-80 points ($0.300-$0.400). Conservative planning upper bound of $0.400 is used instead of range midpoint ($0.350).',
  },

  // 6. Kie: ByteDance Seedance 1.5 Pro
  'kie:bytedance/seedance-1.5-pro': {
    provider: 'kie',
    endpoint: '/api/v1/jobs/createTask',
    model_id: 'bytedance/seedance-1.5-pro',
    configuration: { duration_seconds: 5, resolution: '720p' },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.250, // 50 Kie points @ $0.005
    cost_status: 'verified',
    evidence_type: 'published_list_price',
    source_url: 'https://docs.kie.ai/market/common/create-task',
    checked_date: '2026-10-24',
    confidence: 'medium',
    account_discount: 'none',
    notes: 'Standard 50-point task quote on Kie API documentation.',
  },

  // 7. Fal: Flux Dev (Cross-model alternative; requires explicit opt-in)
  'fal:fal-ai/flux/dev': {
    provider: 'fal',
    endpoint: 'fal-ai/flux/dev',
    model_id: 'fal-ai/flux/dev',
    configuration: { resolution: '1024x1024', steps: 28 },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.025,
    cost_status: 'verified',
    evidence_type: 'published_list_price',
    source_url: 'https://fal.ai/models/fal-ai/flux/dev',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none',
    notes: '$0.025 per megapixel image on Fal Queue.',
  },

  // 8. Replicate: Flux Schnell (Cross-model alternative; requires explicit opt-in)
  'replicate:black-forest-labs/flux-schnell': {
    provider: 'replicate',
    endpoint: 'black-forest-labs/flux-schnell',
    model_id: 'black-forest-labs/flux-schnell',
    configuration: { steps: 4 },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.003,
    cost_status: 'verified',
    evidence_type: 'published_list_price',
    source_url: 'https://replicate.com/black-forest-labs/flux-schnell',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none',
    notes: 'Replicate per-run charge ~$0.003.',
  },

  // 9. Unknown / Unverified Routes
  'muapi:veo3.1-fast-text-to-video': {
    provider: 'muapi',
    endpoint: 'veo3.1-fast-text-to-video',
    model_id: 'veo3.1-fast-text-to-video',
    supplier_cost_usd: null,
    cost_status: 'unknown',
    evidence_type: 'unverified',
    confidence: 'unknown',
    notes: 'Contract unverified on Muapi; disabled in catalog.',
  },
  'timecapsule-gpu:flux1-dev-t2i': {
    provider: 'timecapsule-gpu',
    endpoint: 'timecapsule.flux1-dev-t2i',
    model_id: 'timecapsule.flux1-dev-t2i',
    supplier_cost_usd: null,
    cost_status: 'unknown',
    evidence_type: 'unverified',
    confidence: 'unknown',
    notes: 'Self-hosted GPU infrastructure cost unverified.',
  },
  'timecapsule-gpu:wan2.1-t2v': {
    provider: 'timecapsule-gpu',
    endpoint: 'timecapsule.wan2.1-t2v',
    model_id: 'timecapsule.wan2.1-t2v',
    supplier_cost_usd: null,
    cost_status: 'unknown',
    evidence_type: 'unverified',
    confidence: 'unknown',
    notes: 'Self-hosted GPU infrastructure cost unverified.',
  },
});

/**
 * Calculates the exact minimum required credits to achieve target contribution margin,
 * properly allocating the one-time fixed payment fee (F) across the purchase credits (K).
 *
 * Formula derivation:
 *   Let P = Net Service Revenue, K = Total Pack Credits, F = Fixed Fee, p = % payment fee,
 *       s = % storage/egress assumption, C = Supplier Cost per generation, m = Target Margin.
 *   Effective Revenue per Credit R_eff = P / K.
 *   Allocated fixed fee per credit = F / K.
 *   Net Contribution per credit = R_eff * (1 - p - s) - (C / Credits) - (F / K).
 *   Setting Net Contribution / (Credits * R_eff) >= m yields:
 *     Credits >= (C * K) / (P * (1 - m - p - s) - F)
 */
export function calculateRouteMinimumCredits({
  supplierCostUsd,
  packPriceUsd = 1000.0,
  packCredits = 380000,
  targetMarginPct = 0.60,
  paymentFeeProfile = DEFAULT_PAYMENT_FEE_PROFILE,
  storageEgressAssumptionPct = STORAGE_EGRESS_ASSUMPTION_PCT,
}) {
  if (typeof supplierCostUsd !== 'number' || !Number.isFinite(supplierCostUsd) || supplierCostUsd <= 0) {
    throw new Error(`Cannot calculate credit charge for invalid or unknown supplier cost: ${supplierCostUsd}`);
  }
  if (packPriceUsd <= 0 || packCredits <= 0) {
    throw new Error(`Invalid pack pricing: Price=$${packPriceUsd}, Credits=${packCredits}`);
  }

  const p = paymentFeeProfile.percentage_fee + (paymentFeeProfile.fx_conversion_pct || 0.0);
  const s = storageEgressAssumptionPct;
  const F = paymentFeeProfile.fixed_fee_usd || 0.0;
  const P = packPriceUsd;
  const K = packCredits;

  const netRetainedRevenue = P * (1.0 - targetMarginPct - p - s) - F;
  if (netRetainedRevenue <= 0) {
    throw new Error(
      `Target margin (${(targetMarginPct * 100).toFixed(1)}%) + payment fees (${(p * 100).toFixed(1)}%) + storage (${(s * 100).toFixed(1)}%) + fixed fee ($${F}) exceeds pack revenue ($${P}).`
    );
  }

  return Math.ceil((supplierCostUsd * K) / netRetainedRevenue);
}

/**
 * Backward compatibility alias for calculateRouteMinimumCredits.
 */
export function calculateRequiredCredits({
  supplierCostUsd,
  effectiveRevenuePerCredit = RETAIL_CREDIT_PURCHASE_RATE_USD,
  targetMarginPct = 0.60,
  otherVariableCostPct = VARIABLE_COST_ASSUMPTIONS.total_variable_cost_pct,
}) {
  if (typeof supplierCostUsd !== 'number' || !Number.isFinite(supplierCostUsd) || supplierCostUsd <= 0) {
    throw new Error(`Cannot calculate credit charge for invalid or unknown supplier cost: ${supplierCostUsd}`);
  }
  const netDenominator = effectiveRevenuePerCredit * (1.0 - targetMarginPct - otherVariableCostPct);
  if (netDenominator <= 0) {
    throw new Error(`Target margin + variable costs exceed 100% of revenue.`);
  }
  return Math.ceil(supplierCostUsd / netDenominator);
}

/**
 * Unified plan and route contribution calculation.
 *
 * Formula:
 *   Contribution Margin = 1 - p - s - (N*C + F + V) / P
 *
 * Where:
 *   P = Net Service Revenue
 *   p = Actual percentage payment fee (including FX)
 *   s = Explicitly assumed revenue-proportional costs (1.5% storage/egress)
 *   N = Completed generations under scenario (N = K / credits_per_gen)
 *   C = Budgeted supplier cost per completed generation
 *   F = Fixed payment fee per purchase
 *   V = Other modeled variable costs (e.g. unbillable failures)
 */
export function calculatePlanContribution({
  planPriceUsd,
  creditsGranted,
  creditsPerGeneration,
  supplierCostUsd,
  paymentFeeProfile = DEFAULT_PAYMENT_FEE_PROFILE,
  taxRatePct = 0.0,
  isTaxInclusive = false,
  storageEgressAssumptionPct = STORAGE_EGRESS_ASSUMPTION_PCT,
  billableFailureRatePct = 0.0, // e.g. 0.05 for 5% upstream failure buffer
  otherVariableCostUsd = 0.0,
}) {
  if (!Number.isFinite(supplierCostUsd) || supplierCostUsd === null) {
    return {
      margin_pct: null,
      is_profitable: false,
      status: 'unknown_supplier_cost',
    };
  }

  const { net_service_revenue_usd: P, tax_collected_usd } = calculateNetServiceRevenue({
    grossCollectedUsd: planPriceUsd,
    taxRatePct,
    isTaxInclusive,
  });

  const p = paymentFeeProfile.percentage_fee + (paymentFeeProfile.fx_conversion_pct || 0.0);
  const s = storageEgressAssumptionPct;
  const F = paymentFeeProfile.fixed_fee_usd || 0.0;

  // Completed generations under full-redemption scenario
  const N = Math.floor(creditsGranted / creditsPerGeneration);
  const unredeemedCredits = creditsGranted - (N * creditsPerGeneration);

  // Compute cost including any modeled upstream failure overhead
  const computeCostSupplierUsd = N * supplierCostUsd * (1.0 + billableFailureRatePct);
  const paymentFeeTotalUsd = (planPriceUsd * p) + F;
  const storageEgressTotalUsd = P * s;
  const totalVariableCostsUsd = computeCostSupplierUsd + paymentFeeTotalUsd + storageEgressTotalUsd + otherVariableCostUsd;

  const netContributionUsd = P - totalVariableCostsUsd;
  const marginPct = (netContributionUsd / P) * 100;

  return {
    gross_collected_usd: planPriceUsd,
    net_service_revenue_usd: P,
    tax_collected_usd,
    credits_granted: creditsGranted,
    credits_per_generation: creditsPerGeneration,
    completed_generations_n: N,
    unredeemed_credits: unredeemedCredits,
    supplier_cost_per_gen_c: supplierCostUsd,
    total_compute_cost_usd: computeCostSupplierUsd,
    payment_fee_total_usd: paymentFeeTotalUsd,
    storage_egress_total_usd: storageEgressTotalUsd,
    total_variable_costs_usd: totalVariableCostsUsd,
    net_contribution_usd: netContributionUsd,
    margin_pct: marginPct,
    is_profitable: netContributionUsd > 0,
    status: netContributionUsd > 0 ? 'scenario_profitable' : 'scenario_loss_making',
    scenario_disclaimer: 'Scenario result under stated assumptions; not a guaranteed commercial return.',
  };
}

/**
 * Backward-compatible single-generation contribution calculation.
 */
export function calculateContributionMargin({
  creditsCharged,
  supplierCostUsd,
  effectiveRevenuePerCredit = RETAIL_CREDIT_PURCHASE_RATE_USD,
  otherVariableCostPct = VARIABLE_COST_ASSUMPTIONS.total_variable_cost_pct,
}) {
  if (!Number.isFinite(supplierCostUsd) || supplierCostUsd === null) {
    return {
      margin_pct: null,
      is_profitable: false,
      status: 'unknown_supplier_cost',
    };
  }

  const grossRevenue = creditsCharged * effectiveRevenuePerCredit;
  const variableExpenses = supplierCostUsd + grossRevenue * otherVariableCostPct;
  const netContribution = grossRevenue - variableExpenses;
  const marginPct = (netContribution / grossRevenue) * 100;

  return {
    gross_revenue_usd: grossRevenue,
    supplier_cost_usd: supplierCostUsd,
    variable_expenses_usd: variableExpenses,
    net_contribution_usd: netContribution,
    margin_pct: marginPct,
    is_profitable: netContribution > 0,
    status: netContribution > 0 ? 'profitable' : 'loss_making',
  };
}

/**
 * Separates Calculated Minimum Sustainable Price from Discretionary Commercial Premiums.
 *
 * For Nano Banana Pro ($0.120 flat supplier cost across 1K/2K/4K):
 *   - Calculated Minimum (60% target, Enterprise Fleet floor rate): 129 credits ($0.340 @ lowest pack)
 *   - 1K: 129 min + 0 premium = 129 credits (Approved Test Scenario)
 *   - 2K: 129 min + 11 premium = 140 credits (Commercial value markup)
 *   - 4K: 129 min + 31 premium = 160 credits (Commercial value markup)
 */
export const NANO_BANANA_PRO_COMMERCIAL_PREMIUMS = Object.freeze({
  '1k': 0,
  '2k': 11,
  '4k': 31,
});

export function getRoutePricingBreakdown(modelId, resolution = '1k') {
  if (modelId === 'nano-banana-pro' || modelId === 'nano-banana-pro-edit') {
    const resKey = String(resolution).toLowerCase();
    const premium = NANO_BANANA_PRO_COMMERCIAL_PREMIUMS[resKey] || 0;
    const minCredits = APPROVED_NANO_BANANA_PRO_TEST_RATE_CREDITS; // 129 credits
    return {
      model_id: modelId,
      resolution: resKey,
      supplier_cost_usd: 0.120,
      evidence_type: 'published_list_price',
      calculated_minimum_credits: minCredits,
      discretionary_commercial_premium_credits: premium,
      commercial_test_rate_credits: minCredits + premium,
      is_approved_internal_test_scenario: true,
      pricing_notes:
        resKey === '1k'
          ? 'Approved 129 credits ONLY as an internal provisional test scenario. Discretionary premium: 0.'
          : `Calculated minimum is 129 credits; additional ${premium} credits represents optional commercial value premium, not a formula output.`,
    };
  }

  if (modelId === 'seedance-pro-t2v' || modelId === 'seedance-pro-i2v') {
    const is1080p = String(resolution).toLowerCase() === '1080p';
    return {
      model_id: modelId,
      resolution: is1080p ? '1080p' : '720p',
      supplier_cost_usd: 0.180,
      evidence_type: is1080p ? 'unverified' : 'published_list_price',
      calculated_minimum_credits: is1080p ? 450 : 350,
      discretionary_commercial_premium_credits: 0,
      commercial_test_rate_credits: is1080p ? 450 : 350,
      is_approved_internal_test_scenario: true,
      pricing_notes: is1080p
        ? '1080p duration/resolution surcharge unverified on public card; kept provisional at 450 credits.'
        : '720p verified at $0.180 list price; 350 credits produces >75% contribution across all packs.',
    };
  }

  if (modelId === 'veo3.1-fast-text-to-video') {
    return {
      model_id: modelId,
      resolution: '720p',
      supplier_cost_usd: 0.400, // Conservative upper bound
      evidence_type: 'range_bound',
      calculated_minimum_credits: 450,
      discretionary_commercial_premium_credits: 0,
      commercial_test_rate_credits: 450,
      is_approved_internal_test_scenario: true,
      pricing_notes: 'Kie documents 60-80 Kie credits ($0.300-$0.400). Evaluated against conservative $0.400 upper bound.',
    };
  }

  return null;
}

/**
 * Calculates delivery cost per credit for any enabled route.
 *   Delivery Cost / Credit = Supplier Cost / Credits Charged
 */
export function calculateDeliveryCostPerCredit({ supplierCostUsd, creditsCharged }) {
  if (!supplierCostUsd || !creditsCharged || creditsCharged <= 0) {
    return null;
  }
  return supplierCostUsd / creditsCharged;
}

/**
 * Evaluates max(delivery_cost / credits_charged) across all enabled primary and alternative routes.
 */
export function findHighestDeliveryCostRoute() {
  const routes = [
    {
      route_key: 'muapi:nano-banana-pro-1k',
      name: 'Nano Banana Pro (1K)',
      supplier_cost_usd: 0.120,
      credits_charged: APPROVED_NANO_BANANA_PRO_TEST_RATE_CREDITS, // 129
      evidence_type: 'published_list_price',
    },
    {
      route_key: 'muapi:nano-banana-pro-edit',
      name: 'Nano Banana Pro Edit',
      supplier_cost_usd: 0.120,
      credits_charged: APPROVED_NANO_BANANA_PRO_TEST_RATE_CREDITS, // 129
      evidence_type: 'published_list_price',
    },
    {
      route_key: 'muapi:seedance-pro-t2v-720p',
      name: 'Seedance Pro T2V (720p 5s)',
      supplier_cost_usd: 0.180,
      credits_charged: 350,
      evidence_type: 'published_list_price',
    },
    {
      route_key: 'kie:veo3_fast',
      name: 'Veo 3.1 Fast (720p 8s)',
      supplier_cost_usd: 0.400, // Upper bound
      credits_charged: 450,
      evidence_type: 'range_bound',
    },
    {
      route_key: 'fal:fal-ai/flux/dev',
      name: 'Flux Dev (Opt-in alternative)',
      supplier_cost_usd: 0.025,
      credits_charged: 15,
      evidence_type: 'published_list_price',
    },
    {
      route_key: 'replicate:black-forest-labs/flux-schnell',
      name: 'Flux Schnell (Opt-in alternative)',
      supplier_cost_usd: 0.003,
      credits_charged: 10,
      evidence_type: 'published_list_price',
    },
  ];

  const analyzed = routes.map((r) => ({
    ...r,
    delivery_cost_per_credit_usd: calculateDeliveryCostPerCredit({
      supplierCostUsd: r.supplier_cost_usd,
      creditsCharged: r.credits_charged,
    }),
  }));

  analyzed.sort((a, b) => b.delivery_cost_per_credit_usd - a.delivery_cost_per_credit_usd);

  return {
    highest_delivery_cost_route: analyzed[0],
    ranked_routes: analyzed,
  };
}

/**
 * Runs full-redemption stress tests across all plans for a specific route.
 */
export function runPlanFullRedemptionAnalysis({
  routeKey = 'muapi:nano-banana-pro-1k',
  supplierCostUsd = 0.120,
  creditsCharged = APPROVED_NANO_BANANA_PRO_TEST_RATE_CREDITS,
  paymentFeeProfile = DEFAULT_PAYMENT_FEE_PROFILE,
  stressSupplierHikePct = 0.0,
  stressBillableFailurePct = 0.0,
}) {
  return CREDIT_PACK_RATES.map((pack) => {
    const effectiveCost = supplierCostUsd * (1.0 + stressSupplierHikePct);
    const result = calculatePlanContribution({
      planPriceUsd: pack.price_usd,
      creditsGranted: pack.credits,
      creditsPerGeneration: creditsCharged,
      supplierCostUsd: effectiveCost,
      paymentFeeProfile,
      billableFailureRatePct: stressBillableFailurePct,
    });

    return {
      pack_id: pack.id,
      pack_name: pack.name,
      price_usd: pack.price_usd,
      credits: pack.credits,
      effective_usd_per_credit: pack.effective_usd_per_credit,
      route_key: routeKey,
      credits_charged: creditsCharged,
      supplier_cost_evaluated: effectiveCost,
      completed_generations: result.completed_generations_n,
      total_compute_cost_usd: result.total_compute_cost_usd,
      payment_fees_usd: result.payment_fee_total_usd,
      storage_egress_usd: result.storage_egress_total_usd,
      net_contribution_usd: result.net_contribution_usd,
      contribution_margin_pct: result.margin_pct,
      is_profitable: result.is_profitable,
    };
  });
}
