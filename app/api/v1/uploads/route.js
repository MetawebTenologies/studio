import {
  requireSession,
  verifyMutationOrigin,
} from '../../../../packages/timecapsule/src/server/auth.js';
import { registerAsset } from '../../../../packages/timecapsule/src/server/store.js';

export async function POST(request) {
  try {
    verifyMutationOrigin(request);
    const session = await requireSession(request);
    const body = await request.json().catch(() => ({}));
    const dataUrl = String(body.dataUrl || '').trim();
    const filename = String(body.filename || 'upload.bin').trim();
    const contentType = String(body.contentType || 'application/octet-stream').trim();

    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return Response.json(
        { error: 'A valid base64 dataUrl (starting with data:) is required', code: 'INVALID_UPLOAD_DATA' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        }
      );
    }

    const kieKey = process.env.KIE_API_KEY;
    if (!kieKey || !kieKey.trim()) {
      if (process.env.TIMECAPSULE_TEST_MODE !== '1') {
        return Response.json(
          {
            error: 'Upload provider credentials (KIE_API_KEY) are not configured on the server',
            code: 'PROVIDER_CREDENTIALS_MISSING',
          },
          {
            status: 503,
            headers: { 'Cache-Control': 'private, no-store, max-age=0' },
          }
        );
      }

      const asset = registerAsset({
        tenant_id: session.tenant_id,
        source_url: dataUrl,
        modality: 'upload',
        content_type: contentType,
        storage_type: 'inline_data_url',
        durable: false,
        private: true,
        filename,
      });

      return Response.json(
        {
          ok: true,
          asset_id: asset.asset_id,
          url: asset.url,
          delivery_url: asset.url,
          durable: false,
        },
        {
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        }
      );
    }

    const res = await fetch('https://kieai.redpandaai.co/api/file-base64-upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kieKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Data: dataUrl,
        uploadPath: 'timecapsule/uploads',
        fileName: filename,
      }),
    });
    const json = await res.json().catch(() => ({}));
    const remoteUrl = json?.data?.downloadUrl || json?.data?.fileUrl;
    if (!res.ok || !remoteUrl) {
      return Response.json(
        {
          error: json?.msg || json?.error || `Upstream upload failed (${res.status})`,
          code: 'UPSTREAM_UPLOAD_FAILED',
        },
        {
          status: 502,
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        }
      );
    }

    const asset = registerAsset({
      tenant_id: session.tenant_id,
      source_url: remoteUrl,
      modality: 'upload',
      content_type: contentType,
      storage_type: 'external_url_reference',
      durable: false,
      private: true,
      filename,
    });
    return Response.json(
      {
        ok: true,
        asset_id: asset.asset_id,
        url: remoteUrl,
        delivery_url: asset.url,
        durable: false,
      },
      {
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  } catch (err) {
    return Response.json(
      { error: err.message || 'Upload failed', code: err.code || 'UPLOAD_ERROR' },
      {
        status: err.statusCode || err.status || 500,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  }
}
