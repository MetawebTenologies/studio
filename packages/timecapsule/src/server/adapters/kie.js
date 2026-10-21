import { resolveKieModelForModality } from '../../client/index.js';
import { redactProviderDetails, redactStringSecrets } from './redact.js';

export function getKieServerBaseUrl() {
  return (process.env.TIMECAPSULE_KIE_BASE_URL || 'https://api.kie.ai').replace(/\/+$/, '');
}

export function getKieUploadBaseUrl() {
  return (process.env.TIMECAPSULE_KIE_UPLOAD_BASE_URL || 'https://kieai.redpandaai.co').replace(
    /\/+$/,
    ''
  );
}

export function getKieApiKey() {
  const key = process.env.KIE_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : null;
}

export function isKieConfigured() {
  return Boolean(getKieApiKey());
}

export function isKieVeoJob(job) {
  const route = String(job.execution_route || '');
  const resolved = String(job.resolved_provider_model || '');
  const model = String(job.model || '');
  return (
    route.startsWith('kie:veo/v1:') ||
    resolved.startsWith('veo3') ||
    model.startsWith('veo3')
  );
}

export function buildKieTaskPayload(job) {
  const inputs = job.inputs || {};
  const kieModel =
    job.resolved_provider_model || resolveKieModelForModality(job.modality, job.model);
  const urls = Array.isArray(inputs.image_urls)
    ? inputs.image_urls
    : Array.isArray(inputs.images_list)
      ? inputs.images_list
      : inputs.image_url
        ? [inputs.image_url]
        : [];

  if (isKieVeoJob({ ...job, resolved_provider_model: kieModel })) {
    if (job.modality === 'i2v' && !urls.length) {
      const err = new Error('Kie Veo image-to-video workflow requires at least one input image URL');
      err.code = 'MISSING_INPUT_IMAGE';
      err.statusCode = 400;
      err.deterministicFailure = true;
      throw err;
    }
    const aspectRatio = inputs.aspect_ratio || '16:9';
    const veoBody = {
      prompt: String(inputs.prompt || '').trim(),
      model: kieModel,
      aspectRatio,
      aspect_ratio: aspectRatio,
      ...(job.modality === 'i2v' ? { imageUrls: urls } : {}),
    };
    return {
      contractType: 'veo',
      kieModel,
      submitPath: '/api/v1/veo/generate',
      body: veoBody,
    };
  }

  let payloadInput = { prompt: inputs.prompt || '' };

  if (job.modality === 'image') {
    if (inputs.aspect_ratio) payloadInput.aspect_ratio = inputs.aspect_ratio;
    if (kieModel.startsWith('nano-banana')) {
      payloadInput.resolution = String(inputs.resolution || '1K').toUpperCase();
      payloadInput.output_format = 'png';
      if (urls.length) payloadInput.image_input = urls;
    }
  } else if (job.modality === 'i2i') {
    if (!urls.length) {
      const err = new Error('Kie image-to-image workflow requires at least one input image URL');
      err.code = 'MISSING_INPUT_IMAGE';
      err.statusCode = 400;
      err.deterministicFailure = true;
      throw err;
    }
    payloadInput = {
      prompt: inputs.prompt || '',
      image_input: urls,
      image_urls: urls,
      image_url: urls[0],
      aspect_ratio: inputs.aspect_ratio || '1:1',
      resolution: String(inputs.resolution || '1K').toUpperCase(),
      output_format: 'png',
    };
  } else if (job.modality === 'video') {
    if (inputs.aspect_ratio) payloadInput.aspect_ratio = inputs.aspect_ratio;
    if (inputs.resolution) payloadInput.resolution = inputs.resolution;
    if (inputs.duration_seconds || inputs.duration) {
      payloadInput.duration = Number(inputs.duration_seconds || inputs.duration || 5);
    }
  } else if (job.modality === 'i2v') {
    if (!urls.length) {
      const err = new Error('Kie image-to-video workflow requires an input image URL');
      err.code = 'MISSING_INPUT_IMAGE';
      err.statusCode = 400;
      err.deterministicFailure = true;
      throw err;
    }
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

  return {
    contractType: 'market',
    kieModel,
    payloadInput,
    submitPath: '/api/v1/jobs/createTask',
    body: {
      model: kieModel,
      input: payloadInput,
    },
  };
}

export async function submitKieTask(job, options = {}) {
  const apiKey = getKieApiKey();
  if (!apiKey) {
    const err = new Error('Server KIE_API_KEY is not configured');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.status = 503;
    err.statusCode = 503;
    throw err;
  }

  const { contractType, kieModel, submitPath, body } = buildKieTaskPayload(job);
  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseUrl = getKieServerBaseUrl();

  let createRes;
  try {
    createRes = await fetchFn(`${baseUrl}${submitPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(job.submission_attempt_id
          ? { 'X-Submission-Attempt-Id': job.submission_attempt_id }
          : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    const isPreConnectRefusal = networkErr.code === 'ECONNREFUSED';
    const err = new Error(
      `Provider submission transport error: ${redactStringSecrets(networkErr.message || 'network failure')}`
    );
    err.code = networkErr.code || 'PROVIDER_SUBMISSION_TRANSPORT_ERROR';
    err.ambiguousSubmission = !isPreConnectRefusal;
    err.retryableSubmission = isPreConnectRefusal;
    throw err;
  }

  const rawText = await createRes.text().catch(() => '');
  let createData = {};
  let jsonParseFailed = false;
  if (rawText) {
    try {
      createData = JSON.parse(rawText);
    } catch {
      jsonParseFailed = true;
    }
  }

  if (createRes.status === 401 || createRes.status === 403) {
    const err = new Error(
      redactStringSecrets(
        createData.msg || createData.error || `Kie.ai authentication failed (HTTP ${createRes.status})`
      )
    );
    err.code = 'KIE_AUTH_ERROR';
    err.statusCode = createRes.status;
    err.deterministicFailure = true;
    err.providerDetails = redactProviderDetails({
      http_status: createRes.status,
      contract: contractType,
      response: createData,
    });
    throw err;
  }

  if (createRes.status >= 500 || createRes.status === 408 || createRes.status === 429) {
    const err = new Error(
      redactStringSecrets(
        createData.msg || createData.error || `Kie.ai HTTP ${createRes.status} during submission`
      )
    );
    err.statusCode = createRes.status;
    err.retryableSubmission = createRes.status === 429 || createRes.status === 503;
    err.ambiguousSubmission =
      createRes.status === 502 || createRes.status === 504 || createRes.status === 408 || createRes.status === 500;
    err.providerDetails = redactProviderDetails({
      http_status: createRes.status,
      contract: contractType,
      response: createData,
    });
    throw err;
  }

  if (!createRes.ok || (createData.code && createData.code !== 200)) {
    const err = new Error(
      redactStringSecrets(
        createData.msg ||
          createData.error ||
          `Kie.ai rejected task submission (HTTP ${createRes.status})`
      )
    );
    err.statusCode = createRes.status || 400;
    err.deterministicFailure = true;
    err.providerDetails = redactProviderDetails({
      http_status: createRes.status,
      contract: contractType,
      response: createData,
    });
    throw err;
  }

  if (jsonParseFailed) {
    const err = new Error(
      'Kie.ai response reached 200 OK with malformed JSON; submission outcome is ambiguous'
    );
    err.code = 'AMBIGUOUS_PROVIDER_RESPONSE';
    err.ambiguousSubmission = true;
    err.providerDetails = redactProviderDetails({
      http_status: createRes.status,
      contract: contractType,
      raw_snippet: rawText.slice(0, 300),
    });
    throw err;
  }

  const taskId = createData.data?.taskId || createData.taskId;
  if (!taskId) {
    const err = new Error(
      'Kie.ai response reached 200 OK without a taskId; submission outcome is ambiguous'
    );
    err.code = 'AMBIGUOUS_PROVIDER_RESPONSE';
    err.ambiguousSubmission = true;
    err.providerDetails = redactProviderDetails({
      http_status: createRes.status,
      contract: contractType,
      response: createData,
    });
    throw err;
  }

  return {
    providerJobId: String(taskId),
    immediateCompletion: null,
    providerDetails: redactProviderDetails({
      adapter: 'kie',
      contract: contractType,
      model: kieModel,
      taskId: String(taskId),
    }),
  };
}

export async function pollKieTaskStatus(job, options = {}) {
  if (!job.provider_job_id) {
    const err = new Error(`Cannot poll Kie job ${job.job_id} without a persisted provider_job_id`);
    err.code = 'MISSING_PROVIDER_JOB_ID';
    err.retryablePoll = false;
    throw err;
  }

  const apiKey = getKieApiKey();
  if (!apiKey) {
    const err = new Error('Server KIE_API_KEY is not configured for status polling');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.retryablePoll = true;
    throw err;
  }

  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const baseUrl = getKieServerBaseUrl();
  const veoMode = isKieVeoJob(job);
  const pollPath = veoMode
    ? `/api/v1/veo/record-info?taskId=${encodeURIComponent(job.provider_job_id)}`
    : `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(job.provider_job_id)}`;

  let pollRes;
  try {
    pollRes = await fetchFn(`${baseUrl}${pollPath}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (networkErr) {
    // Poll timeout / transport failure is retryable and never treated as a confirmed failure
    const err = new Error(
      `Kie.ai status poll transport/timeout error: ${redactStringSecrets(networkErr.message || 'timeout')}`
    );
    err.code = networkErr.code || 'KIE_POLL_TIMEOUT';
    err.retryablePoll = true;
    throw err;
  }

  const rawText = await pollRes.text().catch(() => '');
  let pollData = {};
  let jsonParseFailed = false;
  if (rawText) {
    try {
      pollData = JSON.parse(rawText);
    } catch {
      jsonParseFailed = true;
    }
  }

  if (pollRes.status === 401 || pollRes.status === 403) {
    const err = new Error(
      redactStringSecrets(
        pollData.msg || pollData.error || `Kie.ai poll authentication error (HTTP ${pollRes.status})`
      )
    );
    err.code = 'KIE_AUTH_ERROR';
    err.statusCode = pollRes.status;
    err.retryablePoll = false;
    err.providerDetails = redactProviderDetails({
      http_status: pollRes.status,
      response: pollData,
    });
    throw err;
  }

  if (!pollRes.ok) {
    const err = new Error(`Kie.ai recordInfo HTTP ${pollRes.status}`);
    err.statusCode = pollRes.status;
    err.retryablePoll =
      pollRes.status >= 500 || pollRes.status === 429 || pollRes.status === 408 || pollRes.status === 404;
    err.providerDetails = redactProviderDetails({
      http_status: pollRes.status,
      response: pollData,
    });
    throw err;
  }

  if (jsonParseFailed) {
    const err = new Error('Kie.ai recordInfo returned malformed JSON');
    err.code = 'KIE_POLL_MALFORMED_JSON';
    err.retryablePoll = true;
    err.providerDetails = redactProviderDetails({
      http_status: pollRes.status,
      raw_snippet: rawText.slice(0, 300),
    });
    throw err;
  }

  const d = pollData.data || {};

  if (veoMode) {
    if (d.successFlag === 1) {
      const rawUrls = d.response?.resultUrls || d.info?.resultUrls || d.resultUrls || [];
      const urls = Array.isArray(rawUrls)
        ? rawUrls.filter((u) => typeof u === 'string' && u.trim())
        : [];
      if (!urls.length) {
        const err = new Error('Kie.ai Veo task succeeded without output URL');
        err.deterministicFailure = true;
        err.retryablePoll = false;
        throw err;
      }
      return {
        status: 'succeeded',
        providerJobId: job.provider_job_id,
        sourceUrl: urls[0],
        outputs: urls,
        providerReportedCost:
          d.creditsConsumed !== undefined && Number.isFinite(Number(d.creditsConsumed))
            ? Number(d.creditsConsumed)
            : null,
        providerCostUnit:
          d.creditsConsumed !== undefined && Number.isFinite(Number(d.creditsConsumed))
            ? 'kie_credits'
            : null,
        providerDetails: redactProviderDetails({
          adapter: 'kie',
          contract: 'veo',
          taskId: job.provider_job_id,
          successFlag: d.successFlag,
          output_count: urls.length,
        }),
      };
    }

    if (d.successFlag === 2 || d.successFlag === 3) {
      const failReason = redactStringSecrets(
        d.errorMessage || d.failMsg || 'Kie.ai Veo generation failed'
      );
      return {
        status: 'failed',
        providerJobId: job.provider_job_id,
        error: failReason,
        providerDetails: redactProviderDetails({
          adapter: 'kie',
          contract: 'veo',
          taskId: job.provider_job_id,
          successFlag: d.successFlag,
          errorMessage: failReason,
        }),
      };
    }

    return {
      status: 'running',
      providerJobId: job.provider_job_id,
      stage: 'generating',
      progress: typeof d.progress === 'number' ? d.progress : null,
      providerDetails: redactProviderDetails({
        adapter: 'kie',
        contract: 'veo',
        taskId: job.provider_job_id,
        successFlag: d.successFlag ?? 0,
      }),
    };
  }

  // Market jobs contract
  if (d.state === 'success') {
    let urls = [];
    try {
      const parsedResult =
        typeof d.resultJson === 'string' ? JSON.parse(d.resultJson || '{}') : d.resultJson || {};
      urls = parsedResult.resultUrls || [];
    } catch {
      urls = [];
    }
    if (!urls.length) {
      const err = new Error('Kie.ai task succeeded without output URL');
      err.deterministicFailure = true;
      err.retryablePoll = false;
      throw err;
    }
    return {
      status: 'succeeded',
      providerJobId: job.provider_job_id,
      sourceUrl: urls[0],
      outputs: urls,
      providerReportedCost:
        d.creditsConsumed !== undefined && Number.isFinite(Number(d.creditsConsumed))
          ? Number(d.creditsConsumed)
          : null,
      providerCostUnit:
        d.creditsConsumed !== undefined && Number.isFinite(Number(d.creditsConsumed))
          ? 'kie_credits'
          : null,
      providerDetails: redactProviderDetails({
        adapter: 'kie',
        contract: 'market',
        taskId: job.provider_job_id,
        state: d.state,
        output_count: urls.length,
      }),
    };
  }

  if (d.state === 'fail') {
    const failReason = redactStringSecrets(d.failMsg || 'Kie.ai generation failed');
    return {
      status: 'failed',
      providerJobId: job.provider_job_id,
      error: failReason,
      providerDetails: redactProviderDetails({
        adapter: 'kie',
        contract: 'market',
        taskId: job.provider_job_id,
        state: d.state,
        failMsg: failReason,
      }),
    };
  }

  return {
    status: 'running',
    providerJobId: job.provider_job_id,
    stage: d.state || 'generating',
    progress: typeof d.progress === 'number' ? d.progress : null,
    providerDetails: redactProviderDetails({
      adapter: 'kie',
      contract: 'market',
      taskId: job.provider_job_id,
      state: d.state || 'generating',
    }),
  };
}

export async function uploadFileToKie({ dataUrl, filename, contentType }, options = {}) {
  const apiKey = getKieApiKey();
  if (!apiKey) {
    const err = new Error('Server KIE_API_KEY is not configured for file upload');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.statusCode = 503;
    throw err;
  }

  const fetchFn = options.fetchImpl || globalThis.fetch.bind(globalThis);
  const uploadBase = getKieUploadBaseUrl();

  const res = await fetchFn(`${uploadBase}/api/file-base64-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Data: dataUrl,
      uploadPath: 'timecapsule/uploads',
      fileName: filename,
    }),
  });

  const json = await res.json().catch(() => ({}));
  const remoteUrl = json?.data?.downloadUrl || json?.data?.fileUrl || json?.url || null;
  if (!res.ok || !remoteUrl) {
    const err = new Error(
      redactStringSecrets(
        json?.msg || json?.error || `Kie upstream upload failed (HTTP ${res.status})`
      )
    );
    err.code = 'UPSTREAM_UPLOAD_FAILED';
    err.statusCode = 502;
    throw err;
  }

  return {
    url: String(remoteUrl).trim(),
    provider: 'kie',
    providerDetails: redactProviderDetails({
      adapter: 'kie',
      upload_endpoint: '/api/file-base64-upload',
      filename,
      content_type: contentType,
    }),
  };
}
