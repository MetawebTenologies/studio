/**
 * Timecapsule Checkpoint 3A — Supported Release Catalog & Contract Verification Registry
 *
 * Verification Status Definitions:
 *   - 'catalog_only'    : Inherited from upstream catalog; not enabled for managed execution.
 *   - 'documented'      : Official provider contract inspected, not yet verified by automated contract tests.
 *   - 'contract_tested' : Verified against local HTTP contract test harness (submission, polling, errors, outputs).
 *                         NOTE: Mocked or fixture tests can NEVER promote a route beyond 'contract_tested'.
 *   - 'live_verified'   : Verified against live provider API with explicit operator approval.
 *   - 'disabled'        : Explicitly disabled (e.g., unverified self-hosted GPU workers or unverified lip-sync).
 *
 * Official Provider Documentation Checked (Date: 2026-10-21):
 *   - Muapi REST API v1:
 *     - Docs Overview & Endpoints : https://muapi.ai/docs
 *     - Base URL                  : https://api.muapi.ai/api/v1
 *     - Auth Header               : x-api-key: <MUAPI_API_KEY>
 *     - Task Submission           : POST https://api.muapi.ai/api/v1/{endpoint} -> { request_id, status }
 *     - Result Polling            : GET  https://api.muapi.ai/api/v1/predictions/{request_id}/result -> { id, status, outputs, error }
 *     - File Upload               : POST https://api.muapi.ai/api/v1/upload_file (multipart/form-data field `file`) -> { url }
 *   - Kie.ai REST API v1:
 *     - Docs Overview             : https://docs.kie.ai
 *     - Market Task Submission    : https://docs.kie.ai/market/common/create-task (POST https://api.kie.ai/api/v1/jobs/createTask)
 *     - Market Task Polling       : https://docs.kie.ai/market/common/get-task-detail (GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...)
 *     - Dedicated Veo Submission  : https://docs.kie.ai/veo3-api/generate-veo-3-video (POST https://api.kie.ai/api/v1/veo/generate)
 *     - Dedicated Veo Polling     : https://docs.kie.ai/veo3-api/get-veo-3-video-details (GET https://api.kie.ai/api/v1/veo/record-info?taskId=...)
 *     - File Upload               : https://kieai.redpandaai.co/api/file-base64-upload
 */

export const CONTRACT_VERIFICATION_STATUSES = Object.freeze([
  'catalog_only',
  'documented',
  'contract_tested',
  'live_verified',
  'disabled',
]);

export const PRICING_POLICY_VERSION = 'tc-pricing-v1';
export const EXECUTION_ROUTE_VERSION = '2026-10-21.v1';

