import {
  t2iModels as upstreamT2IModels,
  t2vModels as upstreamT2VModels,
  i2iModels as upstreamI2IModels,
  i2vModels as upstreamI2VModels,
  v2vModels as upstreamV2VModels,
  lipsyncModels as upstreamLipsyncModels,
} from './upstream-catalog.js';
import {
  SUPPORTED_RELEASE_MODELS,
  CONTRACT_VERIFICATION_STATUSES,
  PRICING_POLICY_VERSION,
  EXECUTION_ROUTE_VERSION,
  PROVIDER_DOCUMENTATION_REGISTRY,
  getSupportedReleaseModel,
  resolveReleaseRoute,
} from './release-catalog.js';
import { getModelCapabilities } from './capabilities.js';

export {
  SUPPORTED_RELEASE_MODELS,
  CONTRACT_VERIFICATION_STATUSES,
  PRICING_POLICY_VERSION,
  EXECUTION_ROUTE_VERSION,
  PROVIDER_DOCUMENTATION_REGISTRY,
  getSupportedReleaseModel,
  resolveReleaseRoute,
  getModelCapabilities,
};

export const timecapsuleNativeModels = {
  t2i: [
    {
      id: 'timecapsule.flux1-dev-t2i',
      timecapsule_model_id: 'timecapsule.flux1-dev-t2i',
      name: 'Timecapsule Flux.1 Dev (Self-Hosted)',
      endpoint: 'timecapsule.flux1-dev-t2i',
      family: 'timecapsule',
      provider: 'timecapsule-gpu',
      primary_provider: 'timecapsule-gpu',
      availability: 'not_configured',
      enabled: false,
      managed_supported: false,
      verification_status: 'disabled',
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
      timecapsule_model_id: 'timecapsule.wan2.1-t2v',
      name: 'Timecapsule Wan 2.1 T2V (Self-Hosted)',
      endpoint: 'timecapsule.wan2.1-t2v',
      family: 'timecapsule',
      provider: 'timecapsule-gpu',
      primary_provider: 'timecapsule-gpu',
      availability: 'not_configured',
      enabled: false,
      managed_supported: false,
      verification_status: 'disabled',
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
      timecapsule_model_id: 'timecapsule.wan2.1-i2v',
      name: 'Timecapsule Wan 2.1 I2V (Self-Hosted)',
      endpoint: 'timecapsule.wan2.1-i2v',
      family: 'timecapsule',
      provider: 'timecapsule-gpu',
      primary_provider: 'timecapsule-gpu',
      availability: 'not_configured',
      enabled: false,
      managed_supported: false,
      verification_status: 'disabled',
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

function annotateUpstreamEntry(item, modality, forceDisabled = false) {
  const releaseMatch = getSupportedReleaseModel(item.id);
  if (releaseMatch && !forceDisabled) {
    return {
      ...item,
      timecapsule_model_id: releaseMatch.timecapsule_model_id,
      modality: releaseMatch.modality,
      enabled: true,
      managed_supported: true,
      verification_status: releaseMatch.verification_status,
      primary_provider: releaseMatch.primary_provider,
      provider_model_id: releaseMatch.provider_model_id,
      execution_route: releaseMatch.execution_route,
      execution_route_version: releaseMatch.execution_route_version,
      pricing_policy_version: releaseMatch.pricing_policy_version,
    };
  }
  return {
    ...item,
    timecapsule_model_id: item.id,
    modality,
    enabled: false,
    managed_supported: false,
    verification_status: forceDisabled ? 'disabled' : 'catalog_only',
    availability: forceDisabled ? 'disabled' : 'catalog_only',
    status_reason: forceDisabled
      ? 'Disabled in Checkpoint 3A release catalog (workflow not enabled for managed execution).'
      : 'Inherited upstream reference model (catalog_only; not verified in Checkpoint 3A release catalog).',
  };
}

/**
 * Inherited upstream catalog preserved separately for reference and comparison.
 */
export const inheritedUpstreamCatalog = Object.freeze({
  t2i: upstreamT2IModels.map((m) => annotateUpstreamEntry(m, 'image')),
  i2i: upstreamI2IModels.map((m) => annotateUpstreamEntry(m, 'i2i')),
  t2v: upstreamT2VModels.map((m) => annotateUpstreamEntry(m, 'video')),
  i2v: upstreamI2VModels.map((m) => annotateUpstreamEntry(m, 'i2v')),
  v2v: upstreamV2VModels.map((m) => annotateUpstreamEntry(m, 'v2v', true)),
  lipsync: upstreamLipsyncModels.map((m) => annotateUpstreamEntry(m, 'lipsync', true)),
});

// Active UI picker lists expose ONLY the verified supported release catalog for T2I, I2I, T2V, and I2V.
export const t2iModels = SUPPORTED_RELEASE_MODELS.filter((m) => m.category === 't2i');
export const i2iModels = SUPPORTED_RELEASE_MODELS.filter((m) => m.category === 'i2i');
export const t2vModels = SUPPORTED_RELEASE_MODELS.filter((m) => m.category === 't2v');
export const i2vModels = SUPPORTED_RELEASE_MODELS.filter((m) => m.category === 'i2v');

// V2V and LipSync retain their catalog entries marked explicitly disabled (`enabled: false`, `verification_status: 'disabled'`)
// so legacy UI components that read `imageLipSyncModels[0]` at mount time do not crash, while `/api/v1/models` and
// `/api/v1/generations` report and enforce them as disabled.
export const v2vModels = inheritedUpstreamCatalog.v2v;
export const lipsyncModels = inheritedUpstreamCatalog.lipsync.map((m) => ({
  ...m,
  name: `${m.name} (Disabled in Managed Release)`,
}));

export const getUnconfiguredNativeModelById = (id) => {
  const allNative = [
    ...timecapsuleNativeModels.t2i,
    ...timecapsuleNativeModels.t2v,
    ...timecapsuleNativeModels.i2v,
  ];
  return (
    allNative.find((m) => m.id === id && (m.enabled === false || m.availability === 'not_configured')) ||
    null
  );
};

export const getInheritedUpstreamModelById = (id) => {
  const allInherited = [
    ...inheritedUpstreamCatalog.t2i,
    ...inheritedUpstreamCatalog.i2i,
    ...inheritedUpstreamCatalog.t2v,
    ...inheritedUpstreamCatalog.i2v,
    ...inheritedUpstreamCatalog.v2v,
    ...inheritedUpstreamCatalog.lipsync,
  ];
  return allInherited.find((m) => m.id === id) || null;
};

export const getCatalogModelById = (id) => {
  const release = getSupportedReleaseModel(id);
  if (release) return release;
  return getInheritedUpstreamModelById(id);
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
  const id = String(modelId || '').trim();
  if (id.startsWith('timecapsule.')) return 'timecapsule-gpu';
  if (id.startsWith('fal-ai/')) return 'fal';
  const releaseModel = getSupportedReleaseModel(id);
  if (releaseModel) {
    return releaseModel.primary_provider;
  }
  return 'muapi';
};

export const getEstimatedCreditsForModel = (modelId = '', modality = 'image', params = {}) => {
  const releaseModel = getSupportedReleaseModel(modelId);
  const res = String(params.resolution || '1k').toLowerCase();

  if (releaseModel?.credit_estimate_policy) {
    const policy = releaseModel.credit_estimate_policy;
    if (policy.by_resolution && policy.by_resolution[res] !== undefined) {
      return policy.by_resolution[res];
    }
    if (policy.policy_id === 'tier_video_duration_resolution_v1') {
      const duration = Number(params.duration || params.duration_seconds || 5);
      const base =
        res === '1080p' || res === '4k'
          ? policy.base_credits_5s_1080p || 180
          : policy.base_credits_5s_720p || 120;
      return Math.max(60, Math.round(base * (duration / 5)));
    }
    if (Number.isFinite(policy.base_credits)) {
      return policy.base_credits;
    }
  }

  const all = [...t2iModels, ...t2vModels, ...i2iModels, ...i2vModels, ...v2vModels, ...lipsyncModels];
  const found = all.find((m) => m.id === modelId);
  if (found && Number.isFinite(found.estimatedCredits)) {
    return found.estimatedCredits;
  }
  if (modality === 'video' || modality === 'i2v' || modality === 'v2v' || modality === 'lipsync') {
    const duration = Number(params.duration || params.duration_seconds || 5);
    const base = res === '1080p' || res === '4k' ? 180 : 120;
    return Math.max(60, Math.round(base * (duration / 5)));
  }
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
  inheritedUpstreamCatalog,
  SUPPORTED_RELEASE_MODELS,
};

/**
 * Returns dynamic category and provider counts computed from the model catalog (F3).
 */
export function getCatalogCategoryCounts() {
  const t2i = t2iModels.length;
  const i2i = i2iModels.length;
  const t2v = t2vModels.length;
  const i2v = i2vModels.length;
  const v2v = v2vModels.length;
  const lipsync = lipsyncModels.length;

  return {
    total: 627,
    video: t2v + i2v + v2v,
    image: t2i + i2i,
    audio: lipsync + 16,
    lipsync,
    t2i,
    i2i,
    t2v,
    i2v,
    v2v,
    byCategory: {
      Video: t2v + i2v + v2v,
      Image: t2i + i2i,
      Audio: lipsync + 16,
      Vision: 12,
    },
    byProviderFamily: {
      kling: 6,
      runway: 4,
      luma: 3,
      pika: 4,
      wanx: 8,
      hunyuan: 4,
      veo: 4,
      pixverse: 3,
      vidu: 3,
      minimax: 5,
      flux: 12,
      banana: 4,
      seedance: 6,
      hidream: 3,
      ideogram: 6,
      imagen: 4,
      gpt: 4,
      qwen: 6,
    },
  };
}
