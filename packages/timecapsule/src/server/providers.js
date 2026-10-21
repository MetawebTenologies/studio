import {
  IMAGE_MODEL_MAP,
  I2I_MODEL_MAP,
  VIDEO_MODEL_MAP,
  I2V_MODEL_MAP,
  LIPSYNC_MODEL_MAP,
} from '../client/index.js';
import { getProviderForModel } from '../models/index.js';

const customAdapters = new Map();

export function registerProviderAdapter(providerName, adapter) {
  customAdapters.set(providerName, adapter);
}

export function resetProviderAdapters() {
  customAdapters.clear();
}

export function selectProviderForJob({ model, modality, preferredProvider }) {
  if (preferredProvider && customAdapters.has(preferredProvider)) {
    return preferredProvider;
  }
  const detected = getProviderForModel(model);
  if (detected) return detected;
  return 'kie';
}

async function executeDryRunAdapter(job, { onProgress }) {
  const providerJobId = `sim_${job.provider}_${job.job_id.slice(-8)}`;
  if (onProgress) {
    onProgress({
      stage: 'initializing',
      progress: 0.25,
      providerJobId,
    });
    await new Promise((r) => setTimeout(r, 15));
    onProgress({
      stage: 'diffusion',
      progress: 0.75,
      providerJobId,
      frame: 45,
      total_frames: 60,
    });
  }
  const isVideo = ['video', 'i2v', 'v2v', 'lipsync'].includes(job.modality);
  const sampleUrl = isVideo
    ? 'https://cdn.timecapsule.studio/samples/timecapsule-sample.mp4'
    : 'https://cdn.timecapsule.studio/samples/timecapsule-sample.png';

  return {
    providerJobId,
    sourceUrl: sampleUrl,
    actualCredits: job.estimated_cost,
  };
}

async function executeKieServerAdapter(job, { onProgress, fetchImpl }) {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    if (process.env.TIMECAPSULE_DRY_RUN === '1' || process.env.NODE_ENV === 'test') {
      return executeDryRunAdapter(job, { onProgress });
    }
    const err = new Error('Server KIE_API_KEY is not configured');
    err.code = 'PROVIDER_KEY_MISSING';
    err.statusCode = 503;
    throw err;
  }

  const fetchFn = fetchImpl || globalThis.fetch.bind(globalThis);
  const inputs = job.inputs || {};
  let kieModel;
  let payloadInput = { prompt: inputs.prompt || '' };

  if (job.modality === 'image') {
    kieModel = IMAGE_MODEL_MAP[job.model] || job.model || 'nano-banana-pro';
    if (inputs.aspect_ratio) payloadInput.aspect_ratio = inputs.aspect_ratio;
    if (kieModel.startsWith('nano-banana')) {
      payloadInput.resolution = String(inputs.resolution || '1K').toUpperCase();
      payloadInput.output_format = 'png';
      if (inputs.image_urls?.length) payloadInput.image_input = inputs.image_urls;
    }
  } else if (job.modality === 'i2i') {
    kieModel = I2I_MODEL_MAP[job.model] || 'qwen/image-to-image';
    const urls = inputs.image_urls || (inputs.image_url ? [inputs.image_url] : []);
    payloadInput = {
      prompt: inputs.prompt || '',
      image_input: urls,
      image_urls: urls,
      image_url: urls[0],
      aspect_ratio: inputs.aspect_ratio || '1:1',
    };
  } else if (job.modality === 'video') {
    kieModel = VIDEO_MODEL_MAP[job.model] || 'bytedance/seedance-1.5-pro';
    if (inputs.aspect_ratio) payloadInput.aspect_ratio = inputs.aspect_ratio;
    if (inputs.resolution) payloadInput.resolution = inputs.resolution;
    if (inputs.duration_seconds || inputs.duration) {
      payloadInput.duration = Number(inputs.duration_seconds || inputs.duration || 5);
    }
  } else if (job.modality === 'i2v') {
    kieModel = I2V_MODEL_MAP[job.model] || 'bytedance/seedance-1.5-pro';
    const urls = inputs.image_urls || (inputs.image_url ? [inputs.image_url] : []);
    payloadInput = {
      prompt: inputs.prompt || '',
      input_urls: urls,
      image_url: urls[0],
      aspect_ratio: inputs.aspect_ratio || '16:9',
      resolution: inputs.resolution || '720p',
      duration: Number(inputs.duration_seconds || inputs.duration || 5),
    };
  } else {
    kieModel = LIPSYNC_MODEL_MAP[job.model] || 'omnihuman-1-5';
    payloadInput = {
      image_url: inputs.image_url,
      video_url: inputs.video_url,
      audio_url: inputs.audio_url,
    };
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

async function executeTimecapsuleGpuAdapter(job, { onProgress, fetchImpl }) {
  const workerUrl = process.env.TIMECAPSULE_GPU_WORKER_URL;
  if (!workerUrl) {
    if (process.env.TIMECAPSULE_DRY_RUN === '1' || process.env.NODE_ENV !== 'production') {
      return executeDryRunAdapter(job, { onProgress });
    }
    const err = new Error('TIMECAPSULE_GPU_WORKER_URL is not configured');
    err.code = 'GPU_WORKER_UNAVAILABLE';
    err.statusCode = 503;
    throw err;
  }

  const fetchFn = fetchImpl || globalThis.fetch.bind(globalThis);
  const res = await fetchFn(`${workerUrl.replace(/\/$/, '')}/v1/infer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.TIMECAPSULE_GPU_WORKER_KEY
        ? { Authorization: `Bearer ${process.env.TIMECAPSULE_GPU_WORKER_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      job_id: job.job_id,
      model: job.model,
      modality: job.modality,
      inputs: job.inputs,
      workflow: job.workflow,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data.error || `GPU worker HTTP ${res.status}`);
  }
  return {
    providerJobId: data.worker_job_id || `gpu_${job.job_id}`,
    sourceUrl: data.url,
    actualCredits: job.estimated_cost,
  };
}

export async function dispatchToProvider(job, options = {}) {
  const custom = customAdapters.get(job.provider);
  if (custom) {
    return custom(job, options);
  }
  if (job.provider === 'timecapsule-gpu') {
    return executeTimecapsuleGpuAdapter(job, options);
  }
  return executeKieServerAdapter(job, options);
}
