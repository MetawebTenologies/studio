import { redactProviderDetails, redactStringSecrets } from './redact.js';

export function getMuapiBaseV1Url() {
  const raw = (process.env.TIMECAPSULE_MUAPI_BASE_URL || 'https://api.muapi.ai').replace(/\/+$/, '');
  if (raw.endsWith('/api/v1')) {
    return raw;
  }
  return `${raw}/api/v1`;
}

export function getMuapiApiKey() {
  const key = process.env.MUAPI_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : null;
}

export function isMuapiConfigured() {
  return Boolean(getMuapiApiKey());
}

/**
 * Builds the verified Muapi request endpoint and JSON body for a job.
 */
export function buildMuapiSubmissionPayload(job) {
  const inputs = job.inputs || {};
  const endpoint = String(job.resolved_provider_model || job.model || '').trim();
  if (!endpoint) {
    const err = new Error('Muapi endpoint model identifier is required');
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

  if (job.modality === 'image') {
    const payload = {
      prompt: String(inputs.prompt || '').trim(),
      aspect_ratio: String(inputs.aspect_ratio || '1:1').trim(),
      resolution: String(inputs.resolution || '1k').trim().toLowerCase(),
    };
    if (inputs.seed !== undefined && inputs.seed !== null) {
      payload.seed = Number(inputs.seed);
    }
    return { endpoint, payload };
  }

  if (job.modality === 'i2i') {
    if (!urls.length) {
      const err = new Error('Muapi image-to-image workflow requires at least one input image URL');
      err.code = 'MISSING_INPUT_IMAGE';
      err.statusCode = 400;
      err.deterministicFailure = true;
      throw err;
    }
    const payload = {
      prompt: String(inputs.prompt || '').trim(),
      images_list: urls,
      aspect_ratio: String(inputs.aspect_ratio || '1:1').trim(),
      resolution: String(inputs.resolution || '1k').trim().toLowerCase(),
    };
    return { endpoint, payload };
  }

  if (job.modality === 'video') {
    const resStr = String(inputs.resolution || '720p').trim().toLowerCase();
    const payload = {
      prompt: String(inputs.prompt || '').trim(),
      aspect_ratio: String(inputs.aspect_ratio || '16:9').trim(),
      resolution: resStr,
      quality: resStr === '1080p' ? 'high' : 'medium',
      duration: Number(inputs.duration_seconds || inputs.duration || 5),
    };
    if (inputs.negative_prompt) {
      payload.negative_prompt = String(inputs.negative_prompt).trim();
    }
    return { endpoint, payload };
  }

  if (job.modality === 'i2v') {
    if (!urls.length) {
      const err = new Error('Muapi image-to-video workflow requires an input image URL');
      err.code = 'MISSING_INPUT_IMAGE';
      err.statusCode = 400;
      err.deterministicFailure = true;
      throw err;
    }
    const resStr = String(inputs.resolution || '720p').trim().toLowerCase();
    const payload = {
      prompt: String(inputs.prompt || '').trim(),
      image_url: urls[0],
      images_list: urls,
      aspect_ratio: String(inputs.aspect_ratio || '16:9').trim(),
      resolution: resStr,
      quality: resStr === '1080p' ? 'high' : 'medium',
      duration: Number(inputs.duration_seconds || inputs.duration || 5),
    };
    return { endpoint, payload };
  }

  const err = new Error(`Unsupported modality "${job.modality}" for Muapi adapter`);
  err.code = 'INVALID_MODALITY';
  err.statusCode = 400;
  err.deterministicFailure = true;
  throw err;
}

function extractMuapiCostMetadata(resHeaders, bodyData) {
  const headerUsd = resHeaders?.get ? resHeaders.get('x-muapi-cost-usd') : null;
  if (headerUsd !== null && headerUsd !== undefined && headerUsd !== '' && Number.isFinite(Number(headerUsd))) {
    return {
      providerReportedCost: Number(headerUsd),
      providerCostUnit: 'muapi_usd',
    };
  }
  const costObj = bodyData?.cost ?? bodyData?.data?.cost;
  if (typeof costObj === 'number' && Number.isFinite(costObj)) {
    return {
      providerReportedCost: Number(costObj),
      providerCostUnit: 'muapi_usd',
    };
  }
  if (costObj && typeof costObj === 'object') {
    if (costObj.amount_usd !== undefined && Number.isFinite(Number(costObj.amount_usd))) {
      return {
        providerReportedCost: Number(costObj.amount_usd),
        providerCostUnit: 'muapi_usd',
      };
    }
    if (costObj.amount_credits !== undefined && Number.isFinite(Number(costObj.amount_credits))) {
      return {
        providerReportedCost: Number(costObj.amount_credits),
        providerCostUnit: 'muapi_credits',
      };
    }
  }
  if (bodyData?.credits_used !== undefined && Number.isFinite(Number(bodyData.credits_used))) {
    return {
      providerReportedCost: Number(bodyData.credits_used),
      providerCostUnit: 'muapi_credits',
    };
  }
  return {
    providerReportedCost: null,
    providerCostUnit: null,
  };
}

/**
 * Submits a generation request to Muapi (`POST /api/v1/{endpoint}`).
 */
export async function submitMuapiTask(job, options = {}) {
  const apiKey = getMuapiApiKey();
  if (!apiKey) {
    const err = new Error('Server MUAPI_API_KEY is not configured');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.status = 503;
    err.statusCode = 503;
    throw err;
  }

  const { endpoint, payload } = buildMuapiSubmissionPayload(job);
  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseV1 = getMuapiBaseV1Url();
  const submitUrl = `${baseV1}/${endpoint.replace(/^\/+/, '')}`;

  const timeoutMs = Number(process.env.TIMECAPSULE_PROVIDER_TIMEOUT_MS || 20000);
  let res;
  try {
    res = await fetchFn(submitUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        ...(job.submission_attempt_id
          ? { 'X-Submission-Attempt-Id': job.submission_attempt_id }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (networkErr) {
    const isPreConnectRefusal = networkErr.code === 'ECONNREFUSED';
    const err = new Error(
      `Muapi submission transport error: ${redactStringSecrets(networkErr.message || 'network failure')}`
    );
    err.code = networkErr.code || 'MUAPI_SUBMISSION_TRANSPORT_ERROR';
    err.retryableSubmission = isPreConnectRefusal;
    err.ambiguousSubmission = !isPreConnectRefusal;
    throw err;
  }

  const rawText = await res.text().catch(() => '');
  let parsed = null;
  let jsonParseFailed = false;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      jsonParseFailed = true;
    }
  }

  if (res.status === 401 || res.status === 403) {
    const msg =
      parsed?.error || parsed?.message || parsed?.detail || `Muapi authentication failed (HTTP ${res.status})`;
    const err = new Error(redactStringSecrets(String(msg)));
    err.code = 'MUAPI_AUTH_ERROR';
    err.statusCode = res.status;
    err.deterministicFailure = true;
    err.providerDetails = redactProviderDetails({
      http_status: res.status,
      endpoint,
      response: parsed || rawText.slice(0, 300),
    });
    throw err;
  }

  if (res.status === 429 || res.status === 503) {
    const msg =
      parsed?.error || parsed?.message || `Muapi rate limited or temporarily unavailable (HTTP ${res.status})`;
    const err = new Error(redactStringSecrets(String(msg)));
    err.code = res.status === 429 ? 'MUAPI_RATE_LIMITED' : 'MUAPI_UNAVAILABLE';
    err.statusCode = res.status;
    err.retryableSubmission = true;
    err.providerDetails = redactProviderDetails({
      http_status: res.status,
      endpoint,
      response: parsed || rawText.slice(0, 300),
    });
    throw err;
  }

  if (res.status === 408 || res.status === 502 || res.status === 504 || res.status >= 500) {
    const msg =
      parsed?.error || parsed?.message || `Muapi HTTP ${res.status} during task submission`;
    const err = new Error(redactStringSecrets(String(msg)));
    err.code = 'MUAPI_SUBMISSION_AMBIGUOUS_HTTP';
    err.statusCode = res.status;
    err.ambiguousSubmission = true;
    err.providerDetails = redactProviderDetails({
      http_status: res.status,
      endpoint,
      response: parsed || rawText.slice(0, 300),
    });
    throw err;
  }

  if (!res.ok) {
    const msg =
      parsed?.error || parsed?.message || parsed?.detail || `Muapi rejected task submission (HTTP ${res.status})`;
    const err = new Error(redactStringSecrets(String(msg)));
    err.code = 'MUAPI_SUBMISSION_REJECTED';
    err.statusCode = res.status || 400;
    err.deterministicFailure = true;
    err.providerDetails = redactProviderDetails({
      http_status: res.status,
      endpoint,
      response: parsed || rawText.slice(0, 300),
    });
    throw err;
  }

  if (jsonParseFailed || !parsed || typeof parsed !== 'object') {
    const err = new Error(
      'Muapi returned HTTP 2xx with malformed JSON during submission; task creation outcome is ambiguous'
    );
    err.code = 'AMBIGUOUS_PROVIDER_RESPONSE';
    err.ambiguousSubmission = true;
    err.providerDetails = redactProviderDetails({
      http_status: res.status,
      endpoint,
      raw_snippet: rawText.slice(0, 300),
    });
    throw err;
  }

  const requestId =
    parsed.request_id || parsed.id || parsed.data?.request_id || parsed.data?.id || null;
  if (!requestId) {
    const err = new Error(
      'Muapi returned HTTP 2xx without a request_id; submission outcome is ambiguous'
    );
    err.code = 'AMBIGUOUS_PROVIDER_RESPONSE';
    err.ambiguousSubmission = true;
    err.providerDetails = redactProviderDetails({
      http_status: res.status,
      endpoint,
      response: parsed,
    });
    throw err;
  }

  const costMeta = extractMuapiCostMetadata(res.headers, parsed);

  return {
    providerJobId: String(requestId),
    immediateCompletion: null,
    providerReportedCost: costMeta.providerReportedCost,
    providerCostUnit: costMeta.providerCostUnit,
    providerDetails: redactProviderDetails({
      adapter: 'muapi',
      endpoint,
      request_id: String(requestId),
      submit_status: parsed.status || 'processing',
      provider_reported_cost: costMeta.providerReportedCost,
      provider_cost_unit: costMeta.providerCostUnit,
    }),
  };
}

function normalizeMuapiOutputs(data) {
  const candidates =
    data?.outputs ||
    data?.data?.outputs ||
    data?.output ||
    data?.data?.output ||
    (data?.url ? [data.url] : []);

  const list = Array.isArray(candidates) ? candidates : candidates ? [candidates] : [];
  const urls = [];
  for (const item of list) {
    if (typeof item === 'string' && item.trim()) {
      urls.push(item.trim());
    } else if (item && typeof item === 'object') {
      const u = item.url || item.image_url || item.video_url || item.output_url;
      if (typeof u === 'string' && u.trim()) {
        urls.push(u.trim());
      }
    }
  }
  return urls;
}

/**
 * Polls an existing Muapi prediction (`GET /api/v1/predictions/{request_id}/result`).
 * Status-poll timeouts and transient HTTP/parse errors are ALWAYS marked `retryablePoll = true`
 * and never treated as a confirmed generation failure.
 */
export async function pollMuapiTaskStatus(job, options = {}) {
  if (!job.provider_job_id) {
    const err = new Error(`Cannot poll Muapi job ${job.job_id} without a persisted provider_job_id`);
    err.code = 'MISSING_PROVIDER_JOB_ID';
    err.retryablePoll = false;
    throw err;
  }

  const apiKey = getMuapiApiKey();
  if (!apiKey) {
    const err = new Error('Server MUAPI_API_KEY is not configured for status polling');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.retryablePoll = true;
    throw err;
  }

  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseV1 = getMuapiBaseV1Url();
  const pollUrl = `${baseV1}/predictions/${encodeURIComponent(job.provider_job_id)}/result`;

  const timeoutMs = Number(process.env.TIMECAPSULE_PROVIDER_TIMEOUT_MS || 20000);
  let res;
  try {
    res = await fetchFn(pollUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (networkErr) {
    // Poll timeout or network error MUST NOT be mistaken for a confirmed generation failure.
    const err = new Error(
      `Muapi status poll transport/timeout error: ${redactStringSecrets(networkErr.message || 'timeout')}`
    );
    err.code = networkErr.code || 'MUAPI_POLL_TIMEOUT';
    err.retryablePoll = true;
    throw err;
  }

  const rawText = await res.text().catch(() => '');
  let parsed = null;
  let jsonParseFailed = false;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      jsonParseFailed = true;
    }
  }

  if (res.status === 401 || res.status === 403) {
    const err = new Error(
      redactStringSecrets(parsed?.error || parsed?.message || `Muapi poll auth error (HTTP ${res.status})`)
    );
    err.code = 'MUAPI_AUTH_ERROR';
    err.statusCode = res.status;
    err.retryablePoll = false;
    err.providerDetails = redactProviderDetails({
      http_status: res.status,
      response: parsed || rawText.slice(0, 300),
    });
    throw err;
  }

  if (!res.ok) {
    const err = new Error(
      redactStringSecrets(parsed?.error || parsed?.message || `Muapi poll HTTP ${res.status}`)
    );
    err.code = res.status === 429 ? 'MUAPI_RATE_LIMITED' : 'MUAPI_POLL_HTTP_ERROR';
    err.statusCode = res.status;
    err.retryablePoll =
      res.status >= 500 || res.status === 429 || res.status === 408 || res.status === 404;
    err.providerDetails = redactProviderDetails({
      http_status: res.status,
      response: parsed || rawText.slice(0, 300),
    });
    throw err;
  }

  if (jsonParseFailed || !parsed || typeof parsed !== 'object') {
    const err = new Error('Muapi poll returned malformed JSON payload');
    err.code = 'MUAPI_POLL_MALFORMED_JSON';
    err.retryablePoll = true;
    err.providerDetails = redactProviderDetails({
      http_status: res.status,
      raw_snippet: rawText.slice(0, 300),
    });
    throw err;
  }

  const rawStatus = String(parsed.status || parsed.data?.status || 'processing')
    .trim()
    .toLowerCase();
  const costMeta = extractMuapiCostMetadata(res.headers, parsed);

  if (rawStatus === 'completed' || rawStatus === 'succeeded' || rawStatus === 'success') {
    const urls = normalizeMuapiOutputs(parsed);
    if (!urls.length) {
      const err = new Error('Muapi prediction completed without any output URL');
      err.code = 'MUAPI_EMPTY_OUTPUT';
      err.retryablePoll = false;
      err.deterministicFailure = true;
      err.providerDetails = redactProviderDetails({
        http_status: res.status,
        response: parsed,
      });
      throw err;
    }

    return {
      status: 'succeeded',
      providerJobId: job.provider_job_id,
      sourceUrl: urls[0],
      outputs: urls,
      providerReportedCost: costMeta.providerReportedCost,
      providerCostUnit: costMeta.providerCostUnit,
      providerDetails: redactProviderDetails({
        adapter: 'muapi',
        request_id: job.provider_job_id,
        raw_status: rawStatus,
        output_count: urls.length,
        provider_reported_cost: costMeta.providerReportedCost,
        provider_cost_unit: costMeta.providerCostUnit,
      }),
    };
  }

  if (rawStatus === 'failed' || rawStatus === 'error' || rawStatus === 'canceled' || rawStatus === 'cancelled') {
    const rawErr =
      parsed.error || parsed.data?.error || parsed.message || 'Muapi prediction failed';
    return {
      status: 'failed',
      providerJobId: job.provider_job_id,
      error: redactStringSecrets(
        typeof rawErr === 'string' ? rawErr : JSON.stringify(rawErr)
      ),
      providerDetails: redactProviderDetails({
        adapter: 'muapi',
        request_id: job.provider_job_id,
        raw_status: rawStatus,
        error: rawErr,
      }),
    };
  }

  return {
    status: 'running',
    providerJobId: job.provider_job_id,
    stage: rawStatus || 'processing',
    progress: typeof parsed.progress === 'number' ? parsed.progress : null,
    providerDetails: redactProviderDetails({
      adapter: 'muapi',
      request_id: job.provider_job_id,
      raw_status: rawStatus,
    }),
  };
}

/**
 * Uploads an input file buffer to Muapi (`POST /api/v1/upload_file`, multipart/form-data field `file`).
 */
export async function uploadFileToMuapi({ buffer, filename, contentType }, options = {}) {
  const apiKey = getMuapiApiKey();
  if (!apiKey) {
    const err = new Error('Server MUAPI_API_KEY is not configured for file upload');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.statusCode = 503;
    throw err;
  }

  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseV1 = getMuapiBaseV1Url();
  const uploadUrl = `${baseV1}/upload_file`;

  const formData = new FormData();
  const blob = new Blob([buffer], { type: contentType });
  formData.append('file', blob, filename);

  const res = await fetchFn(uploadUrl, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  const remoteUrl = data?.url || data?.file_url || data?.data?.url || null;

  if (!res.ok || !remoteUrl) {
    const msg =
      data?.error || data?.message || data?.detail || `Muapi upload_file failed (HTTP ${res.status})`;
    const err = new Error(redactStringSecrets(String(msg)));
    err.code = 'UPSTREAM_UPLOAD_FAILED';
    err.statusCode = res.status === 401 || res.status === 403 ? 502 : 502;
    throw err;
  }

  return {
    url: String(remoteUrl).trim(),
    provider: 'muapi',
    providerDetails: redactProviderDetails({
      adapter: 'muapi',
      upload_endpoint: '/api/v1/upload_file',
      filename,
      content_type: contentType,
    }),
  };
}
