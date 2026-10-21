import {
  createJobRecord,
  getIdempotentJob,
  reserveCredits,
  settleCredits,
  releaseCredits,
  emitJobEvent,
  updateJob,
} from './store.js';
import { selectProviderForJob, dispatchToProvider } from './providers.js';
import { ingestCompletedMedia } from './media.js';
import { getEstimatedCreditsForModel } from '../models/index.js';

const ALLOWED_MODALITIES = new Set(['image', 'i2i', 'video', 'i2v', 'v2v', 'lipsync']);

export function validateGenerationRequest(body = {}) {
  const modality = String(body.modality || 'image').toLowerCase();
  if (!ALLOWED_MODALITIES.has(modality)) {
    const err = new Error(`Unsupported modality: ${modality}`);
    err.code = 'INVALID_MODALITY';
    err.statusCode = 400;
    throw err;
  }

  const model = String(body.model || '').trim();
  if (!model) {
    const err = new Error('model is required');
    err.code = 'MISSING_MODEL';
    err.statusCode = 400;
    throw err;
  }

  const inputs = body.inputs && typeof body.inputs === 'object' ? body.inputs : {};
  if ((modality === 'image' || modality === 'video') && !String(inputs.prompt || '').trim()) {
    const err = new Error('inputs.prompt is required for text-to-media generation');
    err.code = 'MISSING_PROMPT';
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
}) {
  const tenantId = session?.tenant_id || 'org_default';
  const userId = session?.user_id || 'usr_default';

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
  const estimatedCost = getEstimatedCreditsForModel(
    validated.model,
    validated.modality,
    validated.inputs
  );

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
  });

  if (deduplicated) {
    return { job, deduplicated: true };
  }

  try {
    reserveCredits(tenantId, job.job_id, estimatedCost);
  } catch (err) {
    updateJob(job.job_id, { status: 'failed', error: err.message, credits_reserved: 0 });
    throw err;
  }

  emitJobEvent(job.job_id, {
    type: 'generation.accepted',
    status: 'queued',
    progress: 0,
    data: {
      credits_reserved: estimatedCost,
      estimated_cost: estimatedCost,
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

    const ingested = await ingestCompletedMedia({
      jobId: job.job_id,
      tenantId: job.tenant_id,
      sourceUrl: result.sourceUrl,
      modality: job.modality,
    });

    const settledCost = settleCredits(
      job.tenant_id,
      job.job_id,
      result.actualCredits ?? job.estimated_cost
    );

    const outputPayload = {
      asset_id: ingested.asset_id,
      url: ingested.source_url,
      delivery_url: ingested.url,
      content_type: ingested.content_type,
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
        credits_settled: settledCost,
      },
    });
  } catch (err) {
    releaseCredits(job.tenant_id, job.job_id);
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
