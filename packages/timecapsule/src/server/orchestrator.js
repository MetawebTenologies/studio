import {
  createJobRecord,
  getIdempotentJob,
  reserveCredits,
  settleCredits,
  releaseCredits,
  emitJobEvent,
  updateJob,
} from './store.js';
import {
  selectProviderForJob,
  assertProviderReadyForJob,
  dispatchToProvider,
} from './providers.js';
import { registerExternalMediaReference } from './media.js';
import { getEstimatedCreditsForModel } from '../models/index.js';

const ALLOWED_MODALITIES = new Set(['image', 'i2i', 'video', 'i2v', 'v2v', 'lipsync']);

export function validateGenerationRequest(body = {}) {
  const modality = String(body.modality || 'image').toLowerCase();
  if (!ALLOWED_MODALITIES.has(modality)) {
    const err = new Error(`Unsupported modality: ${modality}`);
    err.code = 'INVALID_MODALITY';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  const model = String(body.model || '').trim();
  if (!model) {
    const err = new Error('model is required');
    err.code = 'MISSING_MODEL';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  const inputs = body.inputs && typeof body.inputs === 'object' ? body.inputs : {};
  if ((modality === 'image' || modality === 'video') && !String(inputs.prompt || '').trim()) {
    const err = new Error('inputs.prompt is required for text-to-media generation');
    err.code = 'MISSING_PROMPT';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  return {
    projectId: String(body.project_id || 'prj_default'),
    modality,
    model,
    inputs,
    workflow: body.workflow && typeof body.workflow === 'object' ? body.workflow : {},
    delivery: body.delivery && typeof body.delivery === 'object' ? body.delivery : {},
  };
}

export async function submitGenerationJob({
  session,
  idempotencyKey = null,
  body = {},
  awaitCompletion = false,
  simulationMode = false,
}) {
  if (!session || !session.tenant_id || !session.user_id) {
    const err = new Error('Authenticated server session is required to submit a generation job');
    err.code = 'UNAUTHORIZED';
    err.status = 401;
    err.statusCode = 401;
    throw err;
  }

  if (simulationMode && process.env.TIMECAPSULE_TEST_MODE !== '1') {
    const err = new Error('Simulation mode requires TIMECAPSULE_TEST_MODE=1');
    err.code = 'TEST_MODE_REQUIRED';
    err.status = 403;
    err.statusCode = 403;
    throw err;
  }

  const tenantId = session.tenant_id;
  const userId = session.user_id;

  if (idempotencyKey) {
    const existing = getIdempotentJob(tenantId, idempotencyKey);
    if (existing) {
      return { job: existing, deduplicated: true };
    }
  }

  const validated = validateGenerationRequest(body);
  const provider = selectProviderForJob({
    model: validated.model,
    modality: validated.modality,
    preferredProvider: body.provider,
  });

  // Fail closed BEFORE job creation or credit reservation if model is unknown,
  // GPU worker is unverified, or provider credentials are missing.
  assertProviderReadyForJob({
    model: validated.model,
    modality: validated.modality,
    provider,
  });

  const estimatedCost = simulationMode
    ? 0
    : getEstimatedCreditsForModel(validated.model, validated.modality, validated.inputs);

  const { job, deduplicated } = createJobRecord({
    tenantId,
    userId,
    projectId: validated.projectId,
    idempotencyKey,
    modality: validated.modality,
    model: validated.model,
    inputs: validated.inputs,
    workflow: validated.workflow,
    delivery: validated.delivery,
    provider,
    creditsReserved: estimatedCost,
    estimatedCost,
    simulationMode,
  });

  if (deduplicated) {
    return { job, deduplicated: true };
  }

  if (!simulationMode) {
    try {
      reserveCredits(tenantId, job.job_id, estimatedCost);
    } catch (err) {
      updateJob(job.job_id, { status: 'failed', error: err.message, credits_reserved: 0 });
      throw err;
    }
  }

  emitJobEvent(job.job_id, {
    type: 'generation.accepted',
    status: 'queued',
    progress: 0,
    data: {
      credits_reserved: estimatedCost,
      estimated_cost: estimatedCost,
      simulation: Boolean(simulationMode),
    },
  });

  const executionPromise = runJobExecution(job);
  if (awaitCompletion) {
    await executionPromise;
  } else {
    executionPromise.catch(() => {
      // Errors are captured in job state and emitted via generation.failed
    });
  }

  return { job, deduplicated: false };
}

async function runJobExecution(job) {
  try {
    emitJobEvent(job.job_id, {
      type: 'generation.started',
      status: 'running',
      progress: 0.05,
      data: { stage: 'starting' },
    });

    const result = await dispatchToProvider(job, {
      onProgress: ({ stage, progress, providerJobId, frame, total_frames }) => {
        emitJobEvent(job.job_id, {
          type: 'generation.progress',
          status: 'running',
          progress: typeof progress === 'number' ? progress : 0.5,
          providerJobId,
          data: {
            stage: stage || 'diffusion',
            ...(frame !== undefined ? { frame } : {}),
            ...(total_frames !== undefined ? { total_frames } : {}),
          },
        });
      },
    });

    const registeredMedia = await registerExternalMediaReference({
      jobId: job.job_id,
      tenantId: job.tenant_id,
      sourceUrl: result.sourceUrl,
      modality: job.modality,
    });

    const settledCost = job.simulation
      ? 0
      : settleCredits(
          job.tenant_id,
          job.job_id,
          result.actualCredits ?? job.estimated_cost
        );

    const outputPayload = {
      asset_id: registeredMedia.asset_id,
      url: registeredMedia.source_url,
      delivery_url: registeredMedia.url,
      content_type: registeredMedia.content_type,
      storage_type: registeredMedia.storage_type,
      durable: registeredMedia.durable,
    };

    updateJob(job.job_id, {
      status: 'succeeded',
      progress: 1,
      provider_job_id: result.providerJobId,
      actual_cost: settledCost,
      output: outputPayload,
      outputs: [outputPayload],
    });

    emitJobEvent(job.job_id, {
      type: 'generation.succeeded',
      status: 'succeeded',
      progress: 1,
      providerJobId: result.providerJobId,
      data: {
        url: outputPayload.url,
        delivery_url: outputPayload.delivery_url,
        asset_id: outputPayload.asset_id,
        storage_type: outputPayload.storage_type,
        durable: outputPayload.durable,
        credits_settled: settledCost,
      },
    });
  } catch (err) {
    if (!job.simulation) {
      releaseCredits(job.tenant_id, job.job_id);
    }
    updateJob(job.job_id, {
      status: 'failed',
      error: err.message || 'Generation failed',
    });
    emitJobEvent(job.job_id, {
      type: 'generation.failed',
      status: 'failed',
      progress: job.progress || 0,
      data: {
        error: err.message || 'Generation failed',
      },
    });
  }
}
