import {
  t2iModels as upstreamT2IModels,
  t2vModels as upstreamT2VModels,
  i2iModels as upstreamI2IModels,
  i2vModels as upstreamI2VModels,
  v2vModels as upstreamV2VModels,
  lipsyncModels as upstreamLipsyncModels,
} from './upstream-catalog.js';

export const timecapsuleNativeModels = {
  t2i: [
    {
      id: 'timecapsule.flux1-dev-t2i',
      name: 'Timecapsule Flux.1 Dev (Self-Hosted)',
      endpoint: 'timecapsule.flux1-dev-t2i',
      family: 'timecapsule',
      provider: 'timecapsule-gpu',
      availability: 'not_configured',
      enabled: false,
      verified_worker: false,
      status_reason: 'Self-hosted GPU worker execution is not configured or verified.',
      estimatedCredits: 25,
      inputs: {
        prompt: {
          type: 'string',
          title: 'Prompt',
          name: 'prompt',
          description: 'Text prompt describing the image to generate on Timecapsule GPU workers.',
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
          enum: ['1k', '2k'],
          default: '1k',
        },
      },
    },
  ],
  t2v: [
    {
      id: 'timecapsule.wan2.1-t2v',
      name: 'Timecapsule Wan 2.1 T2V (Self-Hosted)',
      endpoint: 'timecapsule.wan2.1-t2v',
      family: 'timecapsule',
      provider: 'timecapsule-gpu',
      availability: 'not_configured',
      enabled: false,
      verified_worker: false,
      status_reason: 'Self-hosted GPU worker execution is not configured or verified.',
      estimatedCredits: 240,
      inputs: {
        prompt: {
          type: 'string',
          title: 'Prompt',
          name: 'prompt',
          description: 'Text prompt describing the video to generate on Timecapsule GPU workers.',
        },
        aspect_ratio: {
          type: 'string',
          title: 'Aspect Ratio',
          name: 'aspect_ratio',
          enum: ['16:9', '9:16', '1:1'],
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
  ],
  i2v: [
    {
      id: 'timecapsule.wan2.1-i2v',
      name: 'Timecapsule Wan 2.1 I2V (Self-Hosted)',
      endpoint: 'timecapsule.wan2.1-i2v',
      family: 'timecapsule',
      provider: 'timecapsule-gpu',
      availability: 'not_configured',
      enabled: false,
      verified_worker: false,
      status_reason: 'Self-hosted GPU worker execution is not configured or verified.',
      imageField: 'image_url',
      hasPrompt: true,
      estimatedCredits: 240,
      inputs: {
        prompt: {
          type: 'string',
          title: 'Prompt',
          name: 'prompt',
          description: 'Prompt guiding motion from the reference frame on Timecapsule GPU workers.',
        },
        aspect_ratio: {
          type: 'string',
          title: 'Aspect Ratio',
          name: 'aspect_ratio',
          enum: ['16:9', '9:16', '1:1'],
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
  ],
};

const filterEnabledModels = (list) =>
  list.filter((m) => m.enabled !== false && m.availability !== 'not_configured');

// Unconfigured self-hosted models are hidden from active picker lists until a verified worker is registered.
export const t2iModels = [
  ...upstreamT2IModels,
  ...filterEnabledModels(timecapsuleNativeModels.t2i),
];
export const t2vModels = [
  ...upstreamT2VModels,
  ...filterEnabledModels(timecapsuleNativeModels.t2v),
];
export const i2iModels = [...upstreamI2IModels];
export const i2vModels = [
  ...upstreamI2VModels,
  ...filterEnabledModels(timecapsuleNativeModels.i2v),
];
export const v2vModels = [...upstreamV2VModels];
export const lipsyncModels = [...upstreamLipsyncModels];

export const getUnconfiguredNativeModelById = (id) => {
  const allNative = [
    ...timecapsuleNativeModels.t2i,
    ...timecapsuleNativeModels.t2v,
    ...timecapsuleNativeModels.i2v,
  ];
  return allNative.find((m) => m.id === id && (m.enabled === false || m.availability === 'not_configured')) || null;
};

export const getCatalogModelById = (id) => {
  const allActive = [
    ...t2iModels,
    ...t2vModels,
    ...i2iModels,
    ...i2vModels,
    ...v2vModels,
    ...lipsyncModels,
  ];
  return allActive.find((m) => m.id === id) || null;
};

export const getModelById = (id) => t2iModels.find((m) => m.id === id);

export const getAspectRatiosForModel = (modelId) => {
  const model = getModelById(modelId);
  if (!model) return ['1:1'];

  const arInput = model.inputs?.aspect_ratio;
  if (arInput && arInput.enum) {
    return arInput.enum;
  }

  return ['1:1', '16:9', '9:16', '4:3', '3:2', '21:9'];
};

export const getVideoModelById = (id) => t2vModels.find((m) => m.id === id);

export const getAspectRatiosForVideoModel = (modelId) => {
  const model = getVideoModelById(modelId);
  if (!model) return ['16:9'];
  const arInput = model.inputs?.aspect_ratio;
  if (arInput && arInput.enum) return arInput.enum;
  return ['16:9', '9:16', '1:1'];
};

export const getDurationsForModel = (modelId) => {
  const model = getVideoModelById(modelId);
  if (!model) return [5];
  const durInput = model.inputs?.duration;
  if (durInput && durInput.enum) return durInput.enum;
  if (durInput) return [durInput.default || 5];
  return [];
};

export const getResolutionsForVideoModel = (modelId) => {
  const model = getVideoModelById(modelId);
  if (!model) return [];
  const resInput = model.inputs?.resolution;
  if (resInput && resInput.enum) return resInput.enum;
  return [];
};

export const getI2IModelById = (id) => i2iModels.find((m) => m.id === id);
export const getI2VModelById = (id) => i2vModels.find((m) => m.id === id);

export const getAspectRatiosForI2IModel = (modelId) => {
  const model = getI2IModelById(modelId);
  if (!model) return ['1:1'];
  if (model.inputs && model.inputs.aspect_ratio && model.inputs.aspect_ratio.enum) {
    return model.inputs.aspect_ratio.enum;
  }
  return ['1:1', '16:9', '9:16'];
};

export const getAspectRatiosForI2VModel = (modelId) => {
  const model = getI2VModelById(modelId);
  if (!model) return ['16:9'];
  if (model.inputs && model.inputs.aspect_ratio && model.inputs.aspect_ratio.enum) {
    return model.inputs.aspect_ratio.enum;
  }
  return ['16:9', '9:16', '1:1'];
};

export const getDurationsForI2VModel = (modelId) => {
  const model = getI2VModelById(modelId);
  if (!model) return [];
  const dur = model.inputs && model.inputs.duration;
  if (!dur) return [];
  if (dur.enum) return dur.enum;
  if (dur.minValue !== undefined && dur.maxValue !== undefined && dur.step) {
    const vals = [];
    for (let v = dur.minValue; v <= dur.maxValue; v += dur.step) vals.push(v);
    return vals;
  }
  if (dur.default) return [dur.default];
  return [];
};

export const getResolutionsForI2VModel = (modelId) => {
  const model = getI2VModelById(modelId);
  if (!model) return [];
  const res = model.inputs && model.inputs.resolution;
  if (res && res.enum) return res.enum;
  return [];
};

export const getModesForModel = (modelId) => {
  const model = [...t2vModels, ...i2vModels].find((m) => m.id === modelId);
  if (!model) return [];
  const modeInput = model.inputs?.mode;
  if (modeInput?.enum) return modeInput.enum;
  return [];
};

export const getResolutionsForI2IModel = (modelId) => {
  const model = getI2IModelById(modelId);
  if (!model) return [];
  if (model.inputs?.resolution?.enum) return model.inputs.resolution.enum;
  if (model.inputs?.quality?.enum) return model.inputs.quality.enum;
  return [];
};

export const getQualityFieldForModel = (modelId) => {
  const model = getModelById(modelId);
  if (!model) return null;
  if (model.inputs?.resolution) return 'resolution';
  if (model.inputs?.quality) return 'quality';
  return null;
};

export const getResolutionsForModel = (modelId) => {
  const model = getModelById(modelId);
  if (!model) return [];
  if (model.inputs?.resolution?.enum) return model.inputs.resolution.enum;
  if (model.inputs?.quality?.enum) return model.inputs.quality.enum;
  return [];
};

export const getQualityFieldForI2IModel = (modelId) => {
  const model = getI2IModelById(modelId);
  if (!model) return null;
  if (model.inputs?.resolution) return 'resolution';
  if (model.inputs?.quality) return 'quality';
  return null;
};

export const getMaxImagesForI2IModel = (modelId) => {
  const model = getI2IModelById(modelId);
  return model?.maxImages || 1;
};

export const getLipSyncModelById = (id) => lipsyncModels.find((m) => m.id === id);

export const getResolutionsForLipSyncModel = (id) => {
  const model = lipsyncModels.find((m) => m.id === id);
  return model?.inputs?.resolution?.enum || [];
};

export const imageLipSyncModels = lipsyncModels.filter((m) => m.category === 'image');
export const videoLipSyncModels = lipsyncModels.filter((m) => m.category === 'video');

export const getV2VModelById = (id) => v2vModels.find((m) => m.id === id);

// ─── Timecapsule Registry & Routing Helpers ──────────────────────────────────

export const getProviderForModel = (modelId = '') => {
  const id = String(modelId || '');
  if (id.startsWith('timecapsule.')) return 'timecapsule-gpu';
  if (id.startsWith('fal-ai/')) return 'fal';
  return 'kie';
};

export const getEstimatedCreditsForModel = (modelId = '', modality = 'image', params = {}) => {
  const all = [...t2iModels, ...t2vModels, ...i2iModels, ...i2vModels, ...v2vModels, ...lipsyncModels];
  const found = all.find((m) => m.id === modelId);
  if (found && Number.isFinite(found.estimatedCredits)) {
    return found.estimatedCredits;
  }
  if (modality === 'video' || modality === 'i2v' || modality === 'v2v' || modality === 'lipsync') {
    const duration = Number(params.duration || params.duration_seconds || 5);
    const res = String(params.resolution || '720p').toLowerCase();
    const base = res === '1080p' || res === '4k' ? 180 : 120;
    return Math.max(60, Math.round(base * (duration / 5)));
  }
  const res = String(params.resolution || '1k').toLowerCase();
  if (res === '4k') return 40;
  if (res === '2k') return 25;
  return 15;
};

export const registerTimecapsuleModel = (category, modelSpec) => {
  if (!modelSpec || !modelSpec.id) {
    throw new Error('Model specification requires an id');
  }
  const targetMap = {
    t2i: t2iModels,
    t2v: t2vModels,
    i2i: i2iModels,
    i2v: i2vModels,
    v2v: v2vModels,
    lipsync: lipsyncModels,
  };
  const target = targetMap[category];
  if (!target) {
    throw new Error(`Unsupported model category: ${category}`);
  }
  const existingIdx = target.findIndex((m) => m.id === modelSpec.id);
  if (existingIdx >= 0) {
    target[existingIdx] = modelSpec;
  } else {
    target.push(modelSpec);
  }
  return modelSpec;
};

export const models = {
  t2iModels,
  t2vModels,
  i2iModels,
  i2vModels,
  v2vModels,
  lipsyncModels,
  imageLipSyncModels,
  videoLipSyncModels,
};
