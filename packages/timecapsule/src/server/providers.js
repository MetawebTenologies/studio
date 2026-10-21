import { resolveKieModelForModality } from '../client/index.js';
import {
  getProviderForModel,
  getUnconfiguredNativeModelById,
} from '../models/index.js';

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

export function selectProviderForJob({ model, modality, preferredProvider }) {
  if (preferredProvider && hasTestProviderAdapter(preferredProvider)) {
    return preferredProvider;
  }
  const detected = getProviderForModel(model);
  if (detected) return detected;
  return 'kie';
}

export function getKieServerBaseUrl() {
  return (process.env.TIMECAPSULE_KIE_BASE_URL || 'https://api.kie.ai').replace(/\/$/, '');
}

export function assertProviderReadyForJob({ model, modality, provider }) {
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
  if (unconfiguredNative || String(model).startsWith('timecapsule.') || provider === 'timecapsule-gpu') {
    if (hasTestProviderAdapter('timecapsule-gpu')) {
      return {
        provider: 'timecapsule-gpu',
        resolvedModel: model,
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

  if (provider === 'kie') {
    // Validate explicit model mapping first; rejects unknown/unmapped models with 400 UNSUPPORTED_MODEL.
    const resolvedModel = resolveKieModelForModality(modality, model);

    // Managed Veo routes must be rejected before credit reservation until their managed contract
    // (/api/v1/veo/generate + /api/v1/veo/record-info) is implemented and verified in Checkpoint 3.
    if (resolvedModel.startsWith('veo3') || String(model).startsWith('veo3')) {
      const err = new Error(
        `Managed BFF execution for Veo model "${model}" (${resolvedModel}) is disabled until the managed Veo provider contract is verified.`
      );
      err.code = 'MANAGED_VEO_CONTRACT_UNVERIFIED';
      err.status = 501;
      err.statusCode = 501;
      throw err;
    }

    if (hasTestProviderAdapter('kie')) {
      return {
        provider: 'kie',
        resolvedModel,
        isTestSimulation: true,
      };
    }

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      const err = new Error(
        'Provider credentials (KIE_API_KEY) are not configured on the server; refusing to reserve credits or dispatch job.'
      );
      err.code = 'PROVIDER_CREDENTIALS_MISSING';
      err.status = 503;
      err.statusCode = 503;
      throw err;
    }

    return {
      provider: 'kie',
      resolvedModel,
      isTestSimulation: false,
    };
  }

  if (hasTestProviderAdapter(provider)) {
    return {
      provider,
      resolvedModel: model,
      isTestSimulation: true,
    };
  }

  const err = new Error(`Provider "${provider}" is not supported or configured for model "${model}"`);
  err.code = 'UNSUPPORTED_PROVIDER';
  err.status = 400;
  err.statusCode = 400;
  throw err;
}

export function buildKieTaskPayload(job) {
  const inputs = job.inputs || {};
  const kieModel = job.resolved_provider_model || resolveKieModelForModality(job.modality, job.model);
  if (kieModel.startsWith('veo3')) {
    const err = new Error(`Managed Veo execution is disabled for model "${job.model}"`);
    err.code = 'MANAGED_VEO_CONTRACT_UNVERIFIED';
    err.status = 501;
    err.statusCode = 501;
    throw err;
  }

  let payloadInput = { prompt: inputs.prompt || '' };

  if (job.modality === 'image') {
    if (inputs.aspect_ratio) payloadInput.aspect_ratio = inputs.aspect_ratio;
    if (kieModel.startsWith('nano-banana')) {
      payloadInput.resolution = String(inputs.resolution || '1K').toUpperCase();
      payloadInput.output_format = 'png';
      if (inputs.image_urls?.length) payloadInput.image_input = inputs.image_urls;
    }
  } else if (job.modality === 'i2i') {
    const urls = inputs.image_urls || (inputs.image_url ? [inputs.image_url] : []);
    payloadInput = {
      prompt: inputs.prompt || '',
      image_input: urls,
      image_urls: urls,
      image_url: urls[0],
      aspect_ratio: inputs.aspect_ratio || '1:1',
    };
  } else if (job.modality === 'video') {
    if (inputs.aspect_ratio) payloadInput.aspect_ratio = inputs.aspect_ratio;
    if (inputs.resolution) payloadInput.resolution = inputs.resolution;
    if (inputs.duration_seconds || inputs.duration) {
      payloadInput.duration = Number(inputs.duration_seconds || inputs.duration || 5);
    }
  } else if (job.modality === 'i2v') {
    const urls = inputs.image_urls || (inputs.image_url ? [inputs.image_url] : []);
    payloadInput = {
      prompt: inputs.prompt || '',
      input_urls: urls,
      image_url: urls[0],
      aspect_ratio: inputs.aspect_ratio || '16:9',
      resolution: inputs.resolution || '720p',
      duration: Number(inputs.duration_seconds || inputs.duration || 5),
    };
  } else if (job.modality === 'lipsync') {
    payloadInput = {
      image_url: inputs.image_url,
      video_url: inputs.video_url,
      audio_url: inputs.audio_url,
    };
  } else {
    const err = new Error(`Unsupported modality "${job.modality}" for Kie adapter`);
    err.code = 'INVALID_MODALITY';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  return { kieModel, payloadInput };
}

/**
 * Step 1 of durable worker execution: submits the task to the provider and returns
 * the providerJobId immediately so the worker can persist it before polling.
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
              actualCredits: res.actualCredits ?? job.estimated_cost,
            }
          : null,
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

  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const err = new Error('Server KIE_API_KEY is not configured');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.status = 503;
    err.statusCode = 503;
    throw err;
  }

  const { kieModel, payloadInput } = buildKieTaskPayload(job);
  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseUrl = getKieServerBaseUrl();

  let createRes;
  try {
    createRes = await fetchFn(`${baseUrl}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(job.submission_attempt_id
          ? { 'X-Submission-Attempt-Id': job.submission_attempt_id }
          : {}),
      },
      body: JSON.stringify({ model: kieModel, input: payloadInput }),
    });
  } catch (networkErr) {
    // A transport error during or after POST transmission leaves provider acceptance ambiguous
    // unless explicitly marked as a pre-send connection refusal in controlled environments.
    const err = new Error(`Provider submission transport error: ${networkErr.message}`);
    err.code = networkErr.code || 'PROVIDER_SUBMISSION_TRANSPORT_ERROR';
    err.ambiguousSubmission = networkErr.code !== 'ECONNREFUSED';
    err.retryableSubmission = networkErr.code === 'ECONNREFUSED';
    throw err;
  }

  const createData = await createRes.json().catch(() => ({}));

  if (createRes.status >= 500 || createRes.status === 408 || createRes.status === 429) {
    const err = new Error(
      createData.msg || createData.error || `Kie.ai HTTP ${createRes.status} during submission`
    );
    err.statusCode = createRes.status;
    // 429 rate-limit before task creation is retryable; 502/504 gateway timeouts are ambiguous
    err.retryableSubmission = createRes.status === 429 || createRes.status === 503;
    err.ambiguousSubmission = createRes.status === 502 || createRes.status === 504 || createRes.status === 408;
    throw err;
  }

  if (!createRes.ok || (createData.code && createData.code !== 200)) {
    const err = new Error(
      createData.msg || createData.error || `Kie.ai rejected task submission (HTTP ${createRes.status})`
    );
    err.statusCode = createRes.status || 400;
    err.deterministicFailure = true;
    throw err;
  }

  const taskId = createData.data?.taskId;
  if (!taskId) {
    const err = new Error('Kie.ai response reached 200 OK without a taskId; submission outcome is ambiguous');
    err.code = 'AMBIGUOUS_PROVIDER_RESPONSE';
    err.ambiguousSubmission = true;
    throw err;
  }

  return {
    providerJobId: String(taskId),
    immediateCompletion: null,
  };
}

/**
 * Step 2 of durable worker execution: polls an already-persisted provider_job_id once.
 * Never resubmits the task.
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

  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const err = new Error('Server KIE_API_KEY is not configured for status polling');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.retryablePoll = true;
    throw err;
  }

  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseUrl = getKieServerBaseUrl();

  const pollRes = await fetchFn(
    `${baseUrl}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(job.provider_job_id)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  if (!pollRes.ok) {
    const err = new Error(`Kie.ai recordInfo HTTP ${pollRes.status}`);
    err.statusCode = pollRes.status;
    err.retryablePoll = pollRes.status >= 500 || pollRes.status === 429 || pollRes.status === 408;
    throw err;
  }

  const pollData = await pollRes.json().catch(() => ({}));
  const d = pollData.data || {};

  if (d.state === 'success') {
    let urls = [];
    try {
      urls = JSON.parse(d.resultJson || '{}').resultUrls || [];
    } catch {
      urls = [];
    }
    if (!urls.length) {
      const err = new Error('Kie.ai task succeeded without output URL');
      err.deterministicFailure = true;
      throw err;
    }
    return {
      status: 'succeeded',
      providerJobId: job.provider_job_id,
      sourceUrl: urls[0],
      actualCredits:
        d.creditsConsumed !== undefined && Number.isFinite(Number(d.creditsConsumed))
          ? Number(d.creditsConsumed)
          : job.estimated_cost,
    };
  }

  if (d.state === 'fail') {
    return {
      status: 'failed',
      providerJobId: job.provider_job_id,
      error: d.failMsg || 'Kie.ai generation failed',
    };
  }

  return {
    status: 'running',
    providerJobId: job.provider_job_id,
    stage: d.state || 'generating',
    progress: typeof d.progress === 'number' ? d.progress : null,
  };
}

export async function dispatchToProvider(job, options = {}) {
  const submitted = await submitTaskToProvider(job, options);
  if (submitted.immediateCompletion) {
    return {
      providerJobId: submitted.providerJobId,
      sourceUrl: submitted.immediateCompletion.sourceUrl,
      actualCredits: submitted.immediateCompletion.actualCredits,
    };
  }
  const pollIntervalMs = Number(process.env.TIMECAPSULE_KIE_POLL_INTERVAL_MS || 50);
  const jobWithProviderId = { ...job, provider_job_id: submitted.providerJobId };
  for (let i = 0; i < 180; i++) {
    const status = await pollProviderTaskStatus(jobWithProviderId, options);
    if (status.status === 'succeeded') {
      return status;
    }
    if (status.status === 'failed') {
      throw new Error(status.error || 'Kie.ai generation failed');
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  throw new Error('Kie.ai generation timed out');
}
