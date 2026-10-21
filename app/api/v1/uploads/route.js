import {
  requireSession,
  verifyMutationOrigin,
} from '../../../../packages/timecapsule/src/server/auth.js';
import { registerAsset } from '../../../../packages/timecapsule/src/server/store.js';
import { uploadFileToMuapi } from '../../../../packages/timecapsule/src/server/adapters/muapi.js';
import { uploadFileToKie } from '../../../../packages/timecapsule/src/server/adapters/kie.js';
import { validateExternalMediaUrl } from '../../../../packages/timecapsule/src/server/media.js';

export const ALLOWED_UPLOAD_MIME_LIMITS = Object.freeze({
  'image/jpeg': 10 * 1024 * 1024, // 10 MB
  'image/png': 10 * 1024 * 1024, // 10 MB
  'image/webp': 10 * 1024 * 1024, // 10 MB
  'video/mp4': 50 * 1024 * 1024, // 50 MB
  'video/quicktime': 50 * 1024 * 1024, // 50 MB
  'video/webm': 50 * 1024 * 1024, // 50 MB
  'audio/mpeg': 25 * 1024 * 1024, // 25 MB
  'audio/mp3': 25 * 1024 * 1024, // 25 MB
  'audio/wav': 25 * 1024 * 1024, // 25 MB
  'audio/x-wav': 25 * 1024 * 1024, // 25 MB
});

function parseDataUrlPayload(dataUrl, declaredContentType) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    const err = new Error('A valid base64 dataUrl (starting with data:) is required');
    err.statusCode = 400;
    err.code = 'INVALID_UPLOAD_DATA';
    throw err;
  }

  const match = dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) {
    const err = new Error('Malformed base64 dataUrl; expected data:<mime>;base64,<payload>');
    err.statusCode = 400;
    err.code = 'INVALID_UPLOAD_DATA';
    throw err;
  }

  const dataUrlMime = match[1].trim().toLowerCase();
  const normalizedDeclared = declaredContentType ? declaredContentType.trim().toLowerCase() : '';
  if (
    normalizedDeclared &&
    normalizedDeclared !== 'application/octet-stream' &&
    normalizedDeclared !== dataUrlMime
  ) {
    const err = new Error(
      `Declared contentType "${normalizedDeclared}" does not match dataUrl MIME "${dataUrlMime}"`
    );
    err.statusCode = 400;
    err.code = 'UPLOAD_MIME_MISMATCH';
    throw err;
  }

  const buffer = Buffer.from(match[2], 'base64');
  return {
    buffer,
    contentType: dataUrlMime,
    dataUrl,
  };
}

function resolveUploadProvider(requestedProvider) {
  const explicit = typeof requestedProvider === 'string' ? requestedProvider.trim().toLowerCase() : '';
  const defaultProvider =
    typeof process.env.TIMECAPSULE_DEFAULT_PROVIDER === 'string' &&
    process.env.TIMECAPSULE_DEFAULT_PROVIDER.trim()
      ? process.env.TIMECAPSULE_DEFAULT_PROVIDER.trim().toLowerCase()
      : 'muapi';

  const provider = explicit || defaultProvider;
  if (provider !== 'muapi' && provider !== 'kie') {
    const err = new Error(`Unsupported upload provider "${provider}". Allowed providers: muapi, kie.`);
    err.statusCode = 400;
    err.code = 'UNSUPPORTED_PROVIDER';
    throw err;
  }
  return provider;
}

