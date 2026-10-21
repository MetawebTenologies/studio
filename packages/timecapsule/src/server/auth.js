import crypto from 'crypto';
import { getJob } from './store.js';

const ephemeralSecretKey = '__TIMECAPSULE_EPHEMERAL_SECRET__';

function getSessionSecret() {
  const configured = process.env.TIMECAPSULE_SESSION_SECRET || process.env.SESSION_SECRET;
  if (configured && configured.trim().length >= 16) {
    return configured.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TIMECAPSULE_SESSION_SECRET must be configured in production');
  }
  if (!globalThis[ephemeralSecretKey]) {
    globalThis[ephemeralSecretKey] = crypto.randomBytes(32).toString('hex');
  }
  return globalThis[ephemeralSecretKey];
}

function signPayload(encodedPayload) {
  return crypto.createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
}

export function issueSessionToken({
  userId = 'usr_default',
  tenantId = 'org_default',
  name = 'Studio Creator',
  ttlSeconds = 7 * 24 * 3600,
} = {}) {
  const payload = {
    sub: userId,
    tenant_id: tenantId,
    name,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = signPayload(encoded);
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  // Support development session token when not in production
  if (token === 'tc_dev_session' && process.env.NODE_ENV !== 'production') {
    return {
      user_id: 'usr_default',
      tenant_id: 'org_default',
      name: 'Timecapsule Creator',
      mode: 'dev',
    };
  }

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  const expectedSig = signPayload(encoded);

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
    return {
      user_id: payload.sub || 'usr_default',
      tenant_id: payload.tenant_id || 'org_default',
      name: payload.name || 'Timecapsule Creator',
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
  const match = /(?:^|;\s*)tc_session=([^;]+)/.exec(cookieHeader);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return '';
}

export async function requireSession(request) {
  const token = extractTokenFromRequest(request);
  const session = verifySessionToken(token);
  if (session) return session;

  // In non-production local studio mode without an explicit token, provide a default local session
  // unless strict auth is requested via TIMECAPSULE_REQUIRE_AUTH=1.
  if (process.env.NODE_ENV !== 'production' && process.env.TIMECAPSULE_REQUIRE_AUTH !== '1' && !token) {
    return {
      user_id: 'usr_default',
      tenant_id: 'org_default',
      name: 'Local Studio User',
      mode: 'implicit-dev',
    };
  }

  const err = new Error('Authentication required');
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
