const SENSITIVE_KEY_PATTERN =
  /^(authorization|x-api-key|api[_-]?key|secret|token|access[_-]?token|refresh[_-]?token|password|credential|cookie|set-cookie)$/i;

const BEARER_OR_KEY_VALUE_PATTERN =
  /\b(Bearer\s+[A-Za-z0-9._~+/=-]{6,}|sk-[A-Za-z0-9_-]{8,}|muapi_[A-Za-z0-9_-]{6,}|kie_[A-Za-z0-9_-]{6,})/gi;

export function redactStringSecrets(input) {
  if (typeof input !== 'string') return input;
  let out = input.replace(BEARER_OR_KEY_VALUE_PATTERN, '[REDACTED_SECRET]');
  const knownSecrets = [
    process.env.MUAPI_API_KEY,
    process.env.KIE_API_KEY,
    process.env.FAL_KEY,
    process.env.FAL_API_KEY,
    process.env.REPLICATE_API_TOKEN,
    process.env.REPLICATE_API_KEY,
    process.env.TIMECAPSULE_PREVIEW_KEY,
    process.env.TIMECAPSULE_SESSION_SECRET,
  ].filter((v) => typeof v === 'string' && v.trim().length >= 4);

  for (const secret of knownSecrets) {
    const trimmed = secret.trim();
    if (trimmed && out.includes(trimmed)) {
      out = out.split(trimmed).join('[REDACTED_SECRET]');
    }
  }
  return out;
}

/**
 * Deeply redacts any sensitive keys or secret substrings from raw provider payloads/errors
 * before persisting them privately on `jobs.provider_details_private_json`.
 */
export function redactProviderDetails(value, depth = 0) {
  if (depth > 6 || value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return redactStringSecrets(value.slice(0, 2000));
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return Number.isFinite(value) || typeof value === 'boolean' ? value : null;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => redactProviderDetails(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redactProviderDetails(v, depth + 1);
      }
    }
    return out;
  }
  return String(value).slice(0, 500);
}
