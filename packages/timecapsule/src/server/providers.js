import {
  getProviderForModel,
  getUnconfiguredNativeModelById,
  getSupportedReleaseModel,
  resolveReleaseRoute,
  getInheritedUpstreamModelById,
  PRICING_POLICY_VERSION,
  EXECUTION_ROUTE_VERSION,
} from '../models/index.js';
import {
  getMuapiBaseV1Url,
  isMuapiConfigured,
  buildMuapiSubmissionPayload,
  submitMuapiTask,
  pollMuapiTaskStatus,
} from './adapters/muapi.js';
import {
  getKieServerBaseUrl,
  getKieUploadBaseUrl,
  isKieConfigured,
  buildKieTaskPayload,
  submitKieTask,
  pollKieTaskStatus,
} from './adapters/kie.js';
import {
  isFalConfigured,
  submitFalTask,
  pollFalTaskStatus,
} from './adapters/fal.js';
import {
  isReplicateConfigured,
  submitReplicateTask,
  pollReplicateTaskStatus,
} from './adapters/replicate.js';

export {
  getMuapiBaseV1Url,
  isMuapiConfigured,
  buildMuapiSubmissionPayload,
  getKieServerBaseUrl,
  getKieUploadBaseUrl,
  isKieConfigured,
  buildKieTaskPayload,
  isFalConfigured,
  isReplicateConfigured,
};

const customAdapters = new Map();

export function isTestAdapterAllowed() {
  return process.env.NODE_ENV !== 'production' && process.env.TIMECAPSULE_TEST_MODE === '1';
}

export function registerProviderAdapter(providerName, adapter) {
  if (process.env.NODE_ENV === 'production') {
    const err = new Error(
      'Test provider adapters are strictly forbidden when NODE_ENV=production, even if TIMECAPSULE_TEST_MODE=1'
    );
    err.code = 'TEST_MODE_FORBIDDEN_IN_PRODUCTION';
    err.status = 403;
    err.statusCode = 403;
    throw err;
  }
  if (process.env.TIMECAPSULE_TEST_MODE !== '1') {
    const err = new Error(
      'Custom provider adapters may only be registered when TIMECAPSULE_TEST_MODE=1 in non-production environments'
    );
    err.code = 'TEST_MODE_REQUIRED';
    err.status = 403;
    err.statusCode = 403;
    throw err;
  }
  customAdapters.set(providerName, adapter);
}

export function resetProviderAdapters() {
  customAdapters.clear();
}

export function hasTestProviderAdapter(providerName) {
  return isTestAdapterAllowed() && customAdapters.has(providerName);
}

/**
 * Selects the target provider for a new job.
 * - Uses explicit `preferredProvider` when requested by the caller.
 * - Uses `TIMECAPSULE_DEFAULT_PROVIDER` only when explicitly configured on the server and
 *   supported by the release model's verified routes.
 * - Defaults to the release model's `primary_provider` (`muapi` for the 4 core workflows).
 * - Never silently falls back from Muapi to Kie or from Kie to Muapi based on which API key is set.
 */
export function selectProviderForJob({ model, preferredProvider }) {
  if (preferredProvider && typeof preferredProvider === 'string' && preferredProvider.trim()) {
    return preferredProvider.trim().toLowerCase();
  }
  if (String(model || '').startsWith('timecapsule.')) {
    return 'timecapsule-gpu';
  }
  const explicitDefault = process.env.TIMECAPSULE_DEFAULT_PROVIDER;
  if (explicitDefault && typeof explicitDefault === 'string' && explicitDefault.trim()) {
    const candidate = explicitDefault.trim().toLowerCase();
    const releaseModel = getSupportedReleaseModel(model);
    if (
      releaseModel &&
      (releaseModel.primary_provider === candidate ||
        Boolean(releaseModel.alternative_providers?.[candidate]))
    ) {
      return candidate;
    }
  }
  const detected = getProviderForModel(model);
  if (detected) return detected;
  return 'muapi';
}

function validateRequiredInputsForReleaseRoute(route, inputs = {}) {
  const required = route.required_inputs || [];
  if (required.includes('image_urls')) {
    const urls = Array.isArray(inputs.image_urls)
      ? inputs.image_urls
      : Array.isArray(inputs.images_list)
        ? inputs.images_list
        : inputs.image_url
          ? [inputs.image_url]
          : [];
    const validUrls = urls.filter((u) => typeof u === 'string' && u.trim().length > 0);
    if (validUrls.length === 0) {
      const err = new Error(
        `Model "${route.timecapsule_model_id}" (${route.modality}) requires at least one input image URL in inputs.image_urls or inputs.image_url`
      );
      err.code = 'MISSING_REQUIRED_INPUT_IMAGE';
      err.status = 400;
      err.statusCode = 400;
      throw err;
    }
  }
}

