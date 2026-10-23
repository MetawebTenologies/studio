/**
 * Credential Handling & Secret Scrubbing (Security Task B3 / S6)
 * Prevents API keys, session secrets, and database credentials from leaking in logs, error responses, and client payloads.
 */

const SENSITIVE_KEY_PATTERN =
  /^(?:.*_)?(?:api[_-]?key|secret|token|password|credential|authorization|private[_-]?key|preview[_-]?key)$/i;

const POSTGRES_URL_PATTERN =
  /(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/gi;

const BEARER_TOKEN_PATTERN =
  /(Bearer\s+)[A-Za-z0-9._~+/-]{10,}/gi;

const QUERY_PARAM_SECRET_PATTERN =
  /([?&](?:api[_-]?key|key|token|secret|access_token)=)[^&]+/gi;

/**
 * Sanitizes a string by redacting known secret formats (DB passwords, Bearer tokens, query params).
 */
export function sanitizeSecretString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(POSTGRES_URL_PATTERN, '$1[REDACTED]$2')
    .replace(BEARER_TOKEN_PATTERN, '$1[REDACTED]')
    .replace(QUERY_PARAM_SECRET_PATTERN, '$1[REDACTED]');
}

/**
 * Recursively scrubs secrets from an object, array, or primitive.
 * Returns a new deep clone with sensitive values redacted.
 *
 * @param {*} data 
 * @param {Object} [options]
 * @param {string} [options.mask='[REDACTED]']
 * @returns {*}
 */
export function scrubSecrets(data, options = {}) {
  const mask = options.mask || '[REDACTED]';

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeSecretString(data);
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => scrubSecrets(item, options));
  }

  // Handle Error instances
  if (data instanceof Error) {
    const sanitized = new Error(sanitizeSecretString(data.message));
    sanitized.name = data.name;
    sanitized.code = data.code;
    sanitized.statusCode = data.statusCode;
    if (data.stack) {
      sanitized.stack = sanitizeSecretString(data.stack);
    }
    return sanitized;
  }

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      clean[key] = mask;
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = scrubSecrets(value, options);
    } else if (typeof value === 'string') {
      clean[key] = sanitizeSecretString(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Produces a safe error response payload, ensuring no database strings
 * or raw API keys are sent back to callers.
 *
 * @param {Error|*} err
 * @param {number} [fallbackStatus=500]
 * @returns {{ error: string, code: string, statusCode: number }}
 */
export function sanitizeError(err, fallbackStatus = 500) {
  const statusCode = err?.statusCode || err?.status || fallbackStatus;
  const isProduction = process.env.NODE_ENV === 'production';

  // For 5xx errors in production, never leak internal server or database stack details
  let message = err?.message || 'Internal server error';
  if (isProduction && statusCode >= 500) {
    message = 'An unexpected server error occurred. Please try again later.';
  } else {
    message = sanitizeSecretString(message);
  }

  return {
    error: message,
    code: err?.code || (statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : 'INTERNAL_ERROR'),
    statusCode,
  };
}

/**
 * Throws an assertion error if the target string contains sensitive patterns.
 */
export function assertNoExposedSecrets(textOrObj) {
  const str = typeof textOrObj === 'string' ? textOrObj : JSON.stringify(textOrObj);
  if (POSTGRES_URL_PATTERN.test(str)) {
    throw new Error('Security check failed: unredacted database credentials detected');
  }
  if (BEARER_TOKEN_PATTERN.test(str)) {
    throw new Error('Security check failed: unredacted bearer token detected');
  }
}
