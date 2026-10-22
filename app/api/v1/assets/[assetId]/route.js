import { requireSession } from '../../../../../packages/timecapsule/src/server/auth.js';
import { getAsset } from '../../../../../packages/timecapsule/src/server/media.js';

export async function GET(request, context) {
  try {
    const session = await requireSession(request);
    const resolvedParams = await context.params;
    const asset = await getAsset(resolvedParams.assetId);
    if (!asset) {
      return Response.json(
        { error: 'Asset not found', code: 'ASSET_NOT_FOUND' },
        {
          status: 404,
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        }
      );
    }

    if (session.role !== 'platform_admin' && asset.tenant_id !== session.tenant_id) {
      return Response.json(
        {
          error: 'Forbidden: cross-tenant private asset access is not permitted',
          code: 'FORBIDDEN',
        },
        {
          status: 403,
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        }
      );
    }

    if (typeof asset.source_url === 'string' && asset.source_url.startsWith('data:')) {
      const match = /^data:([^;]+);base64,(.+)$/.exec(asset.source_url);
      if (!match) {
        return Response.json(
          { error: 'Invalid inline asset payload', code: 'INVALID_ASSET_DATA' },
          {
            status: 400,
            headers: { 'Cache-Control': 'private, no-store, max-age=0' },
          }
        );
      }
      const bytes = Buffer.from(match[2], 'base64');
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': match[1] || asset.content_type || 'application/octet-stream',
          'Cache-Control': 'private, no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // Arbitrary remote-fetch asset proxying is disabled until durable object-storage
    // ingestion with DNS-pinned egress is implemented.
    return Response.json(
      {
        error:
          'Remote asset proxy is disabled until durable object-storage ingestion is implemented.',
        code: 'REMOTE_ASSET_PROXY_DISABLED',
        durable: false,
        storage_type: asset.storage_type || 'external_url_reference',
      },
      {
        status: 501,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch (err) {
    return Response.json(
      {
        error: err.message || 'Failed to serve asset',
        code: err.code || 'ASSET_ACCESS_ERROR',
      },
      {
        status: err.statusCode || err.status || 400,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  }
}
