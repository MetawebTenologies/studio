import {
  requireSession,
  authenticatePreviewCredential,
  issuePreviewSessionToken,
  verifyMutationOrigin,
} from '../../../../packages/timecapsule/src/server/auth.js';
import { getTenantCredits } from '../../../../packages/timecapsule/src/server/store.js';

const SESSION_MAX_AGE_SECONDS = 8 * 3600;

export async function GET(request) {
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
        },
      }
    );
  } catch (err) {
    return Response.json(
      {
        ok: false,
        authenticated: false,
        code: err.code || 'UNAUTHORIZED',
        error: err.message || 'Authentication required',
      },
      {
        status: err.statusCode || 401,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
        },
      }
    );
  }
}

export async function POST(request) {
  try {
    verifyMutationOrigin(request);
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
        session: identity,
        credits,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          'Set-Cookie': cookieValue,
        },
      }
    );
  } catch (err) {
    return Response.json(
      {
        ok: false,
        code: err.code || 'AUTH_FAILED',
        error: err.message || 'Could not establish private-preview session',
      },
      {
        status: err.statusCode || 401,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
        },
      }
    );
  }
}

export async function DELETE(request) {
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
        },
      }
    );
  } catch (err) {
    return Response.json(
      { ok: false, code: err.code || 'CSRF_ERROR', error: err.message },
      {
        status: err.statusCode || 403,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  }
}