export const PROVIDER_DOCUMENTATION_REGISTRY = Object.freeze({
  checked_at: '2026-10-21',
  muapi: {
    provider: 'muapi',
    docs_url: 'https://muapi.ai/docs',
    base_url: 'https://api.muapi.ai/api/v1',
    auth_scheme: 'x-api-key header (server-only MUAPI_API_KEY)',
    submit_contract: 'POST /api/v1/{endpoint} -> { request_id, status }',
    poll_contract: 'GET /api/v1/predictions/{request_id}/result -> { id, status, outputs, error }',
    upload_contract: 'POST /api/v1/upload_file (multipart/form-data field "file") -> { url }',
    unknowns: [
      'Muapi does not document a universal caller-supplied idempotency header on POST /api/v1/{endpoint}; Timecapsule enforces pre-submission attempt locking and submission_unknown reconciliation.',
      'Exact Muapi per-request credit/USD response headers or payload fields may vary by model endpoint; provider cost is recorded as separate metadata when present and never used as user_billed_credits.',
    ],
  },
  kie: {
    provider: 'kie',
    docs_url: 'https://docs.kie.ai',
    base_url: 'https://api.kie.ai',
    upload_base_url: 'https://kieai.redpandaai.co',
    auth_scheme: 'Authorization: Bearer <KIE_API_KEY> (server-only)',
    market_submit_contract: 'POST /api/v1/jobs/createTask -> { code: 200, data: { taskId } }',
    market_poll_contract: 'GET /api/v1/jobs/recordInfo?taskId={taskId} -> { code: 200, data: { state, resultJson, failMsg } }',
    veo_submit_contract: 'POST /api/v1/veo/generate -> { code: 200, data: { taskId } }',
    veo_poll_contract: 'GET /api/v1/veo/record-info?taskId={taskId} -> { code: 200, data: { taskId, successFlag, response: { resultUrls }, errorMessage } }',
    upload_contract: 'POST https://kieai.redpandaai.co/api/file-base64-upload -> { code: 200, data: { downloadUrl } }',
    unknowns: [
      'Kie recordInfo and veo/record-info do not consistently return a standardized provider credit debit field across all models; Timecapsule bills deterministic integer credits via credit_estimate_policy.',
    ],
  },
  fal: {
    provider: 'fal',
    docs_url: 'https://fal.ai/docs',
    base_url: 'https://queue.fal.run',
    auth_scheme: 'Authorization: Key <FAL_KEY> (server-only)',
    submit_contract: 'POST https://queue.fal.run/{endpoint} -> { request_id }',
    poll_contract: 'GET https://queue.fal.run/{endpoint}/requests/{request_id}/status -> { status }',
    unknowns: [
      'Fal Queue provides asynchronous polling with separate result URLs; cost is billed in USD micro-units.',
    ],
  },
  replicate: {
    provider: 'replicate',
    docs_url: 'https://replicate.com/docs',
    base_url: 'https://api.replicate.com/v1',
    auth_scheme: 'Authorization: Bearer <REPLICATE_API_TOKEN> (server-only)',
    submit_contract: 'POST https://api.replicate.com/v1/models/{model}/predictions -> { id, status }',
    poll_contract: 'GET https://api.replicate.com/v1/predictions/{id} -> { id, status, output, error }',
    unknowns: [
      'Replicate predictions report execution metrics and outputs as string or array of strings.',
    ],
  },
});

/**
 * Supported Release Catalog (Checkpoint 3A)
 * Covers the 4 core workflows with Muapi as primary provider and Kie as explicit alternative,
 * plus the verified Kie Veo dedicated contract routes.
 */
