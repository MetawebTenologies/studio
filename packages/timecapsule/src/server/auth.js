import crypto from 'crypto';
import { getJob } from './store.js';

export const PREVIEW_IDENTITY = Object.freeze({
  user_id: 'usr_preview_operator',
  tenant_id: 'org_preview_default',
  name: 'Private Preview Operator',
  auth_mode: 'private_preview',
  scope: 'single_tenant_private_preview',
  role: 'platform_admin',
});

function getSessionSecret() {
  const configured = process.env.TIMECAPSULE_SESSION_SECRET || process.env.SESSION_SECRET;
  if (configured && configured.trim().length >= 16) {
    return configured.trim();
  }
  const err = new Error(
    'Server authentication is not configured: TIMECAPSULE_SESSION_SECRET (min 16 chars) is required'
  );
  err.code = 'AUTH_NOT_CONFIGURED';
  err.statusCode = 503;
  throw err;
}

function getPreviewAccessKey() {
  const configured = process.env.TIMECAPSULE_PREVIEW_KEY || process.env.TIMECAPSULE_ACCESS_CODE;
  if (configured && configured.trim().length >= 8) {
    return configured.trim();
  }
  const err = new Error(
    'Private-preview access is not configured: TIMECAPSULE_PREVIEW_KEY (min 8 chars) is required'
  );
  err.code = 'AUTH_NOT_CONFIGURED';
  err.statusCode = 503;
  throw err;
}

function signPayload(encodedPayload) {
  return crypto.createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
}

