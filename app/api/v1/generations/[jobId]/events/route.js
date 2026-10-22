import {
  requireSession,
  authorizeJobAccess,
} from '../../../../../../packages/timecapsule/src/server/auth.js';
import {
  getJob,
  getJobEventsAfter,
} from '../../../../../../packages/timecapsule/src/server/store.js';

export async function GET(request, context) {
  try {
    const session = await requireSession(request);
    const resolvedParams = await context.params;
    const job = await authorizeJobAccess(session, resolvedParams.jobId);
    const encoder = new TextEncoder();

    const url = new URL(request.url || 'http://localhost');
    const lastEventIdHeader =
      request?.headers?.get?.('last-event-id') ||
      request?.headers?.['last-event-id'] ||
      url.searchParams.get('lastEventId') ||
      null;

    const pollIntervalMs = Math.max(
      20,
      Number(process.env.TIMECAPSULE_SSE_POLL_MS || 80)
    );

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        let pollTimer = null;
        let lastDeliveredVersion = 0;
        let isInitialReplay = true;

        const closeStream = () => {
          if (closed) return;
          closed = true;
          if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = null;
          }
          try {
            controller.close();
          } catch {
            // ignore already closed
          }
        };

        if (request?.signal) {
          if (request.signal.aborted) {
            closeStream();
            return;
          }
          request.signal.addEventListener('abort', closeStream);
        }

        const sendEnvelope = (envelope) => {
          if (closed || !envelope) return;
          const payload = `id: ${envelope.event_version}\nevent: ${envelope.type}\ndata: ${JSON.stringify(envelope)}\n\n`;
          controller.enqueue(encoder.encode(payload));
          lastDeliveredVersion = Math.max(lastDeliveredVersion, Number(envelope.event_version));
          if (envelope.status === 'succeeded' || envelope.status === 'failed') {
            closeStream();
          }
        };

        const flushPersistedEvents = async () => {
          if (closed) return;
          try {
            const events = await getJobEventsAfter(job.job_id, {
              afterEventVersion: lastDeliveredVersion,
              lastEventId: isInitialReplay ? lastEventIdHeader : null,
              tenant_id: job.tenant_id,
            });
            isInitialReplay = false;

            for (const evt of events) {
              if (closed) return;
              sendEnvelope(evt);
            }

            if (closed) return;

            // If no events had terminal status yet, also check if the job is already terminal
            // (e.g. when client reconnects with Last-Event-ID already equal to the final event version).
            const latestJob = await getJob(job.job_id, { tenant_id: job.tenant_id });
            if (
              !latestJob ||
              latestJob.status === 'succeeded' ||
              latestJob.status === 'failed'
            ) {
              if (
                latestJob &&
                Number(latestJob.last_event_version) <= lastDeliveredVersion
              ) {
                closeStream();
                return;
              }
            }

            if (!closed) {
              pollTimer = setTimeout(flushPersistedEvents, pollIntervalMs);
            }
          } catch {
            closeStream();
          }
        };

        await flushPersistedEvents();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'private, no-cache, no-store, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return Response.json(
      { error: err.message || 'Unauthorized', code: err.code || 'SSE_ERROR' },
      {
        status: err.statusCode || err.status || 401,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      }
    );
  }
}
