import {
  requireSession,
  authorizeJobAccess,
} from '../../../../../../packages/timecapsule/src/server/auth.js';
import {
  getLatestJobSnapshotEvent,
  subscribeJobEvents,
} from '../../../../../../packages/timecapsule/src/server/store.js';

export async function GET(request, context) {
  try {
    const session = await requireSession(request);
    const resolvedParams = await context.params;
    const job = await authorizeJobAccess(session, resolvedParams.jobId);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        let closed = false;
        let unsubscribe = () => {};

        const closeStream = () => {
          if (closed) return;
          closed = true;
          unsubscribe();
          try {
            controller.close();
          } catch {
            // ignore already closed
          }
        };

        const sendEnvelope = (envelope) => {
          if (closed || !envelope) return;
          const payload = `id: ${envelope.event_id}\nevent: ${envelope.type}\ndata: ${JSON.stringify(envelope)}\n\n`;
          controller.enqueue(encoder.encode(payload));
          if (envelope.status === 'succeeded' || envelope.status === 'failed') {
            closeStream();
          }
        };

        // Replay the latest job snapshot immediately on connect/reconnect
        const snapshot = getLatestJobSnapshotEvent(job.job_id);
        if (snapshot) {
          sendEnvelope(snapshot);
        }

        if (!closed) {
          unsubscribe = subscribeJobEvents(job.job_id, (envelope) => {
            sendEnvelope(envelope);
          });
        }

        if (request?.signal) {
          request.signal.addEventListener('abort', closeStream);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Unauthorized' }), {
      status: err.statusCode || 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
