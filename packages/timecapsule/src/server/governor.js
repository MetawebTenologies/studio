/**
 * Timecapsule Concurrency Governor & Circuit Breaker (CONC-1)
 *
 * Protects downstream provider billing wallets and prevents upstream 429 / 5xx avalanches.
 * 1. Fenced in-flight concurrency tracking per provider.
 * 2. Circuit breaker with automated cooldown and half-open probing.
 * 3. Exponential backoff calculation with jitter for rate-limited requests.
 */

const DEFAULT_CONCURRENCY_LIMITS = Object.freeze({
  muapi: 10,
  fal: 8,
  replicate: 6,
  kie: 4,
  'timecapsule-gpu': 4,
  default: 5,
});

class ProviderConcurrencyGovernor {
  constructor(options = {}) {
    this.customLimits = new Map(Object.entries(options.limits || {}));
    this.inFlight = new Map();
    this.circuits = new Map();
    this.failureThreshold = Number(options.failureThreshold || 3);
    this.cooldownMs = Number(options.cooldownMs || 30000);
  }

  getLimit(provider) {
    const clean = String(provider || '').toLowerCase().trim();
    if (this.customLimits.has(clean)) {
      return this.customLimits.get(clean);
    }
    const envKey = `TIMECAPSULE_${clean.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_CONCURRENCY_LIMIT`;
    if (process.env[envKey]) {
      const parsed = parseInt(process.env[envKey], 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_CONCURRENCY_LIMITS[clean] || DEFAULT_CONCURRENCY_LIMITS.default;
  }

  getInFlight(provider) {
    const clean = String(provider || '').toLowerCase().trim();
    return this.inFlight.get(clean) || 0;
  }

  canAcquire(provider) {
    const clean = String(provider || '').toLowerCase().trim();
    if (this.isCircuitOpen(clean)) {
      return false;
    }
    const current = this.getInFlight(clean);
    return current < this.getLimit(clean);
  }

  acquireSlot(provider) {
    const clean = String(provider || '').toLowerCase().trim();
    if (this.isCircuitOpen(clean)) {
      const err = new Error(`Provider "${clean}" circuit is OPEN due to upstream errors`);
      err.code = 'PROVIDER_CIRCUIT_OPEN';
      err.statusCode = 503;
      throw err;
    }
    const current = this.getInFlight(clean);
    const limit = this.getLimit(clean);
    if (current >= limit) {
      const err = new Error(`Provider "${clean}" concurrency limit reached (${current}/${limit})`);
      err.code = 'PROVIDER_CONCURRENCY_EXCEEDED';
      err.statusCode = 429;
      throw err;
    }
    this.inFlight.set(clean, current + 1);
    return true;
  }

  releaseSlot(provider) {
    const clean = String(provider || '').toLowerCase().trim();
    const current = this.getInFlight(clean);
    if (current > 0) {
      this.inFlight.set(clean, current - 1);
    }
  }

  isCircuitOpen(provider) {
    const clean = String(provider || '').toLowerCase().trim();
    const circuit = this.circuits.get(clean);
    if (!circuit || circuit.state === 'CLOSED') {
      return false;
    }
    if (circuit.state === 'OPEN') {
      const elapsed = Date.now() - circuit.trippedAt;
      if (elapsed >= this.cooldownMs) {
        circuit.state = 'HALF_OPEN';
        return false; // Allow a probe request
      }
      return true;
    }
    return false;
  }

  recordSuccess(provider) {
    const clean = String(provider || '').toLowerCase().trim();
    const circuit = this.circuits.get(clean);
    if (circuit) {
      circuit.failures = 0;
      circuit.state = 'CLOSED';
      circuit.trippedAt = null;
    }
  }

  recordFailure(provider, error = {}) {
    const clean = String(provider || '').toLowerCase().trim();
    let circuit = this.circuits.get(clean);
    if (!circuit) {
      circuit = { failures: 0, state: 'CLOSED', trippedAt: null };
      this.circuits.set(clean, circuit);
    }

    const isRetriableOrRateLimit =
      error.status === 429 ||
      error.statusCode === 429 ||
      error.status === 503 ||
      error.statusCode === 503 ||
      error.status === 504 ||
      error.statusCode === 504 ||
      error.code === 'RATE_LIMIT_EXCEEDED' ||
      error.code === 'ECONNREFUSED' ||
      error.retryableSubmission === true;

    if (!isRetriableOrRateLimit) {
      return;
    }

    circuit.failures += 1;
    if (circuit.failures >= this.failureThreshold || error.status === 429) {
      circuit.state = 'OPEN';
      circuit.trippedAt = Date.now();
    }
  }

  getCircuitState(provider) {
    const clean = String(provider || '').toLowerCase().trim();
    const circuit = this.circuits.get(clean);
    if (!circuit) {
      return { state: 'CLOSED', failures: 0, cooldownRemainingMs: 0 };
    }
    const cooldownRemainingMs =
      circuit.state === 'OPEN'
        ? Math.max(0, this.cooldownMs - (Date.now() - circuit.trippedAt))
        : 0;
    return {
      state: circuit.state,
      failures: circuit.failures,
      cooldownRemainingMs,
    };
  }

  resetAll() {
    this.inFlight.clear();
    this.circuits.clear();
  }
}

export function calculateBackoffMs({
  attempt = 1,
  baseMs = 500,
  maxMs = 30000,
  retryAfterHeader = null,
} = {}) {
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  }
  const exp = Math.min(maxMs, baseMs * Math.pow(2, Math.max(0, attempt - 1)));
  // Full jitter between 50% and 100% of the computed exponential delay
  return Math.floor(exp * (0.5 + Math.random() * 0.5));
}

export const defaultGovernor = new ProviderConcurrencyGovernor();
export { ProviderConcurrencyGovernor };
