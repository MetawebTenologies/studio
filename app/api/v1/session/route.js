import {
  requireSession,
  authenticatePreviewCredential,
  issuePreviewSessionToken,
  verifyMutationOrigin,
} from '../../../../packages/timecapsule/src/server/auth.js';
import { getTenantCredits } from '../../../../packages/timecapsule/src/server/store.js';
import { checkRateLimit } from '../../../../packages/timecapsule/src/server/rateLimit.js';
import { handleCorsPreflight, getCorsHeaders } from '../../../../packages/timecapsule/src/server/cors.js';
import { scrubSecrets, sanitizeError } from '../../../../packages/timecapsule/src/server/credentials.js';

const SESSION_MAX_AGE_SECONDS = 8 * 3600;

export async function OPTIONS(request) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  return new Response(null, { status: 204 });
}

export async function GET(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const session = await requireSession(request);
    const credits = await getTenantCredits(session.tenant_id);
    return Response.json(
      {
        ok: true,
        authenticated: true,
        auth_mode: 'private_preview',
        notice: 'Single-tenant private-preview access only (not multi-tenant authentication).',
        session: {
          user_id: session.user_id,
          tenant_id: session.tenant_id,
          role: session.role,
        },
        credits,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    const safe = sanitizeError(err, 401);
    return Response.json(
      {
        ok: false,
        authenticated: false,
        code: safe.code || 'UNAUTHORIZED',
        error: safe.error || 'Authentication required',
      },
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
  let rateHeaders = {};
  try {
    verifyMutationOrigin(request);

    // Abuse prevention & rate limiting (Security Task B1 / S3)
    const rateStatus = checkRateLimit(request, { action: 'auth' });
    rateHeaders = rateStatus.headers;

    const body = await request.json().catch(() => ({}));
    const submittedCredential = String(
      body.access_key || body.preview_key || body.access_code || ''
    );

    // Authenticate credential and derive identity strictly server-side.
    // Client-supplied tenant_id, user_id, and role fields are ignored.
    const identity = authenticatePreviewCredential(submittedCredential);
    const token = issuePreviewSessionToken({ ttlSeconds: SESSION_MAX_AGE_SECONDS });
    const credits = await getTenantCredits(identity.tenant_id);

    const cookieValue = `timecapsule_session=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Strict`;

    return Response.json(
      {
        ok: true,
        auth_mode: 'private_preview',
        notice: 'Single-tenant private-preview access only (not multi-tenant authentication).',
        session: scrubSecrets(identity),
        credits,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          'Set-Cookie': cookieValue,
          ...rateHeaders,
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    const safe = sanitizeError(err, 401);
    return Response.json(
      {
        ok: false,
        code: safe.code || 'AUTH_FAILED',
        error: safe.error || 'Could not establish private-preview session',
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

export async function DELETE(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    verifyMutationOrigin(request);
    const clearCookie =
      'timecapsule_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict';
    return Response.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          'Set-Cookie': clearCookie,
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    const safe = sanitizeError(err, 403);
    return Response.json(
      { ok: false, code: safe.code || 'CSRF_ERROR', error: safe.error },
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
