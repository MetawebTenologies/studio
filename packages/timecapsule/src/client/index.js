import { TIMECAPSULE_BRAND } from '../branding.js';
import { getProviderForModel } from '../models/index.js';

export const IMAGE_MODEL_MAP = {
  'nano-banana-pro': 'nano-banana-pro',
  'nano-banana-2': 'nano-banana-2',
  'nano-banana': 'nano-banana',
  'grok-imagine-text-to-image': 'grok-imagine/text-to-image',
  'gpt-image-1.5': 'gpt-image/1.5-text-to-image',
  'bytedance-seedream-v4.5': 'seedream/4.5-text-to-image',
  'qwen-image': 'qwen/text-to-image',
};

export const I2I_MODEL_MAP = {
  'nano-banana-pro-edit': 'nano-banana-pro',
  'nano-banana-edit': 'nano-banana-edit',
  'gpt-image-1.5-edit': 'gpt-image/1.5-image-to-image',
  'qwen-image-edit': 'qwen/image-to-image',
};

export const VIDEO_MODEL_MAP = {
  'veo3.1-text-to-video': 'veo3',
  'veo3.1-fast-text-to-video': 'veo3_fast',
  'veo3-text-to-video': 'veo3',
  'veo3-fast-text-to-video': 'veo3_fast',
  'kling-v2.1-master-t2v': 'kling/v2-1-pro',
  'kling-v2.1-standard-t2v': 'kling/v2-1-standard',
  'seedance-v2.0-t2v': 'bytedance/seedance-1.5-pro',
  'seedance-pro-t2v': 'bytedance/seedance-1.5-pro',
  'wan2.1-text-to-video': 'wan/3-0-video',
  'openai-sora-2-text-to-video': 'sora-2-text-to-video',
  'openai-sora-2-pro-t2v': 'sora-2-pro-text-to-video',
};

export const I2V_MODEL_MAP = {
  'veo3.1-image-to-video': 'veo3',
  'veo3.1-fast-image-to-video': 'veo3_fast',
  'kling-v2.1-pro-i2v': 'kling/v2-1-pro',
  'kling-v2.1-standard-i2v': 'kling/v2-1-standard',
  'seedance-v2.0-i2v': 'bytedance/seedance-1.5-pro',
  'seedance-pro-i2v': 'bytedance/seedance-1.5-pro',
  'wan2.1-image-to-video': 'wan/3-0-video',
  'openai-sora-2-i2v': 'sora-2-image-to-video',
  'openai-sora-2-pro-i2v': 'sora-2-pro-image-to-video',
};

export const LIPSYNC_MODEL_MAP = {
  'sync-lipsync': 'volcengine/video-to-video-lip-sync',
  'latent-sync': 'volcengine/video-to-video-lip-sync',
  'creatify-lipsync': 'omnihuman-1-5',
  'omnihuman-1-5': 'omnihuman-1-5',
};

export function resolveKieModelForModality(modality, modelId) {
  if (!modelId || typeof modelId !== 'string' || !modelId.trim()) {
    const err = new Error(`Explicit model identifier is required for modality "${modality}"`);
    err.status = 400;
    err.statusCode = 400;
    err.code = 'UNSUPPORTED_MODEL';
    throw err;
  }

  let mapped = null;
  if (modality === 'image' || modality === 't2i') {
    mapped = IMAGE_MODEL_MAP[modelId] || null;
  } else if (modality === 'i2i') {
    mapped = I2I_MODEL_MAP[modelId] || null;
  } else if (modality === 'video' || modality === 't2v') {
    mapped = VIDEO_MODEL_MAP[modelId] || null;
  } else if (modality === 'i2v') {
    mapped = I2V_MODEL_MAP[modelId] || null;
  } else if (modality === 'lipsync') {
    mapped = LIPSYNC_MODEL_MAP[modelId] || null;
  }

  if (!mapped) {
    const err = new Error(
      `Unsupported or unmapped model "${modelId}" for modality "${modality}". Silent default model substitution is disabled.`
    );
    err.status = 400;
    err.statusCode = 400;
    err.code = 'UNSUPPORTED_MODEL';
    throw err;
  }

  return mapped;
}

