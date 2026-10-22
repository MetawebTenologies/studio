import {
  requireSession,
  verifyMutationOrigin,
} from '../../../../packages/timecapsule/src/server/auth.js';
import { submitGenerationJob } from '../../../../packages/timecapsule/src/server/orchestrator.js';
import { listJobs } from '../../../../packages/timecapsule/src/server/store.js';

export async function GET(request) {
  try {
    const session = await requireSession(request);
    const url = new URL(request.url);
    const queryTenantId = url.searchParams.get('tenant_id');
    const targetTenantId =
      session.role === 'platform_admin' && queryTenantId ? queryTenantId : session.tenant_id;
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const jobs = await listJobs(targetTenantId, limit);
    return Response.json(
      {
        ok: true,
        items: jobs,
      },
      {
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message, code: err.code || 'UNAUTHORIZED' },
      {
        status: err.statusCode || err.status || 500,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  }
}

export async function POST(request) {
  try {
    verifyMutationOrigin(request);
    const session = await requireSession(request);
    const idempotencyKey =
      request.headers.get('idempotency-key') || request.headers.get('Idempotency-Key') || null;
    const body = await request.json().catch(() => ({}));

    const { job, deduplicated } = await submitGenerationJob({
      session,
      idempotencyKey,
      body,
    });

    return Response.json(
      {
        job_id: job.job_id,
        status: job.status,
        credits_reserved: job.credits_reserved,
        estimated_cost: job.estimated_cost,
        events_url: job.events_url,
        provider: job.provider,
        created_at: job.created_at,
        deduplicated,
      },
      {
        status: deduplicated ? 200 : 202,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  } catch (err) {
    return Response.json(
      { error: err.message || 'Generation submission failed', code: err.code || 'SUBMISSION_ERROR' },
      {
        status: err.statusCode || err.status || 400,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  }
}