export async function POST(request) {
  try {
    verifyMutationOrigin(request);
    const session = await requireSession(request);

    const reqContentType = (request.headers.get('content-type') || '').toLowerCase();
    let buffer;
    let contentType;
    let filename = 'upload.bin';
    let dataUrl = '';
    let requestedProvider = '';

    if (reqContentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      requestedProvider = String(formData.get('provider') || '').trim();
      if (!file || typeof file.arrayBuffer !== 'function') {
        return Response.json(
          { error: 'Multipart upload requires a "file" field', code: 'INVALID_UPLOAD_DATA' },
          { status: 400, headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
        );
      }
      buffer = Buffer.from(await file.arrayBuffer());
      contentType = String(file.type || formData.get('contentType') || '')
        .trim()
        .toLowerCase();
      filename = String(file.name || formData.get('filename') || 'upload.bin').trim();
      dataUrl = `data:${contentType || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    } else {
      const body = await request.json().catch(() => ({}));
      filename = String(body.filename || 'upload.bin').trim();
      requestedProvider = String(body.provider || '').trim();
      const parsed = parseDataUrlPayload(body.dataUrl, body.contentType);
      buffer = parsed.buffer;
      contentType = parsed.contentType;
      dataUrl = parsed.dataUrl;
    }

    const maxBytes = ALLOWED_UPLOAD_MIME_LIMITS[contentType];
    if (!maxBytes) {
      return Response.json(
        {
          error: `Unsupported upload MIME type "${contentType || 'unknown'}". Allowed types: ${Object.keys(ALLOWED_UPLOAD_MIME_LIMITS).join(', ')}`,
          code: 'UNSUPPORTED_MEDIA_TYPE',
        },
        {
          status: 415,
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        }
      );
    }

    if (!buffer || buffer.byteLength === 0) {
      return Response.json(
        { error: 'Uploaded file payload cannot be empty', code: 'EMPTY_UPLOAD_PAYLOAD' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        }
      );
    }

    if (buffer.byteLength > maxBytes) {
      return Response.json(
        {
          error: `Upload size (${buffer.byteLength} bytes) exceeds maximum allowed (${maxBytes} bytes) for ${contentType}`,
          code: 'PAYLOAD_TOO_LARGE',
          max_bytes: maxBytes,
          actual_bytes: buffer.byteLength,
        },
        {
          status: 413,
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        }
      );
    }

    const provider = resolveUploadProvider(requestedProvider);
    const hasProviderKey =
      provider === 'muapi'
        ? Boolean(process.env.MUAPI_API_KEY && process.env.MUAPI_API_KEY.trim())
        : Boolean(process.env.KIE_API_KEY && process.env.KIE_API_KEY.trim());

    if (!hasProviderKey) {
      if (process.env.TIMECAPSULE_TEST_MODE !== '1') {
        const requiredKeyName = provider === 'muapi' ? 'MUAPI_API_KEY' : 'KIE_API_KEY';
        return Response.json(
          {
            error: `Upload provider credentials (${requiredKeyName}) for provider "${provider}" are not configured on the server. Silent fallback to another provider is disabled.`,
            code: 'PROVIDER_CREDENTIALS_MISSING',
            provider,
          },
          {
            status: 503,
            headers: { 'Cache-Control': 'private, no-store, max-age=0' },
          }
        );
      }

      const asset = await registerAsset({
        tenant_id: session.tenant_id,
        provider,
        source_url: dataUrl,
        modality: 'upload',
        content_type: contentType,
        size_bytes: buffer.byteLength,
        storage_type: 'inline_data_url',
        durable: false,
        private: true,
        filename,
      });

      return Response.json(
        {
          ok: true,
          asset_id: asset.asset_id,
          provider,
          url: asset.url,
          delivery_url: asset.url,
          storage_type: 'inline_data_url',
          durable: false,
          content_type: contentType,
          size_bytes: buffer.byteLength,
        },
        {
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        }
      );
    }

    const uploadResult =
      provider === 'muapi'
        ? await uploadFileToMuapi({ buffer, filename, contentType })
        : await uploadFileToKie({ buffer, dataUrl, filename, contentType });

    const remoteUrl = uploadResult?.url;
    await validateExternalMediaUrl(remoteUrl);

    const asset = await registerAsset({
      tenant_id: session.tenant_id,
      provider,
      source_url: remoteUrl,
      modality: 'upload',
      content_type: contentType,
      size_bytes: buffer.byteLength,
      storage_type: 'provider_hosted_upload',
      durable: false,
      private: true,
      filename,
    });

    return Response.json(
      {
        ok: true,
        asset_id: asset.asset_id,
        provider,
        url: remoteUrl,
        delivery_url: asset.url,
        storage_type: 'provider_hosted_upload',
        durable: false,
        content_type: contentType,
        size_bytes: buffer.byteLength,
      },
      {
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  } catch (err) {
    return Response.json(
      {
        error: err.message || 'Upload failed',
        code: err.code || 'UPLOAD_ERROR',
      },
      {
        status: err.statusCode || err.status || 500,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  }
}
