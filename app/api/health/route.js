import { query } from '../../../packages/timecapsule/src/server/db.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const check = searchParams.get('check');

  if (check === 'readiness') {
    try {
      await query('SELECT 1');
      return Response.json(
        { status: 'ready', database: 'connected', timestamp: new Date().toISOString() },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    } catch (err) {
      return Response.json(
        { status: 'unready', database: 'disconnected', error: err.message },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  // Default liveness check
  return Response.json(
    { status: 'live', timestamp: new Date().toISOString() },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
