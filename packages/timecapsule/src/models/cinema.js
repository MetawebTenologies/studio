import defaultPresets from '../config/cinema-presets.json' with { type: 'json' };

/**
 * Resolves cinema preset dictionary, merging tenant-level overrides when present.
 */
export function resolveCinemaPresets(tenantOverrides = null) {
  const base = defaultPresets;
  const overrides = tenantOverrides && typeof tenantOverrides === 'object' ? tenantOverrides : {};

  const cameras = Array.isArray(overrides.cameras) && overrides.cameras.length > 0
    ? overrides.cameras
    : base.cameras;

  const lenses = Array.isArray(overrides.lenses) && overrides.lenses.length > 0
    ? overrides.lenses
    : base.lenses;

  const focalLengths = Array.isArray(overrides.focal_lengths) && overrides.focal_lengths.length > 0
    ? overrides.focal_lengths
    : base.focal_lengths;

  const apertures = Array.isArray(overrides.apertures) && overrides.apertures.length > 0
    ? overrides.apertures
    : base.apertures;

  const cameraMap = Object.fromEntries(cameras.map((c) => [c.name, c.prompt]));
  const lensMap = Object.fromEntries(lenses.map((l) => [l.name, l.prompt]));
  const focalPerspective = Object.fromEntries(focalLengths.map((f) => [f.mm, f.perspective]));
  const apertureEffect = Object.fromEntries(apertures.map((a) => [a.value, a.effect]));

  const assetUrls = {};
  for (const c of cameras) {
    if (c.preview) assetUrls[c.name] = c.preview;
  }
  for (const l of lenses) {
    if (l.preview) assetUrls[l.name] = l.preview;
  }
  for (const a of apertures) {
    if (a.preview) assetUrls[a.value] = a.preview;
  }

  return {
    raw: { cameras, lenses, focal_lengths: focalLengths, apertures },
    CAMERA_MAP: cameraMap,
    LENS_MAP: lensMap,
    FOCAL_PERSPECTIVE: focalPerspective,
    APERTURE_EFFECT: apertureEffect,
    ASSET_URLS: assetUrls,
    CAMERAS: Object.keys(cameraMap),
    LENSES: Object.keys(lensMap),
    FOCAL_LENGTHS: focalLengths.map((f) => f.mm),
    APERTURES: Object.keys(apertureEffect),
  };
}

const defaultResolved = resolveCinemaPresets();

export const CAMERA_MAP = defaultResolved.CAMERA_MAP;
export const LENS_MAP = defaultResolved.LENS_MAP;
export const FOCAL_PERSPECTIVE = defaultResolved.FOCAL_PERSPECTIVE;
export const APERTURE_EFFECT = defaultResolved.APERTURE_EFFECT;
export const ASSET_URLS = defaultResolved.ASSET_URLS;
export const CAMERAS = defaultResolved.CAMERAS;
export const LENSES = defaultResolved.LENSES;
export const FOCAL_LENGTHS = defaultResolved.FOCAL_LENGTHS;
export const APERTURES = defaultResolved.APERTURES;

/**
 * Compiles a cinematic prompt based on camera, lens, focal length and aperture settings.
 */
export function buildNanoBananaPrompt(
  basePrompt,
  camera,
  lens,
  focalLength,
  aperture,
  presets = defaultResolved
) {
  const cameraDesc = presets.CAMERA_MAP[camera] || camera;
  const lensDesc = presets.LENS_MAP[lens] || lens;
  const perspective = presets.FOCAL_PERSPECTIVE[focalLength] || '';
  const depthEffect = presets.APERTURE_EFFECT[aperture] || '';

  const qualityTags = ['professional photography', 'ultra-detailed', '8K resolution'];

  const parts = [
    basePrompt,
    `shot on a ${cameraDesc}`,
    `using a ${lensDesc} at ${focalLength}mm ${perspective ? `(${perspective})` : ''}`,
    `aperture ${aperture}`,
    depthEffect,
    'cinematic lighting',
    'natural color science',
    'high dynamic range',
    qualityTags.join(', '),
  ];

  return parts.filter((p) => p && String(p).trim() !== '').join(', ');
}
