import { redactProviderDetails, redactStringSecrets } from './redact.js';

export function getFalBaseUrl() {
  return (process.env.TIMECAPSULE_FAL_BASE_URL || 'https://queue.fal.run').replace(/\/+$/, '');
}

export function getFalApiKey() {
  const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : null;
}

export function isFalConfigured() {
  return Boolean(getFalApiKey());
}

/**
 * Builds the Fal queue endpoint and payload for a job.
 */
export function buildFalSubmissionPayload(job) {
  const inputs = job.inputs || {};
  const endpoint = String(job.resolved_provider_model || job.model || 'fal-ai/flux/dev').trim();
  if (!endpoint) {
    const err = new Error('Fal endpoint model identifier is required');
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

  const aspectRatio = String(inputs.aspect_ratio || '1:1').trim();
  let imageSize = 'square_hd';
  if (aspectRatio === '16:9') imageSize = 'landscape_16_9';
  else if (aspectRatio === '9:16') imageSize = 'portrait_16_9';
  else if (aspectRatio === '4:3') imageSize = 'landscape_4_3';
  else if (aspectRatio === '3:4') imageSize = 'portrait_4_3';

  if (job.modality === 'image') {
    const payload = {
      prompt: String(inputs.prompt || '').trim(),
      image_size: imageSize,
      num_images: 1,
      enable_safety_checker: true,
    };
    if (inputs.seed !== undefined && inputs.seed !== null) {
      payload.seed = Number(inputs.seed);
    }
    return { endpoint, payload };
  }

  if (job.modality === 'i2i') {
    if (!urls.length) {
      const err = new Error('Fal image-to-image workflow requires an input image URL');
      err.code = 'MISSING_INPUT_IMAGE';
      err.statusCode = 400;
      err.deterministicFailure = true;
      throw err;
    }
    const payload = {
      prompt: String(inputs.prompt || '').trim(),
      image_url: urls[0],
      image_size: imageSize,
    };
    return { endpoint, payload };
  }

  if (job.modality === 'video' || job.modality === 'i2v') {
    const payload = {
      prompt: String(inputs.prompt || '').trim(),
      aspect_ratio: aspectRatio,
      duration: Number(inputs.duration_seconds || inputs.duration || 5),
    };
    if (urls.length > 0) {
      payload.image_url = urls[0];
    }
    return { endpoint, payload };
  }

  return {
    endpoint,
    payload: {
      prompt: String(inputs.prompt || '').trim(),
      ...inputs,
    },
  };
}

/**
 * Submits a task to Fal Queue (`POST https://queue.fal.run/{endpoint}`).
 */
export async function submitFalTask(job, options = {}) {
  const apiKey = getFalApiKey();
  if (!apiKey) {
    const err = new Error('Server FAL_KEY is not configured');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.status = 503;
    err.statusCode = 503;
    throw err;
  }

  const { endpoint, payload } = buildFalSubmissionPayload(job);
  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseUrl = getFalBaseUrl();
  const submitUrl = `${baseUrl}/${endpoint.replace(/^\/+/, '')}`;

  const timeoutMs = Number(process.env.TIMECAPSULE_PROVIDER_TIMEOUT_MS || 20000);
  let res;
  try {
    res = await fetchFn(submitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (networkErr) {
    const isPreConnectRefusal = networkErr.code === 'ECONNREFUSED';
    const err = new Error(
      `Fal submission transport error: ${redactStringSecrets(networkErr.message || 'network failure')}`
    );
    err.code = networkErr.code || 'FAL_SUBMISSION_TRANSPORT_ERROR';
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
      redactStringSecrets(parsed?.detail || parsed?.message || `Fal authentication failed (${res.status})`)
    );
    err.code = 'FAL_AUTH_ERROR';
    err.statusCode = res.status;
    err.deterministicFailure = true;
    throw err;
  }

  if (res.status === 429 || res.status === 503) {
    const err = new Error(
      redactStringSecrets(parsed?.detail || parsed?.message || `Fal rate limited or unavailable (${res.status})`)
    );
    err.code = res.status === 429 ? 'FAL_RATE_LIMITED' : 'FAL_UNAVAILABLE';
    err.statusCode = res.status;
    err.retryableSubmission = true;
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(
      redactStringSecrets(parsed?.detail || parsed?.message || `Fal returned HTTP ${res.status}`)
    );
    err.code = 'FAL_SUBMISSION_FAILED';
    err.statusCode = res.status;
    throw err;
  }

  const requestId = parsed?.request_id || parsed?.id;
  if (!requestId) {
    const err = new Error('Fal accepted request but returned no request_id');
    err.code = 'FAL_MALFORMED_RESPONSE';
    err.statusCode = 502;
    throw err;
  }

  return {
    providerJobId: String(requestId),
    immediateCompletion: null,
    providerDetails: redactProviderDetails({
      adapter: 'fal',
      endpoint,
      request_id: requestId,
    }),
  };
}

/**
 * Polls status of a submitted Fal task.
 */
export async function pollFalTaskStatus(job, options = {}) {
  const apiKey = getFalApiKey();
  if (!apiKey) {
    const err = new Error('Server FAL_KEY is not configured');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.statusCode = 503;
    throw err;
  }

  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseUrl = getFalBaseUrl();
  const endpoint = String(job.resolved_provider_model || job.model || 'fal-ai/flux/dev').trim();
  const statusUrl = `${baseUrl}/${endpoint.replace(/^\/+/, '')}/requests/${job.provider_job_id}/status`;

  let res;
  try {
    res = await fetchFn(statusUrl, {
      method: 'GET',
      headers: {
        Authorization: `Key ${apiKey}`,
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (networkErr) {
    const err = new Error(
      `Fal poll network error: ${redactStringSecrets(networkErr.message || 'network failure')}`
    );
    err.code = 'FAL_POLL_NETWORK_ERROR';
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
      redactStringSecrets(parsed?.detail || parsed?.message || `Fal status poll failed with HTTP ${res.status}`)
    );
    err.code = 'FAL_POLL_FAILED';
    err.statusCode = res.status;
    err.retryablePoll = res.status === 429 || res.status >= 500;
    throw err;
  }

  const state = String(parsed?.status || '').toUpperCase();
  if (state === 'IN_QUEUE' || state === 'IN_PROGRESS') {
    return {
      status: 'running',
      progress: state === 'IN_PROGRESS' ? 0.6 : 0.2,
      stage: state === 'IN_PROGRESS' ? 'processing' : 'in_queue',
      providerDetails: redactProviderDetails({ status: state }),
    };
  }

  if (state === 'COMPLETED') {
    // Fetch final result
    const resultUrl = `${baseUrl}/${endpoint.replace(/^\/+/, '')}/requests/${job.provider_job_id}`;
    const resultRes = await fetchFn(resultUrl, {
      method: 'GET',
      headers: {
        Authorization: `Key ${apiKey}`,
      },
      signal: AbortSignal.timeout(15000),
    });

    const resultParsed = await resultRes.json().catch(() => ({}));
    const images = Array.isArray(resultParsed?.images) ? resultParsed.images : [];
    const sourceUrl =
      images[0]?.url ||
      resultParsed?.video?.url ||
      resultParsed?.output?.url ||
      resultParsed?.image?.url ||
      null;

    if (!sourceUrl) {
      const err = new Error('Fal task completed but returned no output media URLs');
      err.code = 'FAL_MISSING_OUTPUT_MEDIA';
      err.statusCode = 502;
      throw err;
    }

    const outputs = images.length > 0 ? images.map((img) => img.url) : [sourceUrl];

    return {
      status: 'succeeded',
      sourceUrl,
      outputs,
      providerReportedCost: null,
      providerCostUnit: 'usd',
      providerDetails: redactProviderDetails({
        status: state,
        timings: resultParsed?.timings,
      }),
    };
  }

  if (state === 'FAILED' || state === 'ERROR') {
    return {
      status: 'failed',
      error: parsed?.error || 'Fal generation failed',
      providerDetails: redactProviderDetails({ status: state, error: parsed?.error }),
    };
  }

  return {
    status: 'running',
    progress: 0.3,
    providerDetails: redactProviderDetails({ status: state }),
  };
}
