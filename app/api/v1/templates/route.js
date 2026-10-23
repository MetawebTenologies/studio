import crypto from 'crypto';
import { resolveTenantFromRequest } from '../../../../packages/timecapsule/src/server/tenancy.js';
import { extractTokenFromRequest, verifySessionToken } from '../../../../packages/timecapsule/src/server/auth.js';
import { handleCorsPreflight, getCorsHeaders } from '../../../../packages/timecapsule/src/server/cors.js';
import { sanitizeError } from '../../../../packages/timecapsule/src/server/credentials.js';
import { getTemplatesForTenant } from '../../../../packages/timecapsule/src/server/templates.js';

export async function OPTIONS(request) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  return new Response(null, { status: 204 });
}

export async function GET(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const token = extractTokenFromRequest(request);
    const session = verifySessionToken(token);
    const tenant = await resolveTenantFromRequest(request, session);

    const templates = await getTemplatesForTenant(tenant.tenant_id);

    const payload = {
      ok: true,
      templates,
    };

    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload), 'utf8')
      .digest('hex')
      .slice(0, 16);
    const etag = `W/"${contentHash}"`;

    const clientIfNoneMatch = request.headers.get('if-none-match');
    if (clientIfNoneMatch && (clientIfNoneMatch === etag || clientIfNoneMatch === contentHash)) {
      return new Response(null, {
        status: 304,
        headers: {
          'Cache-Control': 'private, max-age=60',
          ETag: etag,
          Vary: 'Cookie, Authorization, Host',
          ...corsHeaders,
        },
      });
    }

    return Response.json(payload, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        ETag: etag,
        Vary: 'Cookie, Authorization, Host',
        ...corsHeaders,
      },
    });
  } catch (err) {
    const safe = sanitizeError(err, err.statusCode || 500);
    return Response.json(
      { ok: false, error: safe.error, code: safe.code },
      {
        status: safe.statusCode,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0',
          ...corsHeaders,
        },
      }
    );
  }
}
