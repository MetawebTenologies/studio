import {
  requireSession,
  authorizeJobAccess,
} from '../../../../../packages/timecapsule/src/server/auth.js';

export async function GET(request, context) {
  try {
    const session = await requireSession(request, { requiredScope: 'generations:read' });
    const resolvedParams = await context.params;
    const job = await authorizeJobAccess(session, resolvedParams.jobId);

    return Response.json(
      {
        job_id: job.job_id,
        tenant_id: job.tenant_id,
        project_id: job.project_id,
        modality: job.modality,
        model: job.model,
        status: job.status,
        progress: job.progress,
        provider: job.provider,
        provider_job_id: job.provider_job_id,
        credits_reserved: job.credits_reserved,
        estimated_cost: job.estimated_cost,
        actual_cost: job.actual_cost,
        events_url: job.events_url,
        output: job.output,
        outputs: job.outputs,
        error: job.error,
        created_at: job.created_at,
        updated_at: job.updated_at,
      },
      {
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  } catch (err) {
    return Response.json(
      { error: err.message || 'Failed to load job', code: err.code || 'JOB_ERROR' },
      {
        status: err.statusCode || 404,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  }
}
