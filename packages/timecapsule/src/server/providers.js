import { resolveKieModelForModality } from '../client/index.js';
import {
  getProviderForModel,
  getUnconfiguredNativeModelById,
} from '../models/index.js';

const customAdapters = new Map();

export function registerProviderAdapter(providerName, adapter) {
  if (process.env.TIMECAPSULE_TEST_MODE !== '1') {
    const err = new Error(
      'Custom provider adapters may only be registered when TIMECAPSULE_TEST_MODE=1'
    );
    err.code = 'TEST_MODE_REQUIRED';
    err.statusCode = 403;
    throw err;
  }
  customAdapters.set(providerName, adapter);
}

export function resetProviderAdapters() {
  customAdapters.clear();
}

export function hasTestProviderAdapter(providerName) {
  return process.env.TIMECAPSULE_TEST_MODE === '1' && customAdapters.has(providerName);
}

export function selectProviderForJob({ model, modality, preferredProvider }) {
  if (preferredProvider && hasTestProviderAdapter(preferredProvider)) {
    return preferredProvider;
  }
  const detected = getProviderForModel(model);
  if (detected) return detected;
  return 'kie';
}

export function assertProviderReadyForJob({ model, modality, provider }) {
  if (!model || typeof model !== 'string' || !model.trim()) {
    const err = new Error('model is required');
    err.code = 'MISSING_MODEL';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  // Self-hosted GPU models are disabled unless an explicit test adapter is registered in test mode.
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

async function executeKieServerAdapter(job, { onProgress, fetchImpl }) {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const err = new Error('Server KIE_API_KEY is not configured');
    err.code = 'PROVIDER_CREDENTIALS_MISSING';
    err.status = 503;
    err.statusCode = 503;
    throw err;
  }

  const fetchFn = fetchImpl || globalThis.fetch.bind(globalThis);
  const inputs = job.inputs || {};
  const kieModel = resolveKieModelForModality(job.modality, job.model);
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

  const createRes = await fetchFn('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: kieModel, input: payloadInput }),
  });
  const createData = await createRes.json().catch(() => ({}));
  if (!createRes.ok || (createData.code && createData.code !== 200)) {
    throw new Error(createData.msg || createData.error || `Kie.ai HTTP ${createRes.status}`);
  }
  const taskId = createData.data?.taskId;
  if (!taskId) throw new Error('Kie.ai did not return a taskId');

  if (onProgress) {
    onProgress({ stage: 'queued_at_provider', progress: 0.15, providerJobId: taskId });
  }

  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await fetchFn(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );
    const pollData = await pollRes.json().catch(() => ({}));
    const d = pollData.data || {};
    if (d.state === 'success') {
      let urls = [];
      try {
        urls = JSON.parse(d.resultJson || '{}').resultUrls || [];
      } catch {
        urls = [];
      }
      if (!urls.length) throw new Error('Kie.ai task succeeded without output URL');
      return {
        providerJobId: taskId,
        sourceUrl: urls[0],
        actualCredits: Number(d.creditsConsumed) || job.estimated_cost,
      };
    }
    if (d.state === 'fail') {
      throw new Error(d.failMsg || 'Kie.ai generation failed');
    }
    if (onProgress) {
      onProgress({
        stage: 'generating',
        progress: Math.min(0.9, 0.2 + i * 0.05),
        providerJobId: taskId,
      });
    }
  }
  throw new Error('Kie.ai generation timed out');
}

async function executeTimecapsuleGpuAdapter(job) {
  const err = new Error(
    `Self-hosted GPU worker for "${job.model}" is not verified. Automatic fake GPU execution is disabled.`
  );
  err.code = 'MODEL_WORKER_NOT_VERIFIED';
  err.status = 503;
  err.statusCode = 503;
  throw err;
}

export async function dispatchToProvider(job, options = {}) {
  if (hasTestProviderAdapter(job.provider)) {
    const custom = customAdapters.get(job.provider);
    return custom(job, options);
  }
  if (job.provider === 'timecapsule-gpu') {
    return executeTimecapsuleGpuAdapter(job, options);
  }
  return executeKieServerAdapter(job, options);
}
