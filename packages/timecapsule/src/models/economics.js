/**
 * Timecapsule Studio — Pricing Economics & Supplier Cost Registry
 *
 * This module separates all economic variables:
 *   1. Retail credit purchase rate (denomination baseline)
 *   2. Plan and pack effective revenue per credit
 *   3. Verified supplier cost per generation configuration
 *   4. Variable costs (payment fees, egress, storage)
 *   5. Contribution margin targets (50%, 60%, 70%)
 *   6. Customer credit charge calculations
 *   7. Pricing policy versioning
 *
 * Invariant Rules:
 *   - Retail revenue per credit != Supplier cost backing.
 *   - Routes with unknown supplier costs cannot be labeled profitable.
 *   - Prices must be evaluated against the lowest effective revenue rate among eligible plans.
 *   - Customer accepted charges are immutable at job submission (2PC invariant).
 */

export const PRICING_POLICY_VERSION = 'tc-pricing-v1';
export const PROPOSED_PRICING_POLICY_VERSION = 'tc-pricing-v2-draft';

/**
 * Proposed base retail denomination: $1.00 USD = 250 credits.
 * This represents the face-value purchasing rate before volume discounts or plan bonuses.
 */
export const RETAIL_CREDIT_PURCHASE_RATE_USD = 0.004000; // $0.004 per credit ($1 = 250 credits)

/**
 * Variable Cost Assumptions (Non-compute COGS)
 */
export const VARIABLE_COST_ASSUMPTIONS = Object.freeze({
  payment_gateway_fee_pct: 0.029, // 2.9% payment processing fee (Stripe standard)
  payment_gateway_fixed_usd: 0.30,  // $0.30 fixed fee per checkout transaction
  infra_egress_storage_pct: 0.015, // 1.5% storage, bandwidth, and logging buffer
  get total_variable_cost_pct() {
    return this.payment_gateway_fee_pct + this.infra_egress_storage_pct; // 0.044 (4.4%)
  },
});

/**
 * Credit Top-Up Packs & Effective Revenue per Credit
 */
export const CREDIT_PACK_RATES = Object.freeze([
  {
    id: 'starter',
    name: 'Starter Pack',
    price_usd: 10.0,
    credits: 2500,
    effective_usd_per_credit: 10.0 / 2500, // $0.004000
    discount_pct: 0.0,
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    price_usd: 25.0,
    credits: 6800,
    effective_usd_per_credit: 25.0 / 6800, // ~$0.003676
    discount_pct: 8.1,
  },
  {
    id: 'studio_pro',
    name: 'Studio Pro',
    price_usd: 75.0,
    credits: 22500,
    effective_usd_per_credit: 75.0 / 22500, // ~$0.003333
    discount_pct: 16.7,
  },
  {
    id: 'production_house',
    name: 'Production House',
    price_usd: 250.0,
    credits: 85000,
    effective_usd_per_credit: 250.0 / 85000, // ~$0.002941
    discount_pct: 26.5,
  },
  {
    id: 'enterprise_fleet',
    name: 'Enterprise Fleet',
    price_usd: 1000.0,
    credits: 380000,
    effective_usd_per_credit: 1000.0 / 380000, // ~$0.002632
    discount_pct: 34.2,
  },
]);

/**
 * Monthly Studio Plans (Initial Proposed vs Recalibrated)
 */
export const MONTHLY_STUDIO_PLANS = Object.freeze([
  {
    id: 'studio_scale',
    name: 'Studio Scale',
    price_usd: 3000.0,
    current_fast_credits: 4000000, // Initial proposed allowance
    current_effective_usd_per_credit: 3000.0 / 4000000, // $0.000750 (severely underwater on high-cost models)
    recalibrated_credits_safe: 800000, // Sized for 60% margin ceiling across mixed workloads ($0.003750/cr)
  },
  {
    id: 'agency_master',
    name: 'Agency Master',
    price_usd: 5000.0,
    current_fast_credits: 7500000,
    current_effective_usd_per_credit: 5000.0 / 7500000, // $0.000667
    recalibrated_credits_safe: 1500000, // Sized for safe multi-seat margin ($0.003333/cr)
  },
  {
    id: 'sovereign_vip',
    name: 'Sovereign VIP',
    price_usd: 10000.0,
    current_fast_credits: 16000000,
    current_effective_usd_per_credit: 10000.0 / 16000000, // $0.000625
    recalibrated_credits_safe: 3500000, // Sized for safe VIP margin ($0.002857/cr)
  },
]);

