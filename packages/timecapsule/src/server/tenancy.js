import { getTenant, getTenantBySlug } from './tenants.js';
import { PREVIEW_IDENTITY } from './auth.js';

export function extractSubdomain(host) {
  if (!host || typeof host !== 'string') return null;
  const cleanHost = host.split(':')[0].toLowerCase().trim();
  const parts = cleanHost.split('.');

  // e.g. "alpha.timecapsule.ai" -> "alpha"
  // ignore localhost, 127.0.0.1, or apex domains
  if (parts.length >= 3 && !cleanHost.endsWith('.local') && cleanHost !== 'localhost') {
    const sub = parts[0];
    if (sub !== 'www' && sub !== 'api' && sub !== 'cname') {
      return sub;
    }
  }
  return null;
}

export async function resolveTenantFromRequest(request, session = null) {
  // 1. If an authenticated session exists, its tenant_id is authoritative
  if (session?.tenant_id) {
    const tenant = await getTenant(session.tenant_id);
    if (tenant) return tenant;
    return {
      tenant_id: session.tenant_id,
      slug: null,
      name: 'Session Tenant',
      plan: 'starter',
      status: 'active',
      branding: {},
      legal: {},
      flags: {},
      spend_ceiling_credits: null,
    };
  }

  // 2. Check explicit header override (e.g., from gateway/BFF)
  const slugHeader =
    request?.headers?.get?.('x-timecapsule-tenant-slug') ||
    request?.headers?.['x-timecapsule-tenant-slug'];
  if (slugHeader) {
    const tenant = await getTenantBySlug(slugHeader);
    if (tenant) return tenant;
  }

  const idHeader =
    request?.headers?.get?.('x-timecapsule-tenant-id') ||
    request?.headers?.['x-timecapsule-tenant-id'];
  if (idHeader) {
    const tenant = await getTenant(idHeader);
    if (tenant) return tenant;
  }

  // 3. Extract from hostname / subdomain
  const hostHeader =
    request?.headers?.get?.('host') || request?.headers?.host || '';
  const sub = extractSubdomain(hostHeader);
  if (sub) {
    const tenant = await getTenantBySlug(sub);
    if (tenant) return tenant;
  }

  // 4. Fallback to default preview tenant
  const defaultTenant = await getTenant(PREVIEW_IDENTITY.tenant_id);
  if (defaultTenant) return defaultTenant;

  return {
    tenant_id: PREVIEW_IDENTITY.tenant_id,
    slug: 'default',
    name: 'Timecapsule Studio',
    plan: 'internal',
    status: 'active',
    branding: {},
    legal: {},
    flags: {},
    spend_ceiling_credits: null,
  };
}

export function enforceTenantAccess(session, targetTenantId) {
  if (!session) {
    const err = new Error('Authentication required');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    throw err;
  }

  // Platform admin can access any tenant
  if (session.role === 'platform_admin') {
    return;
  }

  // Other users are strictly quarantined to their session tenant
  if (session.tenant_id !== targetTenantId) {
    const err = new Error(`Forbidden: access to tenant ${targetTenantId} is denied`);
    err.code = 'TENANT_ACCESS_DENIED';
    err.statusCode = 403;
    throw err;
  }
}

export function assertAdminRole(session) {
  if (!session) {
    const err = new Error('Authentication required');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    throw err;
  }

  if (session.role !== 'platform_admin' && session.role !== 'reseller_admin') {
    const err = new Error('Forbidden: operation requires administrative privileges');
    err.code = 'ADMIN_ROLE_REQUIRED';
    err.statusCode = 403;
    throw err;
  }
}