export const BACKEND_IMAGE_MODEL_MAP = {
  'nano-banana-pro': 'nano-banana-pro',
  'nano-banana-2': 'nano-banana-2',
  'nano-banana': 'nano-banana',
  'grok-imagine-text-to-image': 'grok-imagine/text-to-image',
  'gpt-image-1.5': 'gpt-image/1.5-text-to-image',
  'bytedance-seedream-v4.5': 'seedream/4.5-text-to-image',
  'qwen-image': 'qwen/text-to-image',
};

export const BACKEND_I2I_MODEL_MAP = {
  'nano-banana-pro-edit': 'nano-banana-pro',
  'nano-banana-edit': 'nano-banana-2',
  'flux-kontext-pro-i2i': 'qwen/image-to-image',
  'gpt-image-1.5-edit': 'gpt-image/1.5-image-to-image',
  'midjourney-v7-image-to-image': 'seedream/4.5-edit',
};

export const BACKEND_VIDEO_MODEL_MAP = {
  'veo3.1-text-to-video': 'bytedance/seedance-2',
  'veo3.1-fast-text-to-video': 'bytedance/seedance-2-fast',
  'veo3-text-to-video': 'bytedance/seedance-2',
  'veo3-fast-text-to-video': 'bytedance/seedance-2-fast',
  'kling-v2.1-master-t2v': 'kling-3.0/video',
  'kling-v2.1-standard-t2v': 'kling/v2-5-turbo-text-to-video-pro',
  'seedance-v2.0-t2v': 'bytedance/seedance-2',
  'seedance-pro-t2v': 'bytedance/seedance-1.5-pro',
  'wan2.1-text-to-video': 'wan/2-6-text-to-video',
  'openai-sora-2-text-to-video': 'sora-2-text-to-video',
  'openai-sora-2-pro-t2v': 'sora-2-pro-text-to-video',
};

export const BACKEND_I2V_MODEL_MAP = {
  'veo3.1-image-to-video': 'bytedance/seedance-2',
  'veo3.1-fast-image-to-video': 'bytedance/seedance-2-fast',
  'kling-v2.1-pro-i2v': 'kling-3.0/video',
  'kling-v2.1-standard-i2v': 'kling/v2-5-turbo-image-to-video-pro',
  'seedance-v2.0-i2v': 'bytedance/seedance-2',
  'seedance-pro-i2v': 'bytedance/seedance-1.5-pro',
  'wan2.1-image-to-video': 'wan/2-6-image-to-video',
  'openai-sora-2-i2v': 'sora-2-image-to-video',
  'openai-sora-2-pro-i2v': 'sora-2-pro-image-to-video',
};

const clientConfig = {
  mode: 'auto', // 'auto' | 'bff' | 'direct' | 'netlify'
  kieBaseUrl: 'https://api.kie.ai',
  bffBaseUrl: '/api/v1',
  fetchImpl: null,
  EventSourceImpl: null,
  pollIntervalMs: 5000,
  bffPollIntervalMs: 500,
  maxPollAttempts: 180,
};

export function configureTimecapsuleClient(overrides = {}) {
  Object.assign(clientConfig, overrides);
  return { ...clientConfig };
}

export function getTimecapsuleClientConfig() {
  return { ...clientConfig };
}

function getFetch() {
  return clientConfig.fetchImpl || globalThis.fetch.bind(globalThis);
}

function getEventSource() {
  if (clientConfig.EventSourceImpl !== null) return clientConfig.EventSourceImpl;
  return typeof globalThis.EventSource !== 'undefined' ? globalThis.EventSource : null;
}

function getStorageItem(key) {
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch {
    // ignore storage access errors in SSR/Node
  }
  return null;
}

