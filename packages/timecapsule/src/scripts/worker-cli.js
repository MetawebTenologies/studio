import { createDurableWorker } from '../worker/index.js';
import { closePool } from '../server/db.js';

async function main() {
  const worker = createDurableWorker({
    workerId: process.env.TIMECAPSULE_WORKER_ID || undefined,
    leaseDurationMs: Number(process.env.TIMECAPSULE_WORKER_LEASE_MS || 15000),
    idlePollIntervalMs: Number(process.env.TIMECAPSULE_WORKER_IDLE_POLL_MS || 100),
    providerPollDelayMs: Number(process.env.TIMECAPSULE_KIE_POLL_INTERVAL_MS || 200),
  });

  const shutdown = async (signal) => {
    console.log(JSON.stringify({ event: 'worker.stopping', worker_id: worker.workerId, signal }));
    await worker.stop();
    await closePool();
    console.log(JSON.stringify({ event: 'worker.stopped', worker_id: worker.workerId }));
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  worker.start();
  console.log(JSON.stringify({ event: 'worker.started', worker_id: worker.workerId }));
}

main().catch(async (err) => {
  console.error(JSON.stringify({ event: 'worker.fatal', error: err.message }));
  await closePool();
  process.exit(1);
});
