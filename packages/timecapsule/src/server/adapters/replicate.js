import { redactProviderDetails, redactStringSecrets } from './redact.js';

export function getReplicateBaseUrl() {
  return (process.env.TIMECAPSULE_REPLICATE_BASE_URL || 'https://api.replicate.com/v1').replace(/\/+$/, '');
}

export function getReplicateApiKey() {
  const key = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : null;
}

export function isReplicateConfigured() {
  return Boolean(getReplicateApiKey());
}

/**
 * Builds Replicate prediction payload for a job.
 */
export function buildReplicateSubmissionPayload(job) {
  const inputs = job.inputs || {};
  const model = String(job.resolved_provider_model || job.model || 'black-forest-labs/flux-schnell').trim();
  if (!model) {
    const err = new Error('Replicate model identifier is required');
    err.code = 'MISSING_PROVIDER_MODEL';
    err.statusCode = 400;
    err.deterministicFailure = true;
    throw err;
  }

  const urls = Array.isArray(inputs.image_urls)
    ? inputs.image_urls
    : Array.isArray(inputs.images_list)
      ? inputs.images_list
      : inputs.image_url
        ? [inputs.image_url]
        : [];

  const inputPayload = {
    prompt: String(inputs.prompt || '').trim(),
    aspect_ratio: String(inputs.aspect_ratio || '1:1').trim(),
  };

  if (job.modality === 'i2i' && urls.length > 0) {
    inputPayload.image = urls[0];
  } else if (job.modality === 'i2v' && urls.length > 0) {
    inputPayload.input_image = urls[0];
  }

  if (inputs.seed !== undefined && inputs.seed !== null) {
    inputPayload.seed = Number(inputs.seed);
  }

  return {
    model,
    payload: {
      input: inputPayload,
    },
  };
}

/**
 * Submits a prediction to Replicate (`POST https://api.replicate.com/v1/models/{model}/predictions`).
 */
export async function submitReplicateTask(job, options = {}) {
  const apiKey = getReplicateApiKey();
  if (!apiKey) {
    const err = new Error('Server REPLICATE_API_TOKEN is not configured');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.status = 503;
    err.statusCode = 503;
    throw err;
  }

  const { model, payload } = buildReplicateSubmissionPayload(job);
  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseUrl = getReplicateBaseUrl();
  const submitUrl = model.includes('/')
    ? `${baseUrl}/models/${model}/predictions`
    : `${baseUrl}/predictions`;

  const timeoutMs = Number(process.env.TIMECAPSULE_PROVIDER_TIMEOUT_MS || 20000);
  let res;
  try {
    res = await fetchFn(submitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (networkErr) {
    const isPreConnectRefusal = networkErr.code === 'ECONNREFUSED';
    const err = new Error(
      `Replicate submission transport error: ${redactStringSecrets(networkErr.message || 'network failure')}`
    );
    err.code = networkErr.code || 'REPLICATE_SUBMISSION_TRANSPORT_ERROR';
    err.retryableSubmission = isPreConnectRefusal;
    err.ambiguousSubmission = !isPreConnectRefusal;
    throw err;
  }

  const rawText = await res.text().catch(() => '');
  let parsed = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // ignore
    }
  }

  if (res.status === 401 || res.status === 403) {
    const err = new Error(
      redactStringSecrets(parsed?.detail || parsed?.title || `Replicate authentication failed (${res.status})`)
    );
    err.code = 'REPLICATE_AUTH_ERROR';
    err.statusCode = res.status;
    err.deterministicFailure = true;
    throw err;
  }

  if (res.status === 429 || res.status === 503) {
    const err = new Error(
      redactStringSecrets(parsed?.detail || parsed?.title || `Replicate rate limited or unavailable (${res.status})`)
    );
    err.code = res.status === 429 ? 'REPLICATE_RATE_LIMITED' : 'REPLICATE_UNAVAILABLE';
    err.statusCode = res.status;
    err.retryableSubmission = true;
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(
      redactStringSecrets(parsed?.detail || parsed?.title || `Replicate returned HTTP ${res.status}`)
    );
    err.code = 'REPLICATE_SUBMISSION_FAILED';
    err.statusCode = res.status;
    throw err;
  }

  const predictionId = parsed?.id;
  if (!predictionId) {
    const err = new Error('Replicate accepted request but returned no prediction id');
    err.code = 'REPLICATE_MALFORMED_RESPONSE';
    err.statusCode = 502;
    throw err;
  }

  return {
    providerJobId: String(predictionId),
    immediateCompletion: null,
    providerDetails: redactProviderDetails({
      adapter: 'replicate',
      model,
      prediction_id: predictionId,
    }),
  };
}

/**
 * Polls status of a submitted Replicate prediction (`GET https://api.replicate.com/v1/predictions/{id}`).
 */
export async function pollReplicateTaskStatus(job, options = {}) {
  const apiKey = getReplicateApiKey();
  if (!apiKey) {
    const err = new Error('Server REPLICATE_API_TOKEN is not configured');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.statusCode = 503;
    throw err;
  }

  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseUrl = getReplicateBaseUrl();
  const pollUrl = `${baseUrl}/predictions/${job.provider_job_id}`;

  let res;
  try {
    res = await fetchFn(pollUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (networkErr) {
    const err = new Error(
      `Replicate poll network error: ${redactStringSecrets(networkErr.message || 'network failure')}`
    );
    err.code = 'REPLICATE_POLL_NETWORK_ERROR';
    err.retryablePoll = true;
    throw err;
  }

  const rawText = await res.text().catch(() => '');
  let parsed = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    const err = new Error(
      redactStringSecrets(parsed?.detail || parsed?.title || `Replicate status poll failed with HTTP ${res.status}`)
    );
    err.code = 'REPLICATE_POLL_FAILED';
    err.statusCode = res.status;
    err.retryablePoll = res.status === 429 || res.status >= 500;
    throw err;
  }

  const state = String(parsed?.status || '').toLowerCase();
  if (state === 'starting' || state === 'processing') {
    return {
      status: 'running',
      progress: state === 'processing' ? 0.6 : 0.2,
      stage: state,
      providerDetails: redactProviderDetails({ status: state }),
    };
  }

  if (state === 'succeeded') {
    let sourceUrl = null;
    let outputs = [];

    if (Array.isArray(parsed?.output)) {
      outputs = parsed.output.filter((u) => typeof u === 'string' && u.trim());
      sourceUrl = outputs[0] || null;
    } else if (typeof parsed?.output === 'string') {
      sourceUrl = parsed.output;
      outputs = [sourceUrl];
    }

    if (!sourceUrl) {
      const err = new Error('Replicate prediction succeeded but returned no output media URLs');
      err.code = 'REPLICATE_MISSING_OUTPUT_MEDIA';
      err.statusCode = 502;
      throw err;
    }

    return {
      status: 'succeeded',
      sourceUrl,
      outputs,
      providerReportedCost: null,
      providerCostUnit: 'usd',
      providerDetails: redactProviderDetails({
        status: state,
        metrics: parsed?.metrics,
      }),
    };
  }

  if (state === 'failed' || state === 'canceled') {
    return {
      status: 'failed',
      error: parsed?.error || `Replicate prediction ${state}`,
      providerDetails: redactProviderDetails({ status: state, error: parsed?.error }),
    };
  }

  return {
    status: 'running',
    progress: 0.3,
    providerDetails: redactProviderDetails({ status: state }),
  };
}
