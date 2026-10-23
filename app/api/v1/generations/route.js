import {
  requireSession,
  verifyMutationOrigin,
} from '../../../../packages/timecapsule/src/server/auth.js';
import { submitGenerationJob } from '../../../../packages/timecapsule/src/server/orchestrator.js';
import { listJobs } from '../../../../packages/timecapsule/src/server/store.js';
import { checkRateLimit } from '../../../../packages/timecapsule/src/server/rateLimit.js';
import { handleCorsPreflight, getCorsHeaders } from '../../../../packages/timecapsule/src/server/cors.js';
import { scrubSecrets, sanitizeError } from '../../../../packages/timecapsule/src/server/credentials.js';

export async function OPTIONS(request) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  return new Response(null, { status: 204 });
}

export async function GET(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const session = await requireSession(request, { requiredScope: 'generations:read' });
    checkRateLimit(request, { action: 'default', session });
    const url = new URL(request.url);
    const queryTenantId = url.searchParams.get('tenant_id');
    const targetTenantId =
      session.role === 'platform_admin' && queryTenantId ? queryTenantId : session.tenant_id;
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const jobs = await listJobs(targetTenantId, limit);
    return Response.json(
      {
        ok: true,
        items: scrubSecrets(jobs),
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    const safe = sanitizeError(err, err.statusCode || 500);
    return Response.json(
      { ok: false, error: safe.error, code: safe.code },
      {
        status: safe.statusCode,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...(err.headers || {}),
          ...corsHeaders,
        },
      }
    );
  }
}

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);
  let rateHeaders = {};
  try {
    verifyMutationOrigin(request);
    const session = await requireSession(request, { requiredScope: 'generations:write' });

    // Abuse prevention & rate limiting (Security Task B1)
    const rateStatus = checkRateLimit(request, { action: 'generation', session });
    rateHeaders = rateStatus.headers;

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
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...rateHeaders,
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    const safe = sanitizeError(err, err.statusCode || err.status || 400);
    return Response.json(
      { error: safe.error, code: safe.code },
      {
        status: safe.statusCode,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          ...(err.headers || {}),
          ...corsHeaders,
        },
      }
    );
  }
}
