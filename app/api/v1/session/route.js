import { NextResponse } from 'next/server';
import {
  requireSession,
  issueSessionToken,
} from '../../../../packages/timecapsule/src/server/auth.js';
import { getTenantCredits } from '../../../../packages/timecapsule/src/server/store.js';

export async function GET(request) {
  try {
    const session = await requireSession(request);
    const credits = getTenantCredits(session.tenant_id);
    return NextResponse.json({
      ok: true,
      authenticated: true,
      session,
      credits,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, authenticated: false, error: err.message },
      { status: err.statusCode || 401 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || 'Timecapsule Creator').trim();
    const tenantId = String(body.tenant_id || 'org_default').trim();
    const userId = String(body.user_id || `usr_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`).trim();

    const token = issueSessionToken({ userId, tenantId, name });
    const credits = getTenantCredits(tenantId);

    const response = NextResponse.json({
      ok: true,
      token,
      session: { user_id: userId, tenant_id: tenantId, name },
      credits,
    });

    response.cookies.set('tc_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Could not create session' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('tc_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
