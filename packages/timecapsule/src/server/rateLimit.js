/**
 * Rate Limiting & Abuse Prevention (Security Task B1 / S3)
 * Sliding-window in-memory rate limiter with IP and tenant/user keying,
 * returning standard 429 Too Many Requests with Retry-After headers.
 */

// Memory store: Map<key, { count, resetAt }>
const buckets = new Map();

// Default rate limits per action
export const DEFAULT_RATE_LIMITS = Object.freeze({
  auth: { limit: 10, windowMs: 60 * 1000 }, // 10 attempts per minute (prevents brute force / credential stuffing)
  generation: { limit: 30, windowMs: 60 * 1000 }, // 30 jobs per minute per tenant/user
  uploads: { limit: 60, windowMs: 60 * 1000 }, // 60 uploads per minute
  default: { limit: 120, windowMs: 60 * 1000 }, // 120 requests per minute
});

/**
 * Extracts a client identifier for rate-limiting.
 * Prefers authenticated session sub / tenant_id if available,
 * otherwise falls back to the client IP address.
 */
export function getClientIdentifier(request, session = null) {
  if (session?.user_id) {
    return `usr:${session.user_id}:${session.tenant_id || 'notenant'}`;
  }
  if (session?.tenant_id) {
    return `tnt:${session.tenant_id}`;
  }

  // IP extraction from common proxy headers
  const forwardedFor =
    request?.headers?.get?.('x-forwarded-for') ||
    request?.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    const clientIp = forwardedFor.split(',')[0].trim();
    if (clientIp) return `ip:${clientIp}`;
  }

  const realIp =
    request?.headers?.get?.('x-real-ip') ||
    request?.headers?.['x-real-ip'];
  if (realIp) {
    return `ip:${realIp.trim()}`;
  }

  return 'ip:127.0.0.1';
}

/**
 * Evaluates rate limit for a given request.
 * Throws an Error with statusCode 429 if the limit is exceeded.
 * 
 * @param {Request} request 
 * @param {Object} options
 * @param {string} [options.action='default'] - Route action identifier
 * @param {Object} [options.session=null] - Authenticated session
 * @param {number} [options.limit] - Override limit
 * @param {number} [options.windowMs] - Override window in ms
 * @param {string} [options.keyPrefix] - Optional prefix
 * @returns {{ limit: number, remaining: number, reset: number, headers: Object }}
 */
export function checkRateLimit(request, options = {}) {
  const action = options.action || 'default';
  const config = DEFAULT_RATE_LIMITS[action] || DEFAULT_RATE_LIMITS.default;
  const limit = typeof options.limit === 'number' ? options.limit : config.limit;
  const windowMs = typeof options.windowMs === 'number' ? options.windowMs : config.windowMs;

  const clientId = options.identifier || getClientIdentifier(request, options.session);
  const bucketKey = `${options.keyPrefix || action}:${clientId}`;

  const now = options.now ? options.now() : Date.now();
  let bucket = buckets.get(bucketKey);

  if (!bucket || now >= bucket.resetAt) {
    bucket = {
      count: 0,
      resetAt: now + windowMs,
    };
    buckets.set(bucketKey, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const retryAfterSeconds = Math.ceil(Math.max(0, bucket.resetAt - now) / 1000);

  const headers = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
  };

  if (bucket.count > limit) {
    headers['Retry-After'] = String(retryAfterSeconds);
    const err = new Error(`Rate limit exceeded for ${action}. Retry in ${retryAfterSeconds} seconds.`);
    err.code = 'RATE_LIMIT_EXCEEDED';
    err.statusCode = 429;
    err.retryAfter = retryAfterSeconds;
    err.rateLimit = { limit, remaining: 0, reset: Math.ceil(bucket.resetAt / 1000) };
    err.headers = headers;
    throw err;
  }

  return {
    limit,
    remaining,
    reset: Math.ceil(bucket.resetAt / 1000),
    headers,
  };
}

/**
 * Reset rate limit memory buckets (useful for tests and maintenance).
 */
export function resetRateLimits() {
  buckets.clear();
}
