import crypto from 'crypto';
import { getJob } from './store.js';

export const PREVIEW_IDENTITY = Object.freeze({
  user_id: 'usr_preview_operator',
  tenant_id: 'org_preview_default',
  name: 'Private Preview Operator',
  auth_mode: 'private_preview',
  scope: 'single_tenant_private_preview',
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

// Explicitly gated test-only helper for multi-tenant isolation assertions
export function issueSessionTokenForTest({
  userId = PREVIEW_IDENTITY.user_id,
  tenantId = PREVIEW_IDENTITY.tenant_id,
  name = PREVIEW_IDENTITY.name,
  ttlSeconds = 3600,
} = {}) {
  if (process.env.TIMECAPSULE_TEST_MODE !== '1') {
    throw new Error('issueSessionTokenForTest is restricted to TIMECAPSULE_TEST_MODE=1');
  }
  const payload = {
    sub: userId,
    tenant_id: tenantId,
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
    if (requestHost && originHost !== requestHost) {
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
    if (requestHost && refererHost !== requestHost) {
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
  const job = getJob(jobId);
  if (!job) {
    const err = new Error(`Job not found: ${jobId}`);
    err.code = 'JOB_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  if (job.tenant_id !== session.tenant_id) {
    const err = new Error('Forbidden: job belongs to another tenant');
    err.code = 'FORBIDDEN';
    err.statusCode = 403;
    throw err;
  }
  return job;
}
