import { getTenant, getTenantBySlug, getMembership } from './tenants.js';
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

  // S6 Hardening: DO NOT accept raw tenant IDs or slugs from anonymous client headers.
  // Only honor header overrides if authenticated via trusted internal gateway secret
  // or explicitly permitted in test mode.
  const isTrustedInternalGateway = (() => {
    const gatewaySecret = process.env.TIMECAPSULE_GATEWAY_SECRET;
    if (gatewaySecret && gatewaySecret.length >= 16) {
      const headerSecret =
        request?.headers?.get?.('x-timecapsule-gateway-secret') ||
        request?.headers?.['x-timecapsule-gateway-secret'];
      if (headerSecret === gatewaySecret) return true;
    }
    if (process.env.NODE_ENV !== 'production' && process.env.TIMECAPSULE_TEST_MODE === '1') {
      return true;
    }
    return false;
  })();

  if (isTrustedInternalGateway) {
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
  }

  // 3. Extract from hostname / subdomain (safe for public resolution)
  const hostHeader =
    request?.headers?.get?.('host') || request?.headers?.host || '';
  const sub = extractSubdomain(hostHeader);
  if (sub) {
    const tenant = await getTenantBySlug(sub);
    if (tenant) return tenant;
  }

  // 4. Fallback to default preview tenant (only in non-production environments)
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const defaultTenant = await getTenant(PREVIEW_IDENTITY.tenant_id);
    if (defaultTenant) return defaultTenant;
  }

  return {
    tenant_id: isProduction ? 'tnt_public_default' : PREVIEW_IDENTITY.tenant_id,
    slug: 'default',
    name: 'Timecapsule Studio',
    plan: 'public',
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

  // S4 Hardening: In production, preview_identity cannot bypass tenant boundaries
  if (process.env.NODE_ENV === 'production' && session.auth_mode === 'private_preview') {
    if (session.tenant_id !== targetTenantId) {
      const err = new Error(`Forbidden: access to tenant ${targetTenantId} is denied`);
      err.code = 'TENANT_ACCESS_DENIED';
      err.statusCode = 403;
      throw err;
    }
    return;
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

  // S4 Hardening: In production, private_preview tokens cannot claim administrative rights
  if (process.env.NODE_ENV === 'production' && session.auth_mode === 'private_preview') {
    const err = new Error('Forbidden: private_preview authentication cannot claim administrative privileges in production');
    err.code = 'PREVIEW_ADMIN_FORBIDDEN_IN_PRODUCTION';
    err.statusCode = 403;
    throw err;
  }

  if (session.role !== 'platform_admin' && session.role !== 'reseller_admin') {
    const err = new Error('Forbidden: operation requires administrative privileges');
    err.code = 'ADMIN_ROLE_REQUIRED';
    err.statusCode = 403;
    throw err;
  }
}

export async function assertAdminRoleWithDatabaseCheck(session) {
  assertAdminRole(session);

  // S3 Hardening: Recheck the user's role in PostgreSQL; do not trust signed payload role until expiry
  if (session.user_id && session.tenant_id) {
    const membership = await getMembership(session.user_id, session.tenant_id);
    if (!membership || membership.status !== 'active') {
      const err = new Error('Forbidden: tenant membership is inactive or has been revoked');
      err.code = 'MEMBERSHIP_REVOKED';
      err.statusCode = 403;
      throw err;
    }
    if (membership.role !== 'platform_admin' && membership.role !== 'reseller_admin') {
      const err = new Error('Forbidden: user role has been downgraded or revoked in database');
      err.code = 'ROLE_DOWNGRADED';
      err.statusCode = 403;
      throw err;
    }
  }
}
