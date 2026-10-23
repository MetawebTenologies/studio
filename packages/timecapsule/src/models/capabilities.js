import { SUPPORTED_RELEASE_MODELS, getSupportedReleaseModel } from './release-catalog.js';
import {
  t2iModels,
  i2iModels,
  t2vModels,
  i2vModels,
  lipsyncModels,
  v2vModels,
  getModelById,
  getI2IModelById,
  getVideoModelById,
  getI2VModelById,
  getLipSyncModelById,
  getV2VModelById,
} from './upstream-catalog.js';

function normalizeAspectRatios(rawList, isVideo = false) {
  if (Array.isArray(rawList) && rawList.length > 0) {
    return rawList.map(String);
  }
  return isVideo
    ? ['16:9', '9:16', '1:1', '4:3', '21:9']
    : ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'];
}

function normalizeResolutions(rawList, isVideo = false) {
  if (Array.isArray(rawList) && rawList.length > 0) {
    return rawList.map((r) => String(r).toLowerCase());
  }
  return isVideo ? ['720p', '1080p'] : ['1k', '2k', '4k'];
}

function normalizeDurations(rawList) {
  if (Array.isArray(rawList) && rawList.length > 0) {
    return rawList.map(Number).filter(Number.isFinite);
  }
  return [5, 10];
}

/**
 * Resolves unified capability metadata for a model ID or slug.
 * Prioritizes release catalog, then falls back to upstream catalog.
 */
export function getModelCapabilities(slug) {
  if (!slug || typeof slug !== 'string') return null;
  const id = slug.trim();

  // 1. Check verified release catalog first
  const releaseModel = getSupportedReleaseModel(id);
  if (releaseModel) {
    const isVideo = releaseModel.modality === 'video' || releaseModel.modality === 'i2v';
    const isReference =
      releaseModel.modality === 'i2i' ||
      releaseModel.modality === 'i2v' ||
      Boolean(releaseModel.imageField);

    const aspectEnum = releaseModel.inputs?.aspect_ratio?.enum;
    const resEnum = releaseModel.inputs?.resolution?.enum;
    const durEnum = releaseModel.inputs?.duration?.enum;

    return {
      id: releaseModel.id,
      name: releaseModel.id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      modality: releaseModel.modality,
      primary_provider: releaseModel.primary_provider,
      verification_status: releaseModel.verification_status,
      enabled: releaseModel.enabled !== false,
      disabled_reason: releaseModel.disabled_reason || null,
      allowed_aspect_ratios: normalizeAspectRatios(aspectEnum, isVideo),
      allowed_resolutions: normalizeResolutions(resEnum, isVideo),
      allowed_qualities: isVideo ? ['standard', 'high'] : ['standard', 'high', 'ultra'],
      allowed_durations: isVideo ? normalizeDurations(durEnum) : [],
      supports_reference_images: isReference,
      max_reference_images: isReference ? (releaseModel.maxImages || 4) : 0,
      supports_prompt: releaseModel.hasPrompt !== false,
      default_aspect_ratio: releaseModel.inputs?.aspect_ratio?.default || (isVideo ? '16:9' : '1:1'),
      default_resolution: (releaseModel.inputs?.resolution?.default || (isVideo ? '720p' : '1k')).toLowerCase(),
      default_duration: isVideo ? (releaseModel.inputs?.duration?.default || 5) : null,
      credit_estimate_policy: releaseModel.credit_estimate_policy || null,
      estimated_credits: releaseModel.estimatedCredits || (isVideo ? 350 : 10),
    };
  }

  // 2. Check upstream catalog
  const upstream =
    getModelById(id) ||
    getI2IModelById(id) ||
    getVideoModelById(id) ||
    getI2VModelById(id) ||
    getLipSyncModelById(id) ||
    getV2VModelById(id);

  const isVideo =
    id.includes('video') ||
    id.includes('t2v') ||
    id.includes('i2v') ||
    id.includes('veo') ||
    id.includes('seedance') ||
    id.includes('wan') ||
    id.includes('kling');

  const isReference =
    id.includes('i2i') ||
    id.includes('i2v') ||
    id.includes('edit') ||
    id.includes('reference') ||
    id.includes('upscal') ||
    Boolean(upstream?.imageField);

  const aspectEnum = upstream?.inputs?.aspect_ratio?.enum;
  const resEnum = upstream?.inputs?.resolution?.enum;
  const durEnum = upstream?.inputs?.duration?.enum;

  return {
    id,
    name: upstream?.name || id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    modality: isVideo ? (isReference ? 'i2v' : 'video') : isReference ? 'i2i' : 'image',
    primary_provider: upstream?.provider || 'unverified',
    verification_status: 'catalog_only',
    enabled: false,
    disabled_reason: 'Model is catalog-only; contract unverified on live provider gateway',
    allowed_aspect_ratios: normalizeAspectRatios(aspectEnum, isVideo),
    allowed_resolutions: normalizeResolutions(resEnum, isVideo),
    allowed_qualities: isVideo ? ['standard', 'high'] : ['standard', 'high', 'ultra'],
    allowed_durations: isVideo ? normalizeDurations(durEnum) : [],
    supports_reference_images: isReference,
    max_reference_images: isReference ? (upstream?.maxImages || 4) : 0,
    supports_prompt: upstream?.hasPrompt !== false,
    default_aspect_ratio: upstream?.inputs?.aspect_ratio?.default || (isVideo ? '16:9' : '1:1'),
    default_resolution: (upstream?.inputs?.resolution?.default || (isVideo ? '720p' : '1k')).toLowerCase(),
    default_duration: isVideo ? (upstream?.inputs?.duration?.default || 5) : null,
  };
}
