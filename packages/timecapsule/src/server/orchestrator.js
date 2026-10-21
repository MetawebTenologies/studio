import {
  checkExistingIdempotentJob,
  createSubmissionTransaction,
  getJob,
} from './store.js';
import {
  selectProviderForJob,
  assertProviderReadyForJob,
  isTestAdapterAllowed,
} from './providers.js';
import { normalizeAndFingerprintGenerationRequest } from './fingerprint.js';
import { getEstimatedCreditsForModel } from '../models/index.js';
import { createDurableWorker } from '../worker/index.js';

export function validateGenerationRequest(body = {}) {
  return normalizeAndFingerprintGenerationRequest(body);
}

/**
 * Validates, fingerprints, and persists a generation job + credit reservation +
 * idempotency binding + initial event in a single PostgreSQL transaction.
 *
 * Execution is NOT run in a detached web-server Promise; jobs remain queued in
 * PostgreSQL until claimed by a durable worker process (`createDurableWorker`).
 */
export async function submitGenerationJob({
  session,
  idempotencyKey = null,
  body = {},
  awaitCompletion = false,
}) {
  if (!session || !session.tenant_id || !session.user_id) {
    const err = new Error('Authenticated server session is required to submit a generation job');
    err.code = 'UNAUTHORIZED';
    err.status = 401;
    err.statusCode = 401;
    throw err;
  }

  const tenantId = session.tenant_id;
  const userId = session.user_id;
  const cleanIdempotencyKey =
    idempotencyKey && String(idempotencyKey).trim() ? String(idempotencyKey).trim() : null;

  // 1. Normalize, validate, and compute canonical SHA-256 request fingerprint first
  const normalized = normalizeAndFingerprintGenerationRequest(body);

  // 2. Check existing idempotency binding BEFORE checking current provider credentials,
  //    so an already-accepted idempotent request can be replayed even if provider config
  //    later becomes unavailable, and payload mismatches return 409 immediately.
  if (cleanIdempotencyKey) {
    const existing = await checkExistingIdempotentJob(
      tenantId,
      cleanIdempotencyKey,
      normalized.fingerprint
    );
    if (existing) {
      return { job: existing, deduplicated: true };
    }
  }

  // 3. Verify provider readiness and model support BEFORE creating a job or reserving credits
  const provider = selectProviderForJob({
    model: normalized.model,
    modality: normalized.modality,
    preferredProvider: normalized.provider || body.provider,
  });

  const readiness = assertProviderReadyForJob({
    model: normalized.model,
    modality: normalized.modality,
    provider,
    inputs: normalized.inputs,
  });

  const estimatedCost = getEstimatedCreditsForModel(
    normalized.model,
    normalized.modality,
    normalized.inputs
  );

  // 4. Create job, reservation, ledger entry, idempotency record, and initial event
  //    atomically in a single PostgreSQL transaction.
  const { job, deduplicated } = await createSubmissionTransaction({
    tenantId,
    userId,
    projectId: normalized.projectId,
    idempotencyKey: cleanIdempotencyKey,
    requestFingerprint: normalized.fingerprint,
    canonicalPayload: normalized.canonicalPayload,
    modality: normalized.modality,
    model: normalized.model,
    resolvedProviderModel: readiness.resolvedModel,
    provider: readiness.provider,
    executionRoute: readiness.executionRoute,
    executionRouteVersion: readiness.executionRouteVersion,
    pricingPolicyVersion: readiness.pricingPolicyVersion,
    inputs: normalized.inputs,
    workflow: normalized.workflow,
    delivery: normalized.delivery,
    estimatedCost,
  });

  // Only in explicit non-production test helpers when `awaitCompletion: true` is passed,
  // drive the durable worker cycle synchronously against PostgreSQL.
  if (awaitCompletion && !deduplicated && isTestAdapterAllowed()) {
    const worker = createDurableWorker({
      providerPollDelayMs: 10,
      submissionRetryBaseMs: 10,
    });
    await worker.drainUntilSettled({ maxIterations: 30, waitMs: 15 });
    const refreshed = await getJob(job.job_id);
    return { job: refreshed || job, deduplicated: false };
  }

  return { job, deduplicated };
}
