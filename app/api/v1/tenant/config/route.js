import crypto from 'crypto';
import { resolveTenantFromRequest } from '../../../../../packages/timecapsule/src/server/tenancy.js';
import { extractTokenFromRequest, verifySessionToken } from '../../../../../packages/timecapsule/src/server/auth.js';
import { sanitizeBrandingAtReadTime } from '../../../../../packages/timecapsule/src/server/brandingValidation.js';

// Explicit public whitelist for tenant configuration (P0-2 / S5)
const ALLOWED_PUBLIC_FLAGS = new Set([
  'enable_video',
  'enable_upscale',
  'custom_domain_enabled',
  'allow_user_registration',
  'maintenance_mode',
]);

export function sanitizePublicTenantConfig(tenant) {
  if (!tenant) return null;

  // Filter & sanitize branding to whitelisted fields and safe formats only (Task B1)
  const rawBranding = tenant.branding && typeof tenant.branding === 'object' ? tenant.branding : {};
  const sanitizedBranding = sanitizeBrandingAtReadTime(rawBranding);

  // Filter flags strictly: NEVER return raw flags object (S5)
  const rawFlags = tenant.flags && typeof tenant.flags === 'object' ? tenant.flags : {};
  const sanitizedFlags = {};
  for (const [key, val] of Object.entries(rawFlags)) {
    if (ALLOWED_PUBLIC_FLAGS.has(key)) {
      sanitizedFlags[key] = Boolean(val);
    }
  }

  // Whitelisted public fields only: never leak spend ceilings, raw flags, or internal metadata
  return {
    ok: true,
    tenant_id: tenant.tenant_id,
    slug: tenant.slug || 'default',
    name: tenant.name || 'Timecapsule Studio',
    status: tenant.status || 'active',
    branding: sanitizedBranding,
    flags: sanitizedFlags,
  };
}

export async function GET(request) {
  try {
    const token = extractTokenFromRequest(request);
    const session = verifySessionToken(token);
    const tenant = await resolveTenantFromRequest(request, session);

    const publicConfig = sanitizePublicTenantConfig(tenant);

    // Compute deterministic ETag from publicConfig payload (Task B3)
    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(publicConfig), 'utf8')
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
        },
      });
    }

    return Response.json(publicConfig, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        ETag: etag,
        Vary: 'Cookie, Authorization, Host',
      },
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message, code: err.code || 'INTERNAL_ERROR' },
      {
        status: err.statusCode || 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0',
        },
      }
    );
  }
}
