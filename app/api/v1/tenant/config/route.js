import { resolveTenantFromRequest } from '../../../../../packages/timecapsule/src/server/tenancy.js';
import { extractTokenFromRequest, verifySessionToken } from '../../../../../packages/timecapsule/src/server/auth.js';

export async function GET(request) {
  try {
    const token = extractTokenFromRequest(request);
    const session = verifySessionToken(token);
    const tenant = await resolveTenantFromRequest(request, session);

    return Response.json(
      {
        ok: true,
        tenant_id: tenant.tenant_id,
        slug: tenant.slug || 'default',
        name: tenant.name || 'Timecapsule Studio',
        plan: tenant.plan || 'starter',
        status: tenant.status || 'active',
        branding: tenant.branding || {},
        legal: tenant.legal || {},
        flags: tenant.flags || {},
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message, code: err.code || 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
