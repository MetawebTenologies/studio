/**
 * CORS & Origin Isolation (Security Task B2 / S4)
 * Strict cross-origin request evaluation and preflight handling.
 */

function areHostsEquivalent(hostA, hostB) {
  if (!hostA || !hostB) return false;
  const normA = String(hostA).toLowerCase().split(':')[0];
  const normB = String(hostB).toLowerCase().split(':')[0];
  if (normA === normB) return true;
  if (
    (normA === 'localhost' || normA === '127.0.0.1') &&
    (normB === 'localhost' || normB === '127.0.0.1')
  ) {
    return true;
  }
  return false;
}

/**
 * Returns list of configured allowed origins.
 */
export function getAllowedOrigins() {
  const envVal = process.env.ALLOWED_ORIGINS || '';
  const list = envVal
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return list;
}

/**
 * Checks whether the incoming request Origin is allowed.
 * 
 * @param {Request} request 
 * @returns {{ allowed: boolean, origin: string|null, isSameOrigin: boolean }}
 */
export function isOriginAllowed(request) {
  const originHeader = request?.headers?.get?.('origin') || request?.headers?.origin || null;
  if (!originHeader) {
    return { allowed: true, origin: null, isSameOrigin: true };
  }

  let originHost = '';
  try {
    originHost = new URL(originHeader).host;
  } catch {
    return { allowed: false, origin: originHeader, isSameOrigin: false };
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

  // Check same-origin equivalence
  if (
    (requestHost && areHostsEquivalent(originHost, requestHost)) ||
    (hostHeader && areHostsEquivalent(originHost, hostHeader))
  ) {
    return { allowed: true, origin: originHeader, isSameOrigin: true };
  }

  // Check against explicit allowed origins list
  const configuredList = getAllowedOrigins();
  for (const allowed of configuredList) {
    try {
      const allowedHost = new URL(allowed).host;
      if (areHostsEquivalent(originHost, allowedHost)) {
        return { allowed: true, origin: originHeader, isSameOrigin: false };
      }
    } catch {
      if (allowed === originHeader) {
        return { allowed: true, origin: originHeader, isSameOrigin: false };
      }
    }
  }

  return { allowed: false, origin: originHeader, isSameOrigin: false };
}

/**
 * Generates CORS headers for responses.
 */
export function getCorsHeaders(request, options = {}) {
  const { allowed, origin } = isOriginAllowed(request);
  if (!origin || !allowed) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

/**
 * Handles CORS Preflight (OPTIONS) requests.
 * Returns Response (204 or 403) or null if request is not an OPTIONS request.
 */
export function handleCorsPreflight(request) {
  if (String(request?.method || '').toUpperCase() !== 'OPTIONS') {
    return null;
  }

  const { allowed, origin } = isOriginAllowed(request);
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'Cross-origin request rejected: unauthorized origin',
        code: 'CORS_ORIGIN_DENIED',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Vary': 'Origin',
        },
      }
    );
  }

  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Timecapsule-CSRF, Idempotency-Key, If-None-Match, x-timecapsule-tenant-id, x-timecapsule-tenant-slug',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}
