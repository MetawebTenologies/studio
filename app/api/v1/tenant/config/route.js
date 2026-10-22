import { resolveTenantFromRequest } from '../../../../../packages/timecapsule/src/server/tenancy.js';
import { extractTokenFromRequest, verifySessionToken } from '../../../../../packages/timecapsule/src/server/auth.js';

// Explicit public whitelist for tenant configuration (P0-2 / S5)
const ALLOWED_PUBLIC_FLAGS = new Set([
  'enable_video',
  'enable_upscale',
  'custom_domain_enabled',
  'allow_user_registration',
  'maintenance_mode',
]);

const ALLOWED_BRANDING_FIELDS = new Set([
  'app_name',
  'logo_url',
  'favicon_url',
  'primary_color',
  'secondary_color',
  'font_family',
  'theme_preset',
  'support_email',
]);

export function sanitizePublicTenantConfig(tenant) {
  if (!tenant) return null;

  // Filter branding to whitelisted fields only
  const rawBranding = tenant.branding && typeof tenant.branding === 'object' ? tenant.branding : {};
  const sanitizedBranding = {};
  for (const [key, val] of Object.entries(rawBranding)) {
    if (ALLOWED_BRANDING_FIELDS.has(key)) {
      sanitizedBranding[key] = val;
    }
  }

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

    return Response.json(publicConfig, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, max-age=0',
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
