import { registerAsset, getAsset } from './store.js';

export function isPrivateHostname(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.local') || host === '::1') return true;
  if (/^(127|0)\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  const match = host.match(/^172\.(\d+)\./);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return false;
}

export function validateExternalMediaUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    throw new Error('Missing media URL');
  }
  if (urlString.startsWith('data:') || urlString.startsWith('/assets/')) {
    return { protocol: 'local', url: urlString };
  }
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('Invalid media URL');
  }
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error(`Unsupported media protocol: ${parsed.protocol}`);
  }
  if (isPrivateHostname(parsed.hostname)) {
    const err = new Error('Media host is not allowed (private network blocked)');
    err.code = 'SSRF_BLOCKED';
    err.statusCode = 400;
    throw err;
  }
  return { protocol: parsed.protocol, url: parsed.toString(), hostname: parsed.hostname };
}

export async function ingestCompletedMedia({
  jobId,
  tenantId,
  sourceUrl,
  modality = 'image',
  mimeType = null,
}) {
  const validated = validateExternalMediaUrl(sourceUrl);
  const inferredMime =
    mimeType ||
    (modality === 'video' || modality === 'i2v' || modality === 'v2v' || modality === 'lipsync'
      ? 'video/mp4'
      : 'image/png');

  const asset = registerAsset({
    job_id: jobId,
    tenant_id: tenantId,
    source_url: validated.url,
    modality,
    content_type: inferredMime,
    status: 'ready',
  });

  return {
    asset_id: asset.asset_id,
    url: asset.url,
    source_url: asset.source_url,
    content_type: asset.content_type,
  };
}

export { getAsset };
