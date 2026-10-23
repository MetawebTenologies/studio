import {
  requireSession,
  verifyMutationOrigin,
} from '../../../../../packages/timecapsule/src/server/auth.js';
import { revokeCustomerApiKey } from '../../../../../packages/timecapsule/src/server/keys.js';
import { handleCorsPreflight, getCorsHeaders } from '../../../../../packages/timecapsule/src/server/cors.js';
import { sanitizeError } from '../../../../../packages/timecapsule/src/server/credentials.js';

export async function OPTIONS(request) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  return new Response(null, { status: 204 });
}

export async function DELETE(request, context) {
  const corsHeaders = getCorsHeaders(request);
  try {
    verifyMutationOrigin(request);
    const session = await requireSession(request);

    // Only tenant admins, reseller admins, or platform admins can revoke developer API keys
    if (
      session.role !== 'platform_admin' &&
      session.role !== 'reseller_admin' &&
      session.role !== 'tenant_admin' &&
      session.role !== 'admin'
    ) {
      const err = new Error('Forbidden: Only tenant administrators can revoke API keys');
      err.code = 'FORBIDDEN';
      err.statusCode = 403;
      throw err;
    }

    const resolvedParams = await context.params;
    const keyId = resolvedParams.keyId;

    const result = await revokeCustomerApiKey(keyId, {
      tenantId: session.role === 'platform_admin' ? null : session.tenant_id,
    });

    return Response.json(
      { ok: true, ...result },
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