export function assertProviderReadyForJob({ model, modality, provider, inputs = {} }) {
  if (!model || typeof model !== 'string' || !model.trim()) {
    const err = new Error('model is required');
    err.code = 'MISSING_MODEL';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  // Self-hosted GPU models are disabled unless an explicit test adapter is registered in non-prod test mode.
  // Presence of TIMECAPSULE_GPU_WORKER_URL alone is NOT sufficient to mark a worker verified.
  const unconfiguredNative = getUnconfiguredNativeModelById(model);
  if (
    unconfiguredNative ||
    String(model).startsWith('timecapsule.') ||
    provider === 'timecapsule-gpu'
  ) {
    if (hasTestProviderAdapter('timecapsule-gpu')) {
      return {
        provider: 'timecapsule-gpu',
        resolvedModel: model,
        executionRoute: `timecapsule-gpu:test/v1:${model}`,
        executionRouteVersion: EXECUTION_ROUTE_VERSION,
        pricingPolicyVersion: PRICING_POLICY_VERSION,
        verificationStatus: 'contract_tested',
        isTestSimulation: true,
      };
    }
    const err = new Error(
      `Model "${model}" is not available: self-hosted GPU worker is not verified (presence of TIMECAPSULE_GPU_WORKER_URL alone does not enable execution).`
    );
    err.code = 'MODEL_WORKER_NOT_VERIFIED';
    err.status = 503;
    err.statusCode = 503;
    throw err;
  }

  // Check if the model is in the Checkpoint 3A Supported Release Catalog
  const releaseModel = getSupportedReleaseModel(model);
  if (!releaseModel) {
    const inherited = getInheritedUpstreamModelById(model);
    if (inherited) {
      if (String(model).startsWith('veo3')) {
        const err = new Error(
          `Model "${model}" has verification_status="${inherited.verification_status}" and is not enabled in the supported release catalog (use verified route "veo3.1-fast-text-to-video" or "veo3.1-fast-image-to-video").`
        );
        err.code = 'MANAGED_VEO_CONTRACT_UNVERIFIED';
        err.verificationStatus = inherited.verification_status;
        err.status = 501;
        err.statusCode = 501;
        throw err;
      }
      const err = new Error(
        `Model "${model}" has verification_status="${inherited.verification_status}" and is not enabled for managed execution in the Checkpoint 3A release catalog.`
      );
      err.code =
        inherited.verification_status === 'disabled'
          ? 'MODEL_DISABLED'
          : 'MODEL_NOT_IN_RELEASE_CATALOG';
      err.verificationStatus = inherited.verification_status;
      err.status = 400;
      err.statusCode = 400;
      throw err;
    }

    const err = new Error(
      `Unsupported or unmapped model "${model}" for modality "${modality}". Silent default model substitution is disabled.`
    );
    err.code = 'UNSUPPORTED_MODEL';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  const route = resolveReleaseRoute(model, modality, provider);
  if (
    route.verification_status !== 'contract_tested' &&
    route.verification_status !== 'live_verified'
  ) {
    const err = new Error(
      `Model "${model}" on provider "${route.provider}" has verification_status="${route.verification_status}" and cannot be executed.`
    );
    err.code = 'MODEL_ROUTE_NOT_VERIFIED';
    err.status = 501;
    err.statusCode = 501;
    throw err;
  }

  validateRequiredInputsForReleaseRoute(route, inputs);

  if (route.provider === 'muapi') {
    if (hasTestProviderAdapter('muapi')) {
      return {
        provider: 'muapi',
        resolvedModel: route.provider_model_id,
        executionRoute: route.execution_route,
        executionRouteVersion: route.execution_route_version,
        pricingPolicyVersion: route.pricing_policy_version,
        verificationStatus: route.verification_status,
        isTestSimulation: true,
      };
    }

    if (!isMuapiConfigured()) {
      const err = new Error(
        'Provider credentials (MUAPI_API_KEY) are not configured on the server; refusing to reserve credits or dispatch job. Silent fallback to Kie is disabled.'
      );
      err.code = 'PROVIDER_CREDENTIALS_MISSING';
      err.status = 503;
      err.statusCode = 503;
      throw err;
    }

    return {
      provider: 'muapi',
      resolvedModel: route.provider_model_id,
      executionRoute: route.execution_route,
      executionRouteVersion: route.execution_route_version,
      pricingPolicyVersion: route.pricing_policy_version,
      verificationStatus: route.verification_status,
      isTestSimulation: false,
    };
  }

  if (route.provider === 'kie') {
    if (hasTestProviderAdapter('kie')) {
      return {
        provider: 'kie',
        resolvedModel: route.provider_model_id,
        executionRoute: route.execution_route,
        executionRouteVersion: route.execution_route_version,
        pricingPolicyVersion: route.pricing_policy_version,
        verificationStatus: route.verification_status,
        isTestSimulation: true,
      };
    }

    if (!isKieConfigured()) {
      const err = new Error(
        'Provider credentials (KIE_API_KEY) are not configured on the server; refusing to reserve credits or dispatch job. Silent fallback to Muapi is disabled.'
      );
      err.code = 'PROVIDER_CREDENTIALS_MISSING';
      err.status = 503;
      err.statusCode = 503;
      throw err;
    }

    return {
      provider: 'kie',
      resolvedModel: route.provider_model_id,
      executionRoute: route.execution_route,
      executionRouteVersion: route.execution_route_version,
      pricingPolicyVersion: route.pricing_policy_version,
      verificationStatus: route.verification_status,
      isTestSimulation: false,
    };
  }

  if (route.provider === 'fal') {
    if (hasTestProviderAdapter('fal')) {
      return {
        provider: 'fal',
        resolvedModel: route.provider_model_id,
        executionRoute: route.execution_route,
        executionRouteVersion: route.execution_route_version,
        pricingPolicyVersion: route.pricing_policy_version,
        verificationStatus: route.verification_status,
        isTestSimulation: true,
      };
    }

    if (!isFalConfigured()) {
      const err = new Error(
        'Provider credentials (FAL_KEY) are not configured on the server; refusing to reserve credits or dispatch job.'
      );
      err.code = 'PROVIDER_CREDENTIALS_MISSING';
      err.status = 503;
      err.statusCode = 503;
      throw err;
    }

    return {
      provider: 'fal',
      resolvedModel: route.provider_model_id,
      executionRoute: route.execution_route,
      executionRouteVersion: route.execution_route_version,
      pricingPolicyVersion: route.pricing_policy_version,
      verificationStatus: route.verification_status,
      isTestSimulation: false,
    };
  }

  if (route.provider === 'replicate') {
    if (hasTestProviderAdapter('replicate')) {
      return {
        provider: 'replicate',
        resolvedModel: route.provider_model_id,
        executionRoute: route.execution_route,
        executionRouteVersion: route.execution_route_version,
        pricingPolicyVersion: route.pricing_policy_version,
        verificationStatus: route.verification_status,
        isTestSimulation: true,
      };
    }

    if (!isReplicateConfigured()) {
      const err = new Error(
        'Provider credentials (REPLICATE_API_TOKEN) are not configured on the server; refusing to reserve credits or dispatch job.'
      );
      err.code = 'PROVIDER_CREDENTIALS_MISSING';
      err.status = 503;
      err.statusCode = 503;
      throw err;
    }

    return {
      provider: 'replicate',
      resolvedModel: route.provider_model_id,
      executionRoute: route.execution_route,
      executionRouteVersion: route.execution_route_version,
      pricingPolicyVersion: route.pricing_policy_version,
      verificationStatus: route.verification_status,
      isTestSimulation: false,
    };
  }

  if (hasTestProviderAdapter(route.provider)) {
    return {
      provider: route.provider,
      resolvedModel: route.provider_model_id,
      executionRoute: route.execution_route,
      executionRouteVersion: route.execution_route_version,
      pricingPolicyVersion: route.pricing_policy_version,
      verificationStatus: route.verification_status,
      isTestSimulation: true,
    };
  }

  const err = new Error(
    `Provider "${route.provider}" is not supported or configured for model "${model}"`
  );
  err.code = 'UNSUPPORTED_PROVIDER';
  err.status = 400;
  err.statusCode = 400;
  throw err;
}

/**
 * Step 1 of durable worker execution: submits the task to the provider recorded on the job
 * (`job.provider`) and returns `providerJobId` immediately so the worker can persist it before polling.
 */
export async function submitTaskToProvider(job, options = {}) {
  if (hasTestProviderAdapter(job.provider)) {
    const custom = customAdapters.get(job.provider);
    if (typeof custom === 'function') {
      const res = await custom(job, {
        ...options,
        onProgress: options.onProgress || (() => {}),
      });
      return {
        providerJobId: res.providerJobId || `test_${job.job_id}`,
        immediateCompletion: res.sourceUrl
          ? {
              sourceUrl: res.sourceUrl,
              userBilledCredits: res.userBilledCredits ?? null,
              providerReportedCost: res.providerReportedCost ?? null,
              providerCostUnit: res.providerCostUnit ?? null,
            }
          : null,
        providerDetails: res.providerDetails || { adapter: 'test', provider: job.provider },
      };
    }
    if (custom && typeof custom.submit === 'function') {
      return custom.submit(job, options);
    }
  }

  if (job.provider === 'timecapsule-gpu') {
    const err = new Error(
      `Self-hosted GPU worker for "${job.model}" is not verified. Automatic fake GPU execution is disabled.`
    );
    err.code = 'MODEL_WORKER_NOT_VERIFIED';
    err.status = 503;
    err.statusCode = 503;
    err.deterministicFailure = true;
    throw err;
  }

  if (job.provider === 'muapi') {
    return submitMuapiTask(job, options);
  }

  if (job.provider === 'kie') {
    return submitKieTask(job, options);
  }

  if (job.provider === 'fal') {
    return submitFalTask(job, options);
  }

  if (job.provider === 'replicate') {
    return submitReplicateTask(job, options);
  }

  const err = new Error(`Unsupported job provider "${job.provider}" during task submission`);
  err.code = 'UNSUPPORTED_PROVIDER';
  err.statusCode = 400;
  err.deterministicFailure = true;
  throw err;
}

/**
 * Step 2 of durable worker execution: polls an already-persisted `provider_job_id` once
 * using the original provider adapter recorded on the job (`job.provider`).
 * Never resubmits the task and never switches providers mid-flight.
 */
export async function pollProviderTaskStatus(job, options = {}) {
  if (!job.provider_job_id) {
    const err = new Error(`Cannot poll job ${job.job_id} without a persisted provider_job_id`);
    err.code = 'MISSING_PROVIDER_JOB_ID';
    throw err;
  }

  if (hasTestProviderAdapter(job.provider)) {
    const custom = customAdapters.get(job.provider);
    if (custom && typeof custom.poll === 'function') {
      return custom.poll(job, options);
    }
  }

  if (job.provider === 'muapi') {
    return pollMuapiTaskStatus(job, options);
  }

  if (job.provider === 'kie') {
    return pollKieTaskStatus(job, options);
  }

  if (job.provider === 'fal') {
    return pollFalTaskStatus(job, options);
  }

  if (job.provider === 'replicate') {
    return pollReplicateTaskStatus(job, options);
  }

  const err = new Error(`Unsupported job provider "${job.provider}" during status polling`);
  err.code = 'UNSUPPORTED_PROVIDER';
  err.retryablePoll = false;
  throw err;
}

export async function dispatchToProvider(job, options = {}) {
  const submitted = await submitTaskToProvider(job, options);
  if (submitted.immediateCompletion) {
    return {
      providerJobId: submitted.providerJobId,
      sourceUrl: submitted.immediateCompletion.sourceUrl,
      userBilledCredits: submitted.immediateCompletion.userBilledCredits,
      providerReportedCost: submitted.immediateCompletion.providerReportedCost,
      providerCostUnit: submitted.immediateCompletion.providerCostUnit,
    };
  }
  const pollIntervalMs = Number(
    process.env.TIMECAPSULE_PROVIDER_POLL_INTERVAL_MS ||
      process.env.TIMECAPSULE_KIE_POLL_INTERVAL_MS ||
      50
  );
  const jobWithProviderId = { ...job, provider_job_id: submitted.providerJobId };
  for (let i = 0; i < 180; i++) {
    const status = await pollProviderTaskStatus(jobWithProviderId, options);
    if (status.status === 'succeeded') {
      return status;
    }
    if (status.status === 'failed') {
      throw new Error(status.error || `${job.provider} generation failed`);
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  throw new Error(`${job.provider} generation timed out`);
}
