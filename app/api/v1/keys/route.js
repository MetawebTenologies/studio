import {
  requireSession,
  verifyMutationOrigin,
} from '../../../../packages/timecapsule/src/server/auth.js';
import {
  createCustomerApiKey,
  listCustomerApiKeys,
} from '../../../../packages/timecapsule/src/server/keys.js';
import { handleCorsPreflight, getCorsHeaders } from '../../../../packages/timecapsule/src/server/cors.js';
import { sanitizeError } from '../../../../packages/timecapsule/src/server/credentials.js';

export async function OPTIONS(request) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  return new Response(null, { status: 204 });
}

export async function GET(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const session = await requireSession(request);
    const keys = await listCustomerApiKeys({ tenantId: session.tenant_id });
    return Response.json(
      { ok: true, items: keys },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    const safe = sanitizeError(err, err.statusCode || 500);
    return Response.json(
      { ok: false, error: safe.error, code: safe.code },
      {
        status: safe.statusCode,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...corsHeaders,
        },
      }
    );
  }
}

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    verifyMutationOrigin(request);
    const session = await requireSession(request);

    // Only tenant admins, reseller admins, or platform admins can generate developer API keys
    if (
      session.role !== 'platform_admin' &&
      session.role !== 'reseller_admin' &&
      session.role !== 'tenant_admin' &&
      session.role !== 'admin'
    ) {
      const err = new Error('Forbidden: Only tenant administrators can create API keys');
      err.code = 'FORBIDDEN';
      err.statusCode = 403;
      throw err;
    }

    const body = await request.json().catch(() => ({}));
    const key = await createCustomerApiKey({
      tenantId: session.tenant_id,
      userId: session.user_id,
      name: body.name,
      scopes: body.scopes,
    });

    return Response.json(
      { ok: true, key },
      {
        status: 201,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    const safe = sanitizeError(err, err.statusCode || 500);
    return Response.json(
      { ok: false, error: safe.error, code: safe.code },
      {
        status: safe.statusCode,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...corsHeaders,
        },
      }
    );
  }
}
