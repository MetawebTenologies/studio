import { query, closePool } from '../server/db.js';
import { reconcileAmbiguousJob } from '../server/store.js';

async function main() {
  const rawCmd = process.argv[2] || 'list';
  const cmd = rawCmd === '--dry-run' || rawCmd === '-d' ? 'list' : rawCmd;
  try {
    if (cmd === 'list') {
      const res = await query(
        `SELECT job_id, tenant_id, model, modality, provider, submission_state, submission_attempt_id,
                credits_reserved, error, updated_at
         FROM jobs
         WHERE status = 'reconciling_submission' OR submission_state = 'submission_unknown'
         ORDER BY updated_at ASC`
      );
      console.log(
        JSON.stringify(
          {
            ok: true,
            command: 'list',
            count: res.rowCount,
            ambiguous_jobs: res.rows,
          },
          null,
          2
        )
      );
    } else if (cmd === 'attach') {
      const jobId = process.argv[3];
      const providerJobId = process.argv[4];
      const reason = process.argv[5] || 'Operator CLI attach_provider_task';
      if (!jobId || !providerJobId) {
        throw new Error('Usage: npm run db:reconcile -- attach <job_id> <provider_job_id> [reason]');
      }
      const updated = await reconcileAmbiguousJob({
        jobId,
        action: 'attach_provider_task',
        providerJobId,
        reason,
      });
      console.log(JSON.stringify({ ok: true, command: 'attach', job: updated }, null, 2));
    } else if (cmd === 'refund') {
      const jobId = process.argv[3];
      const reason = process.argv[4] || 'Operator CLI confirmed provider never created task';
      if (!jobId) {
        throw new Error('Usage: npm run db:reconcile -- refund <job_id> [reason]');
      }
      const result = await reconcileAmbiguousJob({
        jobId,
        action: 'confirm_not_submitted_refund',
        reason,
      });
      console.log(JSON.stringify({ ok: true, command: 'refund', job: result.job }, null, 2));
    } else {
      throw new Error(`Unknown command: ${cmd}. Expected: list | attach | refund`);
    }
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