export const SUPPORTED_RELEASE_MODELS = [
  // 1. Core Workflow #1: Text-to-Image (T2I)
  {
    id: 'nano-banana-pro',
    timecapsule_model_id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    description: 'Flagship text-to-image generation with multi-aspect ratio and 1K/2K/4K resolution support.',
    family: 'Nano Banana',
    category: 't2i',
    modality: 'image',
    enabled: true,
    managed_supported: true,
    verification_status: 'contract_tested',
    primary_provider: 'muapi',
    provider_model_id: 'nano-banana-pro',
    endpoint: 'nano-banana-pro',
    execution_route: 'muapi:predictions/v1:nano-banana-pro',
    execution_route_version: EXECUTION_ROUTE_VERSION,
    pricing_policy_version: PRICING_POLICY_VERSION,
    cascade_order: ['muapi', 'fal', 'replicate', 'kie'],
    alternative_providers: {
      fal: {
        provider: 'fal',
        provider_model_id: 'fal-ai/flux/dev',
        execution_route: 'fal:queue/v1:fal-ai/flux/dev',
        execution_route_version: EXECUTION_ROUTE_VERSION,
        verification_status: 'contract_tested',
      },
      replicate: {
        provider: 'replicate',
        provider_model_id: 'black-forest-labs/flux-schnell',
        execution_route: 'replicate:predictions/v1:black-forest-labs/flux-schnell',
        execution_route_version: EXECUTION_ROUTE_VERSION,
        verification_status: 'contract_tested',
      },
      kie: {
        provider: 'kie',
        provider_model_id: 'nano-banana-pro',
        execution_route: 'kie:market-jobs/v1:nano-banana-pro',
        execution_route_version: EXECUTION_ROUTE_VERSION,
        verification_status: 'contract_tested',
      },
    },
    required_inputs: ['prompt'],
    optional_inputs: ['aspect_ratio', 'resolution', 'seed'],
    credit_estimate_policy: {
      policy_id: 'tier_image_resolution_v1',
      pricing_policy_version: PRICING_POLICY_VERSION,
      base_credits: 10,
      by_resolution: {
        '1k': 10,
        '2k': 15,
        '4k': 25,
      },
    },
    estimatedCredits: 10,
    inputs: {
      prompt: {
        type: 'string',
        title: 'Prompt',
        name: 'prompt',
        description: 'Text description of the image to generate.',
      },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        name: 'aspect_ratio',
        enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'],
        default: '1:1',
      },
      resolution: {
        type: 'string',
        title: 'Resolution',
        name: 'resolution',
        enum: ['1k', '2k', '4k'],
        default: '1k',
      },
    },
  },

  // 2. Core Workflow #2: Image-to-Image / Editing (I2I)
  {
    id: 'nano-banana-pro-edit',
    timecapsule_model_id: 'nano-banana-pro-edit',
    name: 'Nano Banana Pro Edit',
    description: 'Reference-guided image editing and transformation from uploaded source images.',
    family: 'Nano Banana',
    category: 'i2i',
    modality: 'i2i',
    enabled: true,
    managed_supported: true,
    verification_status: 'contract_tested',
    primary_provider: 'muapi',
    provider_model_id: 'nano-banana-pro-edit',
    endpoint: 'nano-banana-pro-edit',
    execution_route: 'muapi:predictions/v1:nano-banana-pro-edit',
    execution_route_version: EXECUTION_ROUTE_VERSION,
    pricing_policy_version: PRICING_POLICY_VERSION,
    imageField: 'images_list',
    maxImages: 4,
    alternative_providers: {
      kie: {
        provider: 'kie',
        provider_model_id: 'nano-banana-pro',
        execution_route: 'kie:market-jobs/v1:nano-banana-pro',
        execution_route_version: EXECUTION_ROUTE_VERSION,
        verification_status: 'contract_tested',
      },
    },
    required_inputs: ['image_urls'],
    optional_inputs: ['prompt', 'aspect_ratio', 'resolution'],
    credit_estimate_policy: {
      policy_id: 'tier_i2i_resolution_v1',
      pricing_policy_version: PRICING_POLICY_VERSION,
      base_credits: 15,
      by_resolution: {
        '1k': 15,
        '2k': 20,
        '4k': 30,
      },
    },
    estimatedCredits: 15,
    inputs: {
      prompt: {
        type: 'string',
        title: 'Edit Prompt',
        name: 'prompt',
        description: 'Instructions describing how to edit or transform the source image.',
      },
      images_list: {
        type: 'array',
        title: 'Source Images',
        name: 'images_list',
      },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        name: 'aspect_ratio',
        enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'],
        default: '1:1',
      },
      resolution: {
        type: 'string',
        title: 'Resolution',
        name: 'resolution',
        enum: ['1k', '2k', '4k'],
        default: '1k',
      },
    },
  },

  // 3. Core Workflow #3: Text-to-Video (T2V)
  {
    id: 'seedance-pro-t2v',
    timecapsule_model_id: 'seedance-pro-t2v',
    name: 'Seedance Pro T2V',
    description: 'Cinematic text-to-video via Muapi Seedance Pro (or explicit different-model alternative: Kie ByteDance Seedance 1.5 Pro). Routes are non-equivalent provider models.',
    family: 'Seedance',
    category: 't2v',
    modality: 'video',
    enabled: true,
    managed_supported: true,
    verification_status: 'contract_tested',
    primary_provider: 'muapi',
    provider_model_id: 'seedance-pro-t2v',
    endpoint: 'seedance-pro-t2v',
    execution_route: 'muapi:predictions/v1:seedance-pro-t2v',
    execution_route_version: EXECUTION_ROUTE_VERSION,
    pricing_policy_version: PRICING_POLICY_VERSION,
    alternative_providers: {
      kie: {
        provider: 'kie',
        provider_model_id: 'bytedance/seedance-1.5-pro',
        execution_route: 'kie:market-jobs/v1:bytedance/seedance-1.5-pro',
        execution_route_version: EXECUTION_ROUTE_VERSION,
        verification_status: 'contract_tested',
        route_relation: 'different_model_alternative',
        is_equivalent_model: false,
        notes: 'Kie provides bytedance/seedance-1.5-pro, which is a different model version from Muapi seedance-pro-t2v. Explicit opt-in only; never silently substituted.',
      },
    },
    required_inputs: ['prompt'],
    optional_inputs: ['aspect_ratio', 'resolution', 'duration_seconds'],
    credit_estimate_policy: {
      policy_id: 'tier_video_duration_resolution_v1',
      pricing_policy_version: PRICING_POLICY_VERSION,
      base_credits_5s_720p: 350,
      base_credits_5s_1080p: 450,
    },
    estimatedCredits: 350,
    inputs: {
      prompt: {
        type: 'string',
        title: 'Prompt',
        name: 'prompt',
        description: 'Prompt describing the video scene and camera motion.',
      },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        name: 'aspect_ratio',
        enum: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'],
        default: '16:9',
      },
      resolution: {
        type: 'string',
        title: 'Resolution',
        name: 'resolution',
        enum: ['480p', '720p', '1080p'],
        default: '720p',
      },
      duration: {
        type: 'int',
        title: 'Duration',
        name: 'duration',
        enum: [5, 10],
        default: 5,
      },
    },
  },

  // 4. Core Workflow #4: Image-to-Video (I2V)
  {
    id: 'seedance-pro-i2v',
    timecapsule_model_id: 'seedance-pro-i2v',
    name: 'Seedance Pro I2V',
    description: 'Reference keyframe image animation via Muapi Seedance Pro I2V (or explicit different-model alternative: Kie ByteDance Seedance 1.5 Pro). Routes are non-equivalent provider models.',
    family: 'Seedance',
    category: 'i2v',
    modality: 'i2v',
    enabled: true,
    managed_supported: true,
    verification_status: 'contract_tested',
    primary_provider: 'muapi',
    provider_model_id: 'seedance-pro-i2v',
    endpoint: 'seedance-pro-i2v',
    execution_route: 'muapi:predictions/v1:seedance-pro-i2v',
    execution_route_version: EXECUTION_ROUTE_VERSION,
    pricing_policy_version: PRICING_POLICY_VERSION,
    imageField: 'image_url',
    hasPrompt: true,
    alternative_providers: {
      kie: {
        provider: 'kie',
        provider_model_id: 'bytedance/seedance-1.5-pro',
        execution_route: 'kie:market-jobs/v1:bytedance/seedance-1.5-pro',
        execution_route_version: EXECUTION_ROUTE_VERSION,
        verification_status: 'contract_tested',
        route_relation: 'different_model_alternative',
        is_equivalent_model: false,
        notes: 'Kie provides bytedance/seedance-1.5-pro, which is a different model version from Muapi seedance-pro-i2v. Explicit opt-in only; never silently substituted.',
      },
    },
    required_inputs: ['image_urls'],
    optional_inputs: ['prompt', 'aspect_ratio', 'resolution', 'duration_seconds'],
    credit_estimate_policy: {
      policy_id: 'tier_video_duration_resolution_v1',
      pricing_policy_version: PRICING_POLICY_VERSION,
      base_credits_5s_720p: 350,
      base_credits_5s_1080p: 450,
    },
    estimatedCredits: 350,
    inputs: {
      prompt: {
        type: 'string',
        title: 'Prompt',
        name: 'prompt',
        description: 'Prompt guiding motion from the source image.',
      },
      image_url: {
        type: 'string',
        title: 'Reference Image',
        name: 'image_url',
      },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        name: 'aspect_ratio',
        enum: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'],
        default: '16:9',
      },
      resolution: {
        type: 'string',
        title: 'Resolution',
        name: 'resolution',
        enum: ['480p', '720p', '1080p'],
        default: '720p',
      },
      duration: {
        type: 'int',
        title: 'Duration',
        name: 'duration',
        enum: [5, 10],
        default: 5,
      },
    },
  },

  // 5. Verified Kie Dedicated Veo Contract (T2V & I2V)
  {
    id: 'veo3.1-fast-text-to-video',
    timecapsule_model_id: 'veo3.1-fast-text-to-video',
    name: 'Veo 3.1 Fast T2V',
    description: 'Dedicated Veo 3 Fast text-to-video route (/api/v1/veo/generate + /api/v1/veo/record-info).',
    family: 'Veo',
    category: 't2v',
    modality: 'video',
    enabled: true,
    managed_supported: true,
    verification_status: 'contract_tested',
    primary_provider: 'kie',
    provider_model_id: 'veo3_fast',
    endpoint: 'veo3.1-fast-text-to-video',
    execution_route: 'kie:veo/v1:veo3_fast',
    execution_route_version: EXECUTION_ROUTE_VERSION,
    pricing_policy_version: PRICING_POLICY_VERSION,
    alternative_providers: {
      muapi: {
        provider: 'muapi',
        provider_model_id: 'veo3.1-fast-text-to-video',
        execution_route: 'muapi:predictions/v1:veo3.1-fast-text-to-video',
        execution_route_version: EXECUTION_ROUTE_VERSION,
        verification_status: 'disabled',
        enabled: false,
        disabled_reason: 'Muapi contract for Veo 3.1 Fast is unverified; route disabled to prevent unestablished execution.',
      },
    },
    required_inputs: ['prompt'],
    optional_inputs: ['aspect_ratio', 'resolution', 'duration_seconds'],
    credit_estimate_policy: {
      policy_id: 'tier_veo_fast_v1',
      pricing_policy_version: PRICING_POLICY_VERSION,
      base_credits: 450,
    },
    estimatedCredits: 450,
    inputs: {
      prompt: {
        type: 'string',
        title: 'Prompt',
        name: 'prompt',
        description: 'Prompt describing the Veo 3.1 Fast video.',
      },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        name: 'aspect_ratio',
        enum: ['16:9', '9:16'],
        default: '16:9',
      },
      resolution: {
        type: 'string',
        title: 'Resolution',
        name: 'resolution',
        enum: ['720p', '1080p'],
        default: '720p',
      },
      duration: {
        type: 'int',
        title: 'Duration',
        name: 'duration',
        enum: [8],
        default: 8,
      },
    },
  },
  {
    id: 'veo3.1-fast-image-to-video',
    timecapsule_model_id: 'veo3.1-fast-image-to-video',
    name: 'Veo 3.1 Fast I2V',
    description: 'Dedicated Veo 3 Fast image-to-video route (/api/v1/veo/generate + /api/v1/veo/record-info).',
    family: 'Veo',
    category: 'i2v',
    modality: 'i2v',
    enabled: true,
    managed_supported: true,
    verification_status: 'contract_tested',
    primary_provider: 'kie',
    provider_model_id: 'veo3_fast',
    endpoint: 'veo3.1-fast-image-to-video',
    execution_route: 'kie:veo/v1:veo3_fast',
    execution_route_version: EXECUTION_ROUTE_VERSION,
    pricing_policy_version: PRICING_POLICY_VERSION,
    imageField: 'images_list',
    hasPrompt: true,
    alternative_providers: {
      muapi: {
        provider: 'muapi',
        provider_model_id: 'veo3.1-fast-image-to-video',
        execution_route: 'muapi:predictions/v1:veo3.1-fast-image-to-video',
        execution_route_version: EXECUTION_ROUTE_VERSION,
        verification_status: 'disabled',
        enabled: false,
        disabled_reason: 'Muapi contract for Veo 3.1 Fast I2V is unverified; route disabled to prevent unestablished execution.',
      },
    },
    required_inputs: ['image_urls'],
    optional_inputs: ['prompt', 'aspect_ratio', 'resolution', 'duration_seconds'],
    credit_estimate_policy: {
      policy_id: 'tier_veo_fast_v1',
      pricing_policy_version: PRICING_POLICY_VERSION,
      base_credits: 450,
    },
    estimatedCredits: 450,
    inputs: {
      prompt: {
        type: 'string',
        title: 'Prompt',
        name: 'prompt',
      },
      images_list: {
        type: 'array',
        title: 'Reference Image',
        name: 'images_list',
      },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        name: 'aspect_ratio',
        enum: ['16:9', '9:16'],
        default: '16:9',
      },
      resolution: {
        type: 'string',
        title: 'Resolution',
        name: 'resolution',
        enum: ['720p', '1080p'],
        default: '720p',
      },
      duration: {
        type: 'int',
        title: 'Duration',
        name: 'duration',
        enum: [8],
        default: 8,
      },
    },
  },
];

