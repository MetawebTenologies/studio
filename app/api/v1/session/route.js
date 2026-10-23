import {
  requireSession,
  authenticatePreviewCredential,
  issuePreviewSessionToken,
  issueTenantSessionToken,
  extractTokenFromRequest,
  verifySessionToken,
  verifyMutationOrigin,
} from '../../../../packages/timecapsule/src/server/auth.js';
import { getTenantCredits } from '../../../../packages/timecapsule/src/server/store.js';
import { checkRateLimit } from '../../../../packages/timecapsule/src/server/rateLimit.js';
import { handleCorsPreflight, getCorsHeaders } from '../../../../packages/timecapsule/src/server/cors.js';
import { scrubSecrets, sanitizeError } from '../../../../packages/timecapsule/src/server/credentials.js';
import { verifyFirebaseIdToken } from '../../../../packages/timecapsule/src/server/firebaseAuth.js';
import {
  provisionFirebaseUserAndTenant,
  revokeUserSessions,
} from '../../../../packages/timecapsule/src/server/tenants.js';

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
        auth_mode: session.auth_mode || 'tenant_session',
        notice:
          session.auth_mode === 'private_preview'
            ? 'Single-tenant private-preview access only.'
            : undefined,
        session: {
          user_id: session.user_id,
          tenant_id: session.tenant_id,
          role: session.role,
          email: session.email || null,
          email_verified: Boolean(session.email_verified),
          name: session.name || 'User',
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

    // Branch A: Firebase ID Token Exchange
    if (body.id_token && typeof body.id_token === 'string') {
      const decoded = await verifyFirebaseIdToken(body.id_token);

      const provisioned = await provisionFirebaseUserAndTenant({
        firebaseUid: decoded.uid,
        email: decoded.email,
        emailVerified: decoded.email_verified,
        name: decoded.name,
      });

      const token = issueTenantSessionToken({
        userId: provisioned.user.user_id,
        tenantId: provisioned.tenantId,
        role: provisioned.role,
        email: provisioned.user.email,
        emailVerified: provisioned.user.email_verified,
        tokenVersion: provisioned.user.token_version,
        name: decoded.name,
        ttlSeconds: SESSION_MAX_AGE_SECONDS,
      });

      const credits = await getTenantCredits(provisioned.tenantId);
      const cookieValue = `timecapsule_session=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;

      return Response.json(
        {
          ok: true,
          authenticated: true,
          auth_mode: 'tenant_session',
          session: {
            user_id: provisioned.user.user_id,
            tenant_id: provisioned.tenantId,
            role: provisioned.role,
            email: provisioned.user.email,
            email_verified: Boolean(provisioned.user.email_verified),
            name: decoded.name,
          },
          credits,
          is_new_user: Boolean(provisioned.isNewUser),
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
    }

    // Branch B: Legacy Private Preview Credential
    const submittedCredential = String(
      body.access_key || body.preview_key || body.access_code || ''
    );

    if (process.env.NODE_ENV === 'production') {
      const err = new Error(
        'Private-preview credentials are disabled in production. Use authenticated provider login.'
      );
      err.code = 'PREVIEW_AUTH_DISABLED_IN_PRODUCTION';
      err.statusCode = 401;
      throw err;
    }

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
    const safe = sanitizeError(err, err.statusCode || err.status || 401);
    return Response.json(
      {
        ok: false,
        code: safe.code || 'AUTH_FAILED',
        error: safe.error || 'Authentication failed',
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

    // If an active tenant session is present, increment token_version in DB to revoke all active tokens
    const rawToken = extractTokenFromRequest(request);
    const session = verifySessionToken(rawToken);
    if (session && session.auth_mode === 'tenant_session' && session.user_id) {
      try {
        await revokeUserSessions(session.user_id);
      } catch (err) {
        // Log revocation failure without blocking cookie clear
      }
    }

    const clearCookie =
      'timecapsule_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax';
    return Response.json(
      { ok: true, revoked: true },
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
