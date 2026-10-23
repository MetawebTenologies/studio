import {
  requireSession,
  verifyMutationOrigin,
} from '../../../../packages/timecapsule/src/server/auth.js';
import { registerAsset, listTenantUploads } from '../../../../packages/timecapsule/src/server/store.js';
import { uploadFileToMuapi } from '../../../../packages/timecapsule/src/server/adapters/muapi.js';
import { uploadFileToKie } from '../../../../packages/timecapsule/src/server/adapters/kie.js';
import { validateExternalMediaUrl } from '../../../../packages/timecapsule/src/server/media.js';
import { checkRateLimit } from '../../../../packages/timecapsule/src/server/rateLimit.js';
import { handleCorsPreflight, getCorsHeaders } from '../../../../packages/timecapsule/src/server/cors.js';
import { sanitizeError } from '../../../../packages/timecapsule/src/server/credentials.js';

export async function OPTIONS(request) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  return new Response(null, { status: 204 });
}

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

export function validateFileMagicBytes(buffer, contentType) {
  if (!buffer || buffer.length < 4) {
    const err = new Error('Upload payload is too short to verify file signature');
    err.code = 'INVALID_FILE_SIGNATURE';
    err.statusCode = 415;
    throw err;
  }

  const mime = String(contentType || '').trim().toLowerCase();

  if (mime === 'image/png') {
    if (
      buffer.length < 8 ||
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47 ||
      buffer[4] !== 0x0d ||
      buffer[5] !== 0x0a ||
      buffer[6] !== 0x1a ||
      buffer[7] !== 0x0a
    ) {
      const err = new Error('File signature does not match image/png (invalid PNG header)');
      err.code = 'MAGIC_BYTE_MISMATCH';
      err.statusCode = 415;
      throw err;
    }
    return true;
  }

  if (mime === 'image/jpeg') {
    if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      const err = new Error('File signature does not match image/jpeg (invalid JPEG header)');
      err.code = 'MAGIC_BYTE_MISMATCH';
      err.statusCode = 415;
      throw err;
    }
    return true;
  }

  if (mime === 'image/webp') {
    if (
      buffer.length < 12 ||
      buffer.toString('ascii', 0, 4) !== 'RIFF' ||
      buffer.toString('ascii', 8, 12) !== 'WEBP'
    ) {
      const err = new Error('File signature does not match image/webp (missing RIFF/WEBP header)');
      err.code = 'MAGIC_BYTE_MISMATCH';
      err.statusCode = 415;
      throw err;
    }
    return true;
  }

  if (mime === 'video/mp4' || mime === 'video/quicktime') {
    if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') {
      return true;
    }
    if (
      mime === 'video/quicktime' &&
      buffer.length >= 8 &&
      (buffer.toString('ascii', 4, 8) === 'moov' || buffer.toString('ascii', 4, 8) === 'wide')
    ) {
      return true;
    }
    const err = new Error(`File signature does not match ${mime} (missing ftyp/moov atom)`);
    err.code = 'MAGIC_BYTE_MISMATCH';
    err.statusCode = 415;
    throw err;
  }

  if (mime === 'video/webm') {
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x1a ||
      buffer[1] !== 0x45 ||
      buffer[2] !== 0xdf ||
      buffer[3] !== 0xa3
    ) {
      const err = new Error('File signature does not match video/webm (missing EBML header)');
      err.code = 'MAGIC_BYTE_MISMATCH';
      err.statusCode = 415;
      throw err;
    }
    return true;
  }

  if (mime === 'audio/wav' || mime === 'audio/x-wav') {
    if (
      buffer.length < 12 ||
      buffer.toString('ascii', 0, 4) !== 'RIFF' ||
      buffer.toString('ascii', 8, 12) !== 'WAVE'
    ) {
      const err = new Error('File signature does not match audio/wav (missing RIFF/WAVE header)');
      err.code = 'MAGIC_BYTE_MISMATCH';
      err.statusCode = 415;
      throw err;
    }
    return true;
  }

  if (mime === 'audio/mpeg' || mime === 'audio/mp3') {
    const hasId3 = buffer.length >= 3 && buffer.toString('ascii', 0, 3) === 'ID3';
    const hasFrameSync = buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
    if (!hasId3 && !hasFrameSync) {
      const err = new Error('File signature does not match audio/mpeg (missing ID3/MPEG header)');
      err.code = 'MAGIC_BYTE_MISMATCH';
      err.statusCode = 415;
      throw err;
    }
    return true;
  }

  // Task C3: Fail-closed for any MIME type not explicitly handled.
  // Note: Remote-URL uploads cannot be signature-checked at write time and rely strictly on SSRF validation.
  const err = new Error(`File signature verification failed: unhandled or unrecognized MIME type "${mime}".`);
  err.code = 'MAGIC_BYTE_MISMATCH';
  err.statusCode = 415;
  throw err;
}

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
  const corsHeaders = getCorsHeaders(request);
  let rateHeaders = {};
  try {
    verifyMutationOrigin(request);
    const session = await requireSession(request);

    // Abuse prevention & rate limiting (Security Task B1)
    const rateStatus = checkRateLimit(request, { action: 'uploads', session });
    rateHeaders = rateStatus.headers;

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

    validateFileMagicBytes(buffer, contentType);

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
        user_id: session.user_id,
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
      user_id: session.user_id,
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
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...rateHeaders,
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    const safe = sanitizeError(err, err.statusCode || err.status || 500);
    return Response.json(
      {
        error: safe.error,
        code: safe.code,
      },
      {
        status: safe.statusCode,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...(err.headers || {}),
          ...corsHeaders,
        },
      }
    );
  }
}

export async function GET(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const session = await requireSession(request);
    checkRateLimit(request, { action: 'default', session });
    const { searchParams } = new URL(request.url);

    // Validate limit parameter (Task C2: handle NaN and non-positive numbers gracefully)
    const rawLimit = searchParams.get('limit');
    let parsedLimit = parseInt(rawLimit || '50', 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      parsedLimit = 50;
    }
    const limit = Math.min(Math.max(1, parsedLimit), 100);
    const cursor = searchParams.get('cursor') || null;

    const uploads = await listTenantUploads({
      tenant_id: session.tenant_id,
      user_id: session.user_id,
      limit,
      cursor,
    });

    return Response.json(
      {
        ok: true,
        tenant_id: session.tenant_id,
        uploads: uploads.map((u) => ({
          asset_id: u.asset_id,
          url: u.url,
          filename: u.filename,
          content_type: u.content_type,
          created_at: u.created_at,
          thumbnail_url: u.thumbnail_url,
          metadata: u.metadata,
        })),
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    const safe = sanitizeError(err, err.statusCode || err.status || 500);
    return Response.json(
      {
        error: safe.error,
        code: safe.code,
      },
      {
        status: safe.statusCode,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...(err.headers || {}),
          ...corsHeaders,
        },
      }
    );
  }
}