/**
 * Lowest effective revenue per credit among standard credit packs
 */
export const LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT =
  CREDIT_PACK_RATES[CREDIT_PACK_RATES.length - 1].effective_usd_per_credit; // ~$0.002632

/**
 * Empirical Supplier Cost Registry (Checked 2026-10-24)
 * Every entry records exact provider, endpoint, model, configuration, output count,
 * currency, checked date, source URL, and verified confidence level.
 */
export const SUPPLIER_COST_REGISTRY = Object.freeze({
  // 1. Muapi: Nano Banana Pro (T2I)
  'muapi:nano-banana-pro': {
    provider: 'muapi',
    endpoint: 'nano-banana-pro',
    model_id: 'nano-banana-pro',
    configuration: { resolution: 'standard/1k', aspect_ratio: 'any' },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.120,
    cost_status: 'verified',
    source_url: 'https://muapi.ai/pricing',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none (standard public list price)',
    resolution_tiered: false,
    notes: 'Muapi lists nano-banana-pro at $0.12 per generation. Does not publish a separate 1k/2k/4k price tier.',
  },

  // 2. Muapi: Nano Banana Pro Edit (I2I)
  'muapi:nano-banana-pro-edit': {
    provider: 'muapi',
    endpoint: 'nano-banana-pro-edit',
    model_id: 'nano-banana-pro-edit',
    configuration: { resolution: 'standard/1k', reference_images: 1 },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.120,
    cost_status: 'verified',
    source_url: 'https://muapi.ai/pricing',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none (standard public list price)',
    resolution_tiered: false,
    notes: 'Muapi lists nano-banana-pro-edit at $0.12 per generation.',
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
    source_url: 'https://muapi.ai/pricing',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none',
    resolution_tiered: false,
    notes: 'Base 5s generation is listed at $0.18. Higher resolution (1080p) surcharge is unverified on public card.',
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
    source_url: 'https://muapi.ai/pricing',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none',
    resolution_tiered: false,
    notes: 'Base 5s generation is listed at $0.18.',
  },

  // 5. Kie: Veo 3 Fast (T2V & I2V)
  'kie:veo3_fast': {
    provider: 'kie',
    endpoint: '/api/v1/veo/generate',
    model_id: 'veo3_fast',
    configuration: { duration_seconds: 8, resolution: '720p' },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.350, // Midpoint of 60-80 Kie credits at $0.005 = $0.30 - $0.40
    cost_status: 'verified',
    source_url: 'https://docs.kie.ai/veo3-api/generate-veo-3-video',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none (60-80 Kie points per generation @ $0.005/pt)',
    resolution_tiered: true,
    notes: 'Base 720p 8s costs 60-80 points (~$0.30-$0.40). 1080p has an incremental upgrade surcharge.',
  },

  // 6. Kie: ByteDance Seedance 1.5 Pro (Market Job Alternative)
  'kie:bytedance/seedance-1.5-pro': {
    provider: 'kie',
    endpoint: '/api/v1/jobs/createTask',
    model_id: 'bytedance/seedance-1.5-pro',
    configuration: { duration_seconds: 5, resolution: '720p' },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.250, // 50 Kie points @ $0.005
    cost_status: 'verified',
    source_url: 'https://docs.kie.ai/market/common/create-task',
    checked_date: '2026-10-24',
    confidence: 'medium',
    account_discount: 'none',
    notes: 'Kie market task pricing fluctuates with cluster demand (~$0.20-$0.30).',
  },

  // 7. Fal: Flux Dev (Alternative route for image)
  'fal:fal-ai/flux/dev': {
    provider: 'fal',
    endpoint: 'fal-ai/flux/dev',
    model_id: 'fal-ai/flux/dev',
    configuration: { resolution: '1024x1024', steps: 28 },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.025,
    cost_status: 'verified',
    source_url: 'https://fal.ai/models/fal-ai/flux/dev',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none',
    notes: '$0.025 per megapixel image.',
  },

  // 8. Replicate: Flux Schnell (Alternative route for image)
  'replicate:black-forest-labs/flux-schnell': {
    provider: 'replicate',
    endpoint: 'black-forest-labs/flux-schnell',
    model_id: 'black-forest-labs/flux-schnell',
    configuration: { steps: 4 },
    output_count: 1,
    currency: 'USD',
    supplier_cost_usd: 0.003,
    cost_status: 'verified',
    source_url: 'https://replicate.com/black-forest-labs/flux-schnell',
    checked_date: '2026-10-24',
    confidence: 'high',
    account_discount: 'none',
    notes: 'Replicate per-run charge ~$0.003.',
  },

  // 9. Unknown / Unverified Routes (Marked explicitly unknown)
  'muapi:veo3.1-fast-text-to-video': {
    provider: 'muapi',
    endpoint: 'veo3.1-fast-text-to-video',
    model_id: 'veo3.1-fast-text-to-video',
    supplier_cost_usd: null,
    cost_status: 'unknown',
    confidence: 'unknown',
    notes: 'Contract unverified on Muapi; disabled in catalog to prevent unestablished execution.',
  },
  'timecapsule-gpu:flux1-dev-t2i': {
    provider: 'timecapsule-gpu',
    endpoint: 'timecapsule.flux1-dev-t2i',
    model_id: 'timecapsule.flux1-dev-t2i',
    supplier_cost_usd: null,
    cost_status: 'unknown',
    confidence: 'unknown',
    notes: 'Self-hosted GPU instance hourly/per-run cost is unverified.',
  },
  'timecapsule-gpu:wan2.1-t2v': {
    provider: 'timecapsule-gpu',
    endpoint: 'timecapsule.wan2.1-t2v',
    model_id: 'timecapsule.wan2.1-t2v',
    supplier_cost_usd: null,
    cost_status: 'unknown',
    confidence: 'unknown',
    notes: 'Self-hosted GPU instance hourly/per-run cost is unverified.',
  },
});

