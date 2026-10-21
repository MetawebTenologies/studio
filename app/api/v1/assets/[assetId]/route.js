import {
  getAsset,
  validateExternalMediaUrl,
} from '../../../../../packages/timecapsule/src/server/media.js';

export async function GET(request, context) {
  try {
    const resolvedParams = await context.params;
    const asset = getAsset(resolvedParams.assetId);
    if (!asset) {
      return new Response('Asset not found', { status: 404 });
    }

    if (asset.source_url.startsWith('data:')) {
      const match = /^data:([^;]+);base64,(.+)$/.exec(asset.source_url);
      if (!match) return new Response('Invalid data URL', { status: 400 });
      const bytes = Buffer.from(match[2], 'base64');
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': match[1] || asset.content_type || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    const validated = validateExternalMediaUrl(asset.source_url);
    const upstream = await fetch(validated.url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Timecapsule-Media-Gateway/1.0' },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(`Upstream media fetch failed (${upstream.status})`, { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type':
          upstream.headers.get('content-type') || asset.content_type || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return new Response(err.message || 'Failed to serve asset', {
      status: err.statusCode || 400,
    });
  }
}
