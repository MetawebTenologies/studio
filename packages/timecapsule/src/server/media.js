import { registerAsset, getAsset } from './store.js';
import { isPrivateHostname, validateExternalMediaUrl } from './media-validator.js';

export { isPrivateHostname, validateExternalMediaUrl, getAsset };

/**
 * Persists a non-durable reference to an external provider URL or inline data URL in PostgreSQL.
 * NOTE: This does NOT perform durable object-storage ingestion (R2/S3) or transcoding.
 */
export async function registerExternalMediaReference({
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

  const isInlineData = validated.url.startsWith('data:');
  const asset = await registerAsset({
    job_id: jobId,
    tenant_id: tenantId,
    source_url: validated.url,
    modality,
    content_type: inferredMime,
    storage_type: isInlineData ? 'inline_data_url' : 'external_url_reference',
    durable: false,
    private: true,
    status: 'reference_registered',
  });

  return {
    asset_id: asset.asset_id,
    url: asset.url,
    source_url: asset.source_url,
    content_type: asset.content_type,
    storage_type: asset.storage_type,
    durable: false,
  };
}

export const ingestCompletedMedia = registerExternalMediaReference;