function setStorageItem(key, value) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function resolveTransportMode(apiKey, modelId) {
  if (clientConfig.mode && clientConfig.mode !== 'auto') {
    return clientConfig.mode;
  }
  if (apiKey === 'TIMECAPSULE_BFF' || apiKey === 'MANAGED') {
    return 'bff';
  }
  if (getProviderForModel(modelId) === 'timecapsule-gpu') {
    return 'bff';
  }
  const storedMode = getStorageItem(TIMECAPSULE_BRAND.storageKeys.backendMode);
  if (storedMode === 'bff') return 'bff';
  if (storedMode === 'direct') return 'direct';
  if (getStorageItem(TIMECAPSULE_BRAND.storageKeys.legacyBackendMode) === '1') {
    return 'netlify';
  }
  if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0) {
    return 'direct';
  }
  return 'bff';
}

function getSessionToken(apiKey) {
  if (apiKey && apiKey !== 'TIMECAPSULE_BFF' && apiKey !== 'MANAGED') {
    return apiKey;
  }
  return (
    getStorageItem(TIMECAPSULE_BRAND.storageKeys.sessionToken) ||
    getStorageItem(TIMECAPSULE_BRAND.storageKeys.apiKey) ||
    ''
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Timecapsule BFF Execution Path ──────────────────────────────────────────

async function runViaTimecapsuleBff({ apiKey, modality, model, provider, inputs, workflow, delivery }) {
  if (!model || typeof model !== 'string' || !model.trim()) {
    const err = new Error(`Explicit model identifier is required for modality "${modality}"`);
    err.status = 400;
    err.statusCode = 400;
    err.code = 'UNSUPPORTED_MODEL';
    throw err;
  }

  const fetchFn = getFetch();
  const token = getSessionToken(apiKey);
  const idempotencyKey = generateIdempotencyKey();
  const baseUrl = clientConfig.bffBaseUrl.replace(/\/$/, '');

  const headers = {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
    'X-Timecapsule-CSRF': '1',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetchFn(`${baseUrl}/generations`, {
    method: 'POST',
    credentials: 'same-origin',
    headers,
    body: JSON.stringify({
      project_id: inputs?.project_id || 'prj_default',
      modality,
      model,
      ...(provider ? { provider } : {}),
      inputs,
      workflow: workflow || {},
      delivery: delivery || { formats: modality === 'video' ? ['mp4'] : ['png'], thumbnail: true },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Timecapsule BFF HTTP ${res.status}`);
  }

  const jobId = data.job_id;
  if (!jobId) {
    throw new Error('Timecapsule BFF did not return a job_id');
  }

  if (data.status === 'succeeded' && data.output?.url) {
    return {
      url: data.output.url,
      id: jobId,
      job_id: jobId,
      provider: data.provider,
      credits_reserved: data.credits_reserved,
    };
  }

  const EventSourceCtor = getEventSource();
  if (EventSourceCtor && data.events_url) {
    try {
      const sseResult = await waitViaEventSource(EventSourceCtor, data.events_url, jobId);
      if (sseResult) return sseResult;
    } catch {
      // Fallback to status polling if SSE stream fails or disconnects early
    }
  }

  return pollTimecapsuleBffJob(jobId, token);
}

function waitViaEventSource(EventSourceCtor, eventsUrl, jobId) {
  return new Promise((resolve, reject) => {
    const es = new EventSourceCtor(eventsUrl);
    const cleanup = () => {
      try {
        es.close();
      } catch {
        // ignore
      }
    };

    es.onmessage = (evt) => {
      try {
        const envelope = JSON.parse(evt.data);
        if (envelope.status === 'succeeded' || envelope.type === 'generation.succeeded') {
          cleanup();
          const url = envelope.data?.url || envelope.data?.urls?.[0] || envelope.output?.url;
          if (!url) {
            reject(new Error('Generation succeeded event missing output URL'));
            return;
          }
          resolve({
            url,
            id: jobId,
            job_id: jobId,
            provider: envelope.provider,
          });
        } else if (envelope.status === 'failed' || envelope.type === 'generation.failed') {
          cleanup();
          reject(new Error(envelope.data?.error || 'Timecapsule generation failed'));
        }
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    es.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}

async function pollTimecapsuleBffJob(jobId, token) {
  const fetchFn = getFetch();
  const baseUrl = clientConfig.bffBaseUrl.replace(/\/$/, '');
  const interval = clientConfig.bffPollIntervalMs;
  const maxAttempts = clientConfig.maxPollAttempts;

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) await sleep(interval);
    const res = await fetchFn(`${baseUrl}/generations/${encodeURIComponent(jobId)}`, {
      credentials: 'same-origin',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Failed to fetch job status (${res.status})`);
    }
    if (data.status === 'succeeded') {
      const url = data.output?.url || data.outputs?.[0]?.url || data.urls?.[0];
      if (!url) throw new Error('Completed job contains no output URL');
      return {
        url,
        id: jobId,
        job_id: jobId,
        provider: data.provider,
        credits_reserved: data.credits_reserved,
      };
    }
    if (data.status === 'failed') {
      throw new Error(data.error || 'Generation failed');
    }
  }
  throw new Error('Generation timed out');
}

// ─── Direct Kie.ai Execution Path (Upstream Parity) ──────────────────────────

async function kieRequest(apiKey, path, method = 'GET', body = null, baseOverride = null) {
  if (!apiKey) throw new Error('API_KEY_REQUIRED');
  const fetchFn = getFetch();
  const base = (baseOverride || clientConfig.kieBaseUrl).replace(/\/$/, '');

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetchFn(`${base}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || (data.code && data.code !== 200)) {
    throw new Error(data.msg || data.message || data.error || `HTTP ${res.status}`);
  }

  return data;
}

async function pollDirectKieResult(apiKey, taskId, isVeo = false, baseOverride = null) {
  const maxAttempts = clientConfig.maxPollAttempts;
  const interval = clientConfig.pollIntervalMs;

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(interval);

    if (isVeo) {
      const res = await kieRequest(
        apiKey,
        `/api/v1/veo/record-info?taskId=${encodeURIComponent(taskId)}`,
        'GET',
        null,
        baseOverride
      );
      const d = res.data || {};
      if (d.successFlag === 1) {
        const urls = d.response?.resultUrls || [];
        if (!urls.length) throw new Error('No output URL in Veo response');
        return { url: urls[0], id: taskId };
      }
      if (d.successFlag === 2 || d.successFlag === 3) {
        throw new Error(d.errorMessage || 'Veo generation failed');
      }
    } else {
      const res = await kieRequest(
        apiKey,
        `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
        'GET',
        null,
        baseOverride
      );
      const d = res.data || {};
      if (d.state === 'success') {
        let urls = [];
        try {
          urls = JSON.parse(d.resultJson || '{}').resultUrls || [];
        } catch {
          urls = [];
        }
        if (!urls.length) throw new Error('No output URL in response');
        return { url: urls[0], id: taskId };
      }
      if (d.state === 'fail') {
        throw new Error(d.failMsg || 'Generation failed');
      }
    }
  }
  throw new Error('Generation timed out');
}

// ─── Named Functional Exports (packages/studio/src/kie.js Contract) ──────────

export async function generateImage(apiKey, params = {}) {
  const mode = resolveTransportMode(apiKey, params.model);
  if (mode === 'bff') {
    return runViaTimecapsuleBff({
      apiKey,
      modality: 'image',
      model: params.model,
      provider: params.provider,
      inputs: {
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio || '1:1',
        resolution: params.resolution || params.quality || '1k',
        seed: params.seed,
        image_urls: params.image_urls,
      },
    });
  }

  const kieModel = resolveKieModelForModality('image', params.model);
  const input = { prompt: params.prompt };
  if (params.aspect_ratio) input.aspect_ratio = params.aspect_ratio;
  if (kieModel.startsWith('nano-banana')) {
    input.resolution = (params.resolution || '1K').toUpperCase();
    input.output_format = 'png';
    if (params.image_urls?.length) input.image_input = params.image_urls;
  }

  const submitRes = await kieRequest(apiKey, '/api/v1/jobs/createTask', 'POST', {
    model: kieModel,
    input,
  });
  const taskId = submitRes.data?.taskId;
  if (!taskId) throw new Error('No taskId returned from Kie.ai');

  return pollDirectKieResult(apiKey, taskId, false);
}

export async function generateI2I(apiKey, params = {}) {
  const mode = resolveTransportMode(apiKey, params.model);
  if (mode === 'bff') {
    return runViaTimecapsuleBff({
      apiKey,
      modality: 'i2i',
      model: params.model,
      provider: params.provider,
      inputs: {
        prompt: params.prompt || '',
        image_url: params.image_url,
        image_urls: params.image_urls || (params.image_url ? [params.image_url] : []),
        aspect_ratio: params.aspect_ratio || '1:1',
        resolution: params.resolution || params.quality || '1k',
      },
    });
  }

  const kieModel = resolveKieModelForModality('i2i', params.model);
  const urls = params.image_urls || (params.image_url ? [params.image_url] : []);

  let input;
  if (kieModel === 'nano-banana-pro') {
    input = {
      prompt: params.prompt || '',
      image_input: urls,
      aspect_ratio: params.aspect_ratio || '1:1',
      resolution: (params.resolution || '1K').toUpperCase(),
      output_format: 'png',
    };
  } else if (kieModel === 'nano-banana-edit') {
    input = {
      prompt: params.prompt || '',
      image_urls: urls,
      image_size: params.aspect_ratio || '1:1',
      output_format: 'png',
    };
  } else if (kieModel === 'gpt-image/1.5-image-to-image' || kieModel === 'gpt-image-2-image-to-image') {
    input = {
      prompt: params.prompt || '',
      image_urls: urls,
      aspect_ratio: params.aspect_ratio || '1:1',
      quality: params.quality || 'high',
    };
  } else {
    input = { prompt: params.prompt || '', image_url: urls[0] };
  }

  const submitRes = await kieRequest(apiKey, '/api/v1/jobs/createTask', 'POST', {
    model: kieModel,
    input,
  });
  const taskId = submitRes.data?.taskId;
  if (!taskId) throw new Error('No taskId returned from Kie.ai');

  return pollDirectKieResult(apiKey, taskId, false);
}

export async function generateVideo(apiKey, params = {}) {
  const mode = resolveTransportMode(apiKey, params.model);
  if (mode === 'bff') {
    return runViaTimecapsuleBff({
      apiKey,
      modality: 'video',
      model: params.model,
      provider: params.provider,
      inputs: {
        prompt: params.prompt,
        negative_prompt: params.negative_prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
        resolution: params.resolution || '720p',
        duration_seconds: Number(params.duration || params.duration_seconds || 5),
        seed: params.seed,
      },
    });
  }

  const kieModel = resolveKieModelForModality('video', params.model);

  if (kieModel.startsWith('veo3')) {
    const body = {
      prompt: params.prompt,
      model: kieModel,
      aspect_ratio: params.aspect_ratio || '16:9',
    };
    const submitRes = await kieRequest(apiKey, '/api/v1/veo/generate', 'POST', body);
    const taskId = submitRes.data?.taskId;
    if (!taskId) throw new Error('No taskId returned from Veo');
    return pollDirectKieResult(apiKey, taskId, true);
  }

  const input = { prompt: params.prompt };
  if (params.aspect_ratio) input.aspect_ratio = params.aspect_ratio;
  if (params.resolution) input.resolution = params.resolution;
  if (params.duration) {
    input.duration = kieModel.startsWith('kling') ? String(params.duration) : Number(params.duration);
  }

  if (kieModel.startsWith('sora-2')) {
    delete input.aspect_ratio;
    delete input.duration;
    delete input.resolution;
    input.aspect_ratio = params.aspect_ratio === '9:16' ? 'portrait' : 'landscape';
    input.n_frames = String(params.duration || 10);
  }

  const submitRes = await kieRequest(apiKey, '/api/v1/jobs/createTask', 'POST', {
    model: kieModel,
    input,
  });
  const taskId = submitRes.data?.taskId;
  if (!taskId) throw new Error('No taskId returned from Kie.ai');

  return pollDirectKieResult(apiKey, taskId, false);
}

export async function generateI2V(apiKey, params = {}) {
  const mode = resolveTransportMode(apiKey, params.model);
  if (mode === 'bff') {
    return runViaTimecapsuleBff({
      apiKey,
      modality: 'i2v',
      model: params.model,
      provider: params.provider,
      inputs: {
        prompt: params.prompt || '',
        image_url: params.image_url,
        image_urls: params.image_urls || (params.image_url ? [params.image_url] : []),
        aspect_ratio: params.aspect_ratio || '16:9',
        resolution: params.resolution || '720p',
        duration_seconds: Number(params.duration || params.duration_seconds || 5),
      },
    });
  }

  const kieModel = resolveKieModelForModality('i2v', params.model);
  const urls = params.image_urls || (params.image_url ? [params.image_url] : []);

  if (kieModel.startsWith('veo3')) {
    const body = {
      prompt: params.prompt || '',
      model: kieModel,
      imageUrls: urls,
      aspect_ratio: params.aspect_ratio || '16:9',
    };
    const submitRes = await kieRequest(apiKey, '/api/v1/veo/generate', 'POST', body);
    const taskId = submitRes.data?.taskId;
    if (!taskId) throw new Error('No taskId returned from Veo');
    return pollDirectKieResult(apiKey, taskId, true);
  }

  const input = { prompt: params.prompt || '' };
  if (kieModel.startsWith('kling')) {
    input.image_url = urls[0];
    input.duration = String(params.duration || 5);
  } else if (kieModel.startsWith('bytedance/seedance')) {
    input.input_urls = urls;
    if (params.aspect_ratio) input.aspect_ratio = params.aspect_ratio;
    if (params.resolution) input.resolution = params.resolution;
    if (params.duration) input.duration = Number(params.duration);
  } else if (kieModel.startsWith('wan')) {
    input.image_url = urls[0];
    if (params.duration) input.duration = Number(params.duration);
  } else if (kieModel.startsWith('sora-2')) {
    input.image_urls = urls;
    input.aspect_ratio = params.aspect_ratio === '9:16' ? 'portrait' : 'landscape';
    input.n_frames = String(params.duration || 10);
  } else {
    input.image_url = urls[0];
  }

  const submitRes = await kieRequest(apiKey, '/api/v1/jobs/createTask', 'POST', {
    model: kieModel,
    input,
  });
  const taskId = submitRes.data?.taskId;
  if (!taskId) throw new Error('No taskId returned from Kie.ai');

  return pollDirectKieResult(apiKey, taskId, false);
}

export async function processLipSync(apiKey, params = {}) {
  const mode = resolveTransportMode(apiKey, params.model);
  if (mode === 'bff') {
    return runViaTimecapsuleBff({
      apiKey,
      modality: 'lipsync',
      model: params.model,
      inputs: {
        prompt: params.prompt || '',
        image_url: params.image_url,
        video_url: params.video_url,
        audio_url: params.audio_url,
        resolution: params.resolution || '720p',
      },
    });
  }

  const kieModel = resolveKieModelForModality('lipsync', params.model);
  const input = params.image_url
    ? { image_url: params.image_url, audio_url: params.audio_url }
    : { video_url: params.video_url, audio_url: params.audio_url };

  const submitRes = await kieRequest(apiKey, '/api/v1/jobs/createTask', 'POST', {
    model: kieModel,
    input,
  });
  const taskId = submitRes.data?.taskId;
  if (!taskId) throw new Error('No taskId returned from Kie.ai');

  return pollDirectKieResult(apiKey, taskId, false);
}

export async function uploadFile(apiKey, file, onProgress, options = {}) {
  const mode = resolveTransportMode(apiKey, '');
  if (mode === 'bff') {
    const fetchFn = getFetch();
    const token = getSessionToken(apiKey);
    const baseUrl = clientConfig.bffBaseUrl.replace(/\/$/, '');
    const inferredMime = file?.type || inferMimeFromFilename(file?.name || 'upload.png');
    const dataUrl = await fileToDataUrl(file, inferredMime);
    const headers = {
      'Content-Type': 'application/json',
      'X-Timecapsule-CSRF': '1',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetchFn(`${baseUrl}/uploads`, {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify({
        dataUrl,
        filename: file?.name || 'upload.png',
        contentType: inferredMime,
        ...(options?.provider ? { provider: options.provider } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      throw new Error(data.error || `Upload failed (${res.status})`);
    }
    if (onProgress) onProgress(100);
    return data.url;
  }

  if (!apiKey) throw new Error('API_KEY_REQUIRED');

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadPath', 'studio/uploads');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${clientConfig.kieBaseUrl.replace(/\/$/, '')}/api/file-stream-upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const url = data.data?.downloadUrl || data.data?.fileUrl || data.url || data.file_url;
          if (!url) reject(new Error('No URL in upload response'));
          else resolve(url);
        } catch {
          reject(new Error('Invalid JSON from upload'));
        }
      } else {
        reject(new Error(`Upload failed: HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

function inferMimeFromFilename(filename = '') {
  const lower = String(filename).toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return 'image/png';
}

function fileToDataUrl(file, defaultMime = 'image/png') {
  if (typeof file === 'string' && file.startsWith('data:')) {
    return Promise.resolve(file);
  }
  if (typeof FileReader !== 'undefined' && file instanceof Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
  if (file && typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer().then((buf) => {
      const base64 = Buffer.from(buf).toString('base64');
      const mime = file.type || defaultMime;
      return `data:${mime};base64,${base64}`;
    });
  }
  return Promise.resolve(`data:${defaultMime};base64,${Buffer.from(String(file || '')).toString('base64')}`);
}

// ─── KieClient Class & Singleton (src/lib/kie.js Contract) ───────────────────

export class KieClient {
  constructor() {
    this.baseUrl =
      typeof import.meta !== 'undefined' && import.meta.env?.DEV ? '/api' : clientConfig.kieBaseUrl;
  }

  getKey() {
    if (typeof window !== 'undefined' && window.__KIE_KEY__) return window.__KIE_KEY__;
    return (
      getStorageItem(TIMECAPSULE_BRAND.storageKeys.apiKey) ||
      getStorageItem(TIMECAPSULE_BRAND.storageKeys.legacyApiKey) ||
      (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_KIE_API_KEY : '') ||
      ''
    );
  }

  setKey(key) {
    setStorageItem(TIMECAPSULE_BRAND.storageKeys.apiKey, key);
    setStorageItem(TIMECAPSULE_BRAND.storageKeys.legacyApiKey, key);
  }

  hasKey() {
    if (getStorageItem(TIMECAPSULE_BRAND.storageKeys.backendMode) === 'bff') return true;
    if (getStorageItem(TIMECAPSULE_BRAND.storageKeys.legacyBackendMode)) return true;
    return !!this.getKey();
  }

  async generateImage(params = {}) {
    return generateImage(this.getKey(), params);
  }

  async generateI2I(params = {}) {
    return generateI2I(this.getKey(), params);
  }

  async generateVideo(params = {}) {
    return generateVideo(this.getKey(), params);
  }

  async generateI2V(params = {}) {
    return generateI2V(this.getKey(), params);
  }

  async processLipSync(params = {}) {
    return processLipSync(this.getKey(), params);
  }

  async uploadFile(file, onProgress) {
    return uploadFile(this.getKey(), file, onProgress);
  }

  async request(path, method = 'GET', body = null) {
    return kieRequest(this.getKey(), path, method, body, this.baseUrl);
  }

  async pollForResult(taskId, isVeo = false) {
    return pollDirectKieResult(this.getKey(), taskId, isVeo, this.baseUrl);
  }
}

export const kie = new KieClient();