function constantTimeStringMatch(candidate, expected) {
  if (typeof candidate !== 'string' || typeof expected !== 'string') return false;
  const trimmedCandidate = candidate.trim();
  if (!trimmedCandidate) return false;
  const hashA = crypto.createHash('sha256').update(trimmedCandidate, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function authenticatePreviewCredential(submittedCredential) {
  // Ensure both session secret and preview key are configured before authenticating
  getSessionSecret();
  const expectedKey = getPreviewAccessKey();

  if (!constantTimeStringMatch(submittedCredential, expectedKey)) {
    const err = new Error('Invalid private-preview access credential');
    err.code = 'INVALID_PREVIEW_CREDENTIAL';
    err.statusCode = 401;
    throw err;
  }

  return { ...PREVIEW_IDENTITY };
}

export function issuePreviewSessionToken({ ttlSeconds = 8 * 3600 } = {}) {
  const payload = {
    sub: PREVIEW_IDENTITY.user_id,
    tenant_id: PREVIEW_IDENTITY.tenant_id,
    role: PREVIEW_IDENTITY.role || 'platform_admin',
    name: PREVIEW_IDENTITY.name,
    auth_mode: PREVIEW_IDENTITY.auth_mode,
    scope: PREVIEW_IDENTITY.scope,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = signPayload(encoded);
  return `${encoded}.${sig}`;
}

export function issueTenantSessionToken({
  userId,
  tenantId,
  role = 'end_user',
  name = 'User',
  email = null,
  ttlSeconds = 8 * 3600,
} = {}) {
  if (!userId || !tenantId) {
    throw new Error('userId and tenantId are required to issue a tenant session token');
  }
  const payload = {
    sub: userId,
    tenant_id: tenantId,
    role,
    name,
    email,
    auth_mode: 'tenant_session',
    scope: 'tenant_scoped',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = signPayload(encoded);
  return `${encoded}.${sig}`;
}

// Explicitly gated test-only helper for multi-tenant isolation assertions.
// Never enableable when NODE_ENV === 'production', even if TIMECAPSULE_TEST_MODE=1 is set.
export function issueSessionTokenForTest({
  userId = PREVIEW_IDENTITY.user_id,
  tenantId = PREVIEW_IDENTITY.tenant_id,
  role = 'end_user',
  name = PREVIEW_IDENTITY.name,
  ttlSeconds = 3600,
} = {}) {
  if (process.env.NODE_ENV === 'production' || process.env.TIMECAPSULE_TEST_MODE !== '1') {
    const err = new Error(
      'issueSessionTokenForTest is restricted to non-production environments with TIMECAPSULE_TEST_MODE=1'
    );
    err.code = 'TEST_MODE_FORBIDDEN_IN_PRODUCTION';
    err.statusCode = 403;
    throw err;
  }
  const payload = {
    sub: userId,
    tenant_id: tenantId,
    role,
    name,
    auth_mode: 'private_preview_test',
    scope: 'single_tenant_private_preview',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = signPayload(encoded);
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;

  let expectedSig;
  try {
    expectedSig = signPayload(encoded);
  } catch {
    return null;
  }

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (!payload.sub || !payload.tenant_id) {
      return null;
    }
    return {
      user_id: payload.sub,
      tenant_id: payload.tenant_id,
      role: payload.role || (payload.tenant_id === PREVIEW_IDENTITY.tenant_id ? 'platform_admin' : 'end_user'),
      email: payload.email || null,
      name: payload.name || PREVIEW_IDENTITY.name,
      auth_mode: payload.auth_mode || PREVIEW_IDENTITY.auth_mode,
      scope: payload.scope || PREVIEW_IDENTITY.scope,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function extractTokenFromRequest(request) {
  const authHeader = request?.headers?.get?.('authorization') || request?.headers?.authorization || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = request?.headers?.get?.('cookie') || request?.headers?.cookie || '';
  const match = /(?:^|;\s*)(?:timecapsule_session|tc_session)=([^;]+)/.exec(cookieHeader);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return '';
}

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export function parseHostAndPort(hostStr) {
  if (!hostStr) return { hostname: '', port: '' };
  const str = String(hostStr).trim().toLowerCase();
  if (str.startsWith('[')) {
    const bracketEnd = str.indexOf(']');
    if (bracketEnd !== -1) {
      const hostname = str.slice(1, bracketEnd);
      const port = str.slice(bracketEnd + 1).replace(/^:/, '');
      return { hostname, port };
    }
  }
  const parts = str.split(':');
  return {
    hostname: parts[0],
    port: parts[1] || '',
  };
}

export function areHostsEquivalent(hostA, hostB) {
  if (!hostA || !hostB) return false;
  if (String(hostA).toLowerCase() === String(hostB).toLowerCase()) return true;

  const a = parseHostAndPort(hostA);
  const b = parseHostAndPort(hostB);

  const isALoopback = LOOPBACK_HOSTNAMES.has(a.hostname);
  const isBLoopback = LOOPBACK_HOSTNAMES.has(b.hostname);

  if (isALoopback && isBLoopback) {
    return a.port === b.port;
  }

  return false;
}

export function verifyMutationOrigin(request) {
  const method = String(request?.method || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return;
  }

  let requestHost = '';
  try {
    if (request?.url) {
      requestHost = new URL(request.url).host;
    }
  } catch {
    requestHost = '';
  }

  const hostHeader = request?.headers?.get?.('host') || request?.headers?.host || '';
  const originHeader = request?.headers?.get?.('origin') || request?.headers?.origin || '';
  const refererHeader = request?.headers?.get?.('referer') || request?.headers?.referer || '';
  const csrfHeader =
    request?.headers?.get?.('x-timecapsule-csrf') || request?.headers?.['x-timecapsule-csrf'] || '';
  const authHeader = request?.headers?.get?.('authorization') || request?.headers?.authorization || '';
  const hasBearerAuth = authHeader.toLowerCase().startsWith('bearer ');

  if (originHeader) {
    let originHost = '';
    try {
      originHost = new URL(originHeader).host;
    } catch {
      const err = new Error('Malformed Origin header');
      err.code = 'CSRF_ORIGIN_MISMATCH';
      err.statusCode = 403;
      throw err;
    }
    const matchesRequestHost = requestHost && areHostsEquivalent(originHost, requestHost);
    const matchesHostHeader = hostHeader && areHostsEquivalent(originHost, hostHeader);

    if (!matchesRequestHost && !matchesHostHeader) {
      const err = new Error('Cross-origin mutation request rejected');
      err.code = 'CSRF_ORIGIN_MISMATCH';
      err.statusCode = 403;
      throw err;
    }
    return;
  }

  if (refererHeader) {
    let refererHost = '';
    try {
      refererHost = new URL(refererHeader).host;
    } catch {
      const err = new Error('Malformed Referer header');
      err.code = 'CSRF_ORIGIN_MISMATCH';
      err.statusCode = 403;
      throw err;
    }
    const matchesRequestHost = requestHost && areHostsEquivalent(refererHost, requestHost);
    const matchesHostHeader = hostHeader && areHostsEquivalent(refererHost, hostHeader);

    if (!matchesRequestHost && !matchesHostHeader) {
      const err = new Error('Cross-origin Referer mutation request rejected');
      err.code = 'CSRF_ORIGIN_MISMATCH';
      err.statusCode = 403;
      throw err;
    }
    return;
  }

  // If no Origin/Referer is present, require either explicit Bearer header or X-Timecapsule-CSRF header
  if (!hasBearerAuth && csrfHeader !== '1') {
    const err = new Error('CSRF protection required: missing Origin or X-Timecapsule-CSRF header');
    err.code = 'CSRF_PROTECTION_REQUIRED';
    err.statusCode = 403;
    throw err;
  }
}

export async function requireSession(request) {
  // Fail closed if server session secret is not configured
  getSessionSecret();

  const token = extractTokenFromRequest(request);
  const session = verifySessionToken(token);
  if (session) return session;

  const err = new Error('Authentication required (private-preview session)');
  err.code = 'UNAUTHORIZED';
  err.statusCode = 401;
  throw err;
}

export async function authorizeJobAccess(session, jobId) {
  const job = await getJob(jobId);
  if (!job) {
    const err = new Error(`Job not found: ${jobId}`);
    err.code = 'JOB_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  if (session?.role !== 'platform_admin' && job.tenant_id !== session.tenant_id) {
    const err = new Error('Forbidden: job belongs to another tenant');
    err.code = 'FORBIDDEN';
    err.statusCode = 403;
    throw err;
  }
  return job;
}
