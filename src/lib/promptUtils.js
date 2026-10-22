export const ENHANCE_TAGS = {
  quality: ['professional photography', 'ultra-detailed', '8K resolution', 'high dynamic range', 'award-winning'],
  lighting: ['cinematic lighting', 'golden hour', 'dramatic studio lighting', 'soft diffused light', 'neon glow', 'volumetric rays'],
  mood: ['moody atmosphere', 'serene and peaceful', 'epic and dramatic', 'warm and cozy', 'dark and mysterious'],
  style: ['photorealistic', 'oil painting style', 'watercolor', 'digital art', 'concept art', 'anime style', 'cyberpunk aesthetic'],
};

export const QUICK_PROMPTS = [
  { label: 'Portrait', prompt: 'Professional portrait photograph, shallow depth of field, soft studio lighting, 85mm lens' },
  { label: 'Landscape', prompt: 'Breathtaking landscape photograph, golden hour, wide angle, dramatic clouds, 4K' },
  { label: 'Product', prompt: 'Commercial product photography, clean white background, studio lighting, professional' },
  { label: 'Fantasy', prompt: 'Epic fantasy scene, magical atmosphere, volumetric lighting, highly detailed, concept art' },
  { label: 'Sci-Fi', prompt: 'Futuristic sci-fi environment, neon lights, cyberpunk city, rain reflections, cinematic' },
  { label: 'Food', prompt: 'Professional food photography, appetizing, warm lighting, shallow depth of field, editorial' },
  { label: 'Architecture', prompt: 'Architectural photography, dramatic angles, clean lines, modern design, professional' },
  { label: 'Fashion', prompt: 'High fashion editorial, avant-garde styling, studio lighting, Vogue aesthetic, professional' },
];

export {
  CAMERA_MAP,
  LENS_MAP,
  FOCAL_PERSPECTIVE,
  APERTURE_EFFECT,
  ASSET_URLS,
  CAMERAS,
  LENSES,
  FOCAL_LENGTHS,
  APERTURES,
  buildNanoBananaPrompt,
  resolveCinemaPresets,
} from '../../packages/timecapsule/src/models/cinema.js';
