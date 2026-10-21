import { NextResponse } from 'next/server';
import { requireSession } from '../../../../packages/timecapsule/src/server/auth.js';
import { submitGenerationJob } from '../../../../packages/timecapsule/src/server/orchestrator.js';
import { listJobs } from '../../../../packages/timecapsule/src/server/store.js';

export async function GET(request) {
  try {
    const session = await requireSession(request);
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const jobs = listJobs(session.tenant_id, limit);
    return NextResponse.json({
      ok: true,
      items: jobs,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: err.statusCode || 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await requireSession(request);
    const idempotencyKey =
      request.headers.get('idempotency-key') || request.headers.get('Idempotency-Key') || null;
    const body = await request.json().catch(() => ({}));

    const { job, deduplicated } = await submitGenerationJob({
      session,
      idempotencyKey,
      body,
    });

    return NextResponse.json(
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
      { status: deduplicated ? 200 : 202 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Generation submission failed', code: err.code || 'SUBMISSION_ERROR' },
      { status: err.statusCode || 400 }
    );
  }
}