/**
 * Calculates the required credit charge given supplier cost, effective revenue rate,
 * target contribution margin, and variable cost deductions.
 *
 * Formula:
 *   Denominator = effective_revenue_per_credit * (1 - target_margin - variable_costs)
 *   Credits = ceil(supplier_cost / Denominator)
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
  if (effectiveRevenuePerCredit <= 0) {
    throw new Error(`Effective revenue per credit must be positive: ${effectiveRevenuePerCredit}`);
  }

  const netDenominator = effectiveRevenuePerCredit * (1.0 - targetMarginPct - otherVariableCostPct);
  if (netDenominator <= 0) {
    throw new Error(
      `Target margin (${(targetMarginPct * 100).toFixed(1)}%) + variable costs (${(otherVariableCostPct * 100).toFixed(1)}%) exceed 100% of revenue.`
    );
  }

  return Math.ceil(supplierCostUsd / netDenominator);
}

/**
 * Computes exact contribution margin percentage for a given credit charge and supplier cost.
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
 * Generates pricing scenarios at 50%, 60%, and 70% contribution targets for all verified routes
 * evaluated against both the base top-up rate ($0.004) and lowest credit pack rate ($0.00263).
 */
export function generateRoutePricingScenarios() {
  const routes = [
    {
      route_key: 'muapi:nano-banana-pro',
      name: 'Nano Banana Pro (T2I)',
      supplier_cost_usd: 0.120,
      current_credits: 10,
      modality: 'image',
    },
    {
      route_key: 'muapi:nano-banana-pro-edit',
      name: 'Nano Banana Pro Edit (I2I)',
      supplier_cost_usd: 0.120,
      current_credits: 15,
      modality: 'i2i',
    },
    {
      route_key: 'muapi:seedance-pro-t2v',
      name: 'Seedance Pro T2V (720p 5s)',
      supplier_cost_usd: 0.180,
      current_credits: 350,
      modality: 'video',
    },
    {
      route_key: 'kie:veo3_fast',
      name: 'Veo 3.1 Fast (720p 8s)',
      supplier_cost_usd: 0.350,
      current_credits: 450,
      modality: 'video',
    },
    {
      route_key: 'fal:fal-ai/flux/dev',
      name: 'Flux Dev (Fal.ai fallback)',
      supplier_cost_usd: 0.025,
      current_credits: 15,
      modality: 'image',
    },
    {
      route_key: 'replicate:black-forest-labs/flux-schnell',
      name: 'Flux Schnell (Replicate fallback)',
      supplier_cost_usd: 0.003,
      current_credits: 10,
      modality: 'image',
    },
  ];

  return routes.map((r) => {
    // Current economics at base rate ($0.004)
    const currentBase = calculateContributionMargin({
      creditsCharged: r.current_credits,
      supplierCostUsd: r.supplier_cost_usd,
      effectiveRevenuePerCredit: RETAIL_CREDIT_PURCHASE_RATE_USD,
    });

    // Current economics at lowest pack rate ($0.00263)
    const currentLowest = calculateContributionMargin({
      creditsCharged: r.current_credits,
      supplierCostUsd: r.supplier_cost_usd,
      effectiveRevenuePerCredit: LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT,
    });

    // Scenarios at base top-up ($0.004)
    const base_50 = calculateRequiredCredits({
      supplierCostUsd: r.supplier_cost_usd,
      effectiveRevenuePerCredit: RETAIL_CREDIT_PURCHASE_RATE_USD,
      targetMarginPct: 0.50,
    });
    const base_60 = calculateRequiredCredits({
      supplierCostUsd: r.supplier_cost_usd,
      effectiveRevenuePerCredit: RETAIL_CREDIT_PURCHASE_RATE_USD,
      targetMarginPct: 0.60,
    });
    const base_70 = calculateRequiredCredits({
      supplierCostUsd: r.supplier_cost_usd,
      effectiveRevenuePerCredit: RETAIL_CREDIT_PURCHASE_RATE_USD,
      targetMarginPct: 0.70,
    });

    // Scenarios at lowest credit pack ($0.00263) — ensures margin even if buyer purchased $1,000 pack!
    const pack_safe_50 = calculateRequiredCredits({
      supplierCostUsd: r.supplier_cost_usd,
      effectiveRevenuePerCredit: LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT,
      targetMarginPct: 0.50,
    });
    const pack_safe_60 = calculateRequiredCredits({
      supplierCostUsd: r.supplier_cost_usd,
      effectiveRevenuePerCredit: LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT,
      targetMarginPct: 0.60,
    });
    const pack_safe_70 = calculateRequiredCredits({
      supplierCostUsd: r.supplier_cost_usd,
      effectiveRevenuePerCredit: LOWEST_PACK_EFFECTIVE_USD_PER_CREDIT,
      targetMarginPct: 0.70,
    });

    return {
      ...r,
      current_margin_at_base_pct: currentBase.margin_pct,
      current_margin_at_lowest_pack_pct: currentLowest.margin_pct,
      scenarios_at_base_retail: {
        '50_pct_margin_credits': base_50,
        '60_pct_margin_credits': base_60,
        '70_pct_margin_credits': base_70,
      },
      scenarios_at_lowest_pack: {
        '50_pct_margin_credits': pack_safe_50,
        '60_pct_margin_credits': pack_safe_60,
        '70_pct_margin_credits': pack_safe_70,
      },
    };
  });
}