export const RELEASE_MODEL_MAP = new Map(
  SUPPORTED_RELEASE_MODELS.map((m) => [m.id, m])
);

export function getSupportedReleaseModel(modelId) {
  if (!modelId) return null;
  return RELEASE_MODEL_MAP.get(String(modelId).trim()) || null;
}

/**
 * Resolves the execution route, provider model ID, and verification status for a supported
 * release model given an optional explicit provider override.
 * Never silently falls back from Muapi to Kie or from Kie to Muapi.
 */
export function resolveReleaseRoute(modelId, modality, requestedProvider = null) {
  const entry = getSupportedReleaseModel(modelId);
  if (!entry) {
    return null;
  }

  const normalizedModality =
    modality === 't2i' ? 'image' : modality === 't2v' ? 'video' : modality;
  if (normalizedModality && entry.modality !== normalizedModality) {
    const err = new Error(
      `Model "${modelId}" belongs to modality "${entry.modality}" and cannot be executed as "${normalizedModality}"`
    );
    err.code = 'MODALITY_MISMATCH';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  const targetProvider = requestedProvider
    ? String(requestedProvider).trim().toLowerCase()
    : entry.primary_provider;

  if (targetProvider === entry.primary_provider) {
    return {
      timecapsule_model_id: entry.timecapsule_model_id,
      modality: entry.modality,
      provider: entry.primary_provider,
      provider_model_id: entry.provider_model_id,
      execution_route: entry.execution_route,
      execution_route_version: entry.execution_route_version,
      pricing_policy_version: entry.pricing_policy_version,
      verification_status: entry.verification_status,
      credit_estimate_policy: entry.credit_estimate_policy,
      required_inputs: entry.required_inputs,
      optional_inputs: entry.optional_inputs,
    };
  }

  const alt = entry.alternative_providers?.[targetProvider];
  if (alt) {
    if (alt.enabled === false || alt.verification_status === 'disabled') {
      const err = new Error(
        `Route for model "${modelId}" with provider "${targetProvider}" is disabled: ${alt.disabled_reason || 'Contract cannot be established'}`
      );
      err.code = 'PROVIDER_ROUTE_DISABLED';
      err.status = 400;
      err.statusCode = 400;
      throw err;
    }

    return {
      timecapsule_model_id: entry.timecapsule_model_id,
      modality: entry.modality,
      provider: alt.provider,
      provider_model_id: alt.provider_model_id,
      execution_route: alt.execution_route,
      execution_route_version: alt.execution_route_version,
      pricing_policy_version: entry.pricing_policy_version,
      verification_status: alt.verification_status,
      credit_estimate_policy: entry.credit_estimate_policy,
      required_inputs: entry.required_inputs,
      optional_inputs: entry.optional_inputs,
    };
  }

  const err = new Error(
    `Provider "${targetProvider}" is not a verified route for release model "${modelId}" (primary: ${entry.primary_provider})`
  );
  err.code = 'UNSUPPORTED_PROVIDER_FOR_MODEL';
  err.status = 400;
  err.statusCode = 400;
  throw err;
}

export function getCascadeRoutesForModel(modelId, modality) {
  const entry = getSupportedReleaseModel(modelId);
  if (!entry) return [];
  const order = entry.cascade_order || [
    entry.primary_provider,
    ...Object.keys(entry.alternative_providers || {}),
  ];
  const routes = [];
  for (const provider of order) {
    try {
      const resolved = resolveReleaseRoute(modelId, modality, provider);
      if (
        resolved &&
        (resolved.verification_status === 'contract_tested' ||
          resolved.verification_status === 'live_verified')
      ) {
        routes.push(resolved);
      }
    } catch {
      // skip unresolvable or disabled routes
    }
  }
  return routes;
}
