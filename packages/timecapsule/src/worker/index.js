import crypto from 'crypto';
import { query } from '../server/db.js';
import {
  claimNextRunnableJob,
  heartbeatJobLease,
  beginProviderSubmissionAttempt,
  recordProviderTaskId,
  markSubmissionAmbiguous,
  scheduleNextWorkerAttempt,
  completeJobSuccess,
  completeJobFailure,
} from '../server/store.js';
import {
  submitTaskToProvider,
  pollProviderTaskStatus,
} from '../server/providers.js';

export function createDurableWorker(options = {}) {
  const workerId =
    options.workerId || `wrk_${process.pid}_${crypto.randomBytes(4).toString('hex')}`;
  const leaseDurationMs = Number(options.leaseDurationMs || 15000);
  const heartbeatIntervalMs = Number(
    options.heartbeatIntervalMs || Math.max(200, Math.floor(leaseDurationMs / 3))
  );
  const idlePollIntervalMs = Number(options.idlePollIntervalMs || 200);
  const providerPollDelayMs = Number(
    options.providerPollDelayMs || process.env.TIMECAPSULE_KIE_POLL_INTERVAL_MS || 250
  );
  const submissionRetryBaseMs = Number(options.submissionRetryBaseMs || 150);
  const fetchImpl = options.fetchImpl || null;

  // Fault-injection hooks for deterministic crash/interruption verification tests
  const onAfterBeginSubmission = options.onAfterBeginSubmission || null;
  const onAfterProviderAcceptBeforePersist = options.onAfterProviderAcceptBeforePersist || null;

  let running = false;
  let shuttingDown = false;
  let activeStepPromise = null;
  let loopTimer = null;

  async function executeClaimedJob(claimedJob) {
    const jobId = claimedJob.job_id;
    const fencingToken = claimedJob.fencing_token;

    let heartbeatTimer = null;
    if (heartbeatIntervalMs > 0) {
      heartbeatTimer = setInterval(() => {
        heartbeatJobLease({
          jobId,
          workerId,
          fencingToken,
          leaseDurationMs,
        }).catch(() => {
          // If lease is lost/fenced, subsequent state transitions will reject with STALE_WORKER_FENCING_TOKEN
        });
      }, heartbeatIntervalMs);
      if (typeof heartbeatTimer.unref === 'function') {
        heartbeatTimer.unref();
      }
    }

    try {
      // S2 Tenant Status Guard: Worker refuses execution for jobs belonging to suspended or killed tenants
      const tenantRes = await query(
        'SELECT status FROM tenants WHERE tenant_id = $1',
        [claimedJob.tenant_id]
      );
      const tenantStatus = tenantRes.rows[0]?.status;
      if (tenantStatus === 'suspended' || tenantStatus === 'killed') {
        const failedJob = await completeJobFailure({
          jobId,
          tenantId: claimedJob.tenant_id,
          workerId,
          fencingToken,
          errorMessage: `Worker refused execution: tenant is ${tenantStatus}`,
          providerDetails: {
            code: `TENANT_${tenantStatus.toUpperCase()}`,
            tenant_status: tenantStatus,
          },
        });
        return {
          processed: true,
          action: `refused_${tenantStatus}`,
          job: failedJob,
        };
      }

      // Case 1: Job has not yet obtained a provider_job_id
      if (!claimedJob.provider_job_id) {
        const jobSubmitting = await beginProviderSubmissionAttempt({
          jobId,
          workerId,
          fencingToken,
        });

        if (onAfterBeginSubmission) {
          await onAfterBeginSubmission(jobSubmitting, { workerId, fencingToken });
        }

        let submissionResult;
        try {
          submissionResult = await submitTaskToProvider(jobSubmitting, { fetchImpl });
        } catch (err) {
          if (err.ambiguousSubmission) {
            const ambiguousJob = await markSubmissionAmbiguous({
              jobId,
              workerId,
              fencingToken,
              reason: err.message,
            });
            return {
              processed: true,
              action: 'marked_ambiguous',
              job: ambiguousJob,
            };
          }

          if (
            err.retryableSubmission &&
            jobSubmitting.submission_attempts < jobSubmitting.max_submission_attempts
          ) {
            const backoffMs =
              submissionRetryBaseMs * Math.pow(2, Math.max(0, jobSubmitting.submission_attempts - 1));
            const retriedJob = await scheduleNextWorkerAttempt({
              jobId,
              workerId,
              fencingToken,
              delayMs: backoffMs,
              mode: 'submission_retry',
              error: err.message,
            });
            return {
              processed: true,
              action: 'scheduled_submission_retry',
              job: retriedJob,
            };
          }

          const { job: failedJob } = await completeJobFailure({
            jobId,
            tenantId: claimedJob.tenant_id,
            workerId,
            fencingToken,
            errorMessage: err.message || 'Provider task submission failed',
            providerDetails: err.providerDetails || null,
          });
          return {
            processed: true,
            action: 'failed_submission',
            job: failedJob,
          };
        }

        if (onAfterProviderAcceptBeforePersist) {
          await onAfterProviderAcceptBeforePersist(submissionResult, jobSubmitting, {
            workerId,
            fencingToken,
          });
        }

        // Persist provider_job_id immediately upon receipt before any polling
        const jobWithTaskId = await recordProviderTaskId({
          jobId,
          workerId,
          fencingToken,
          providerJobId: submissionResult.providerJobId,
          providerDetails: submissionResult.providerDetails || null,
        });

        if (submissionResult.immediateCompletion) {
          const { job: completedJob } = await completeJobSuccess({
            jobId,
            tenantId: claimedJob.tenant_id,
            workerId,
            fencingToken,
            providerJobId: submissionResult.providerJobId,
            sourceUrl: submissionResult.immediateCompletion.sourceUrl,
            outputs: submissionResult.immediateCompletion.outputs || null,
            userBilledCredits: submissionResult.immediateCompletion.userBilledCredits ?? null,
            providerReportedCost: submissionResult.immediateCompletion.providerReportedCost ?? null,
            providerCostUnit: submissionResult.immediateCompletion.providerCostUnit ?? null,
            providerDetails: submissionResult.providerDetails || null,
          });
          return {
            processed: true,
            action: 'succeeded',
            job: completedJob,
          };
        }

        const scheduledJob = await scheduleNextWorkerAttempt({
          jobId,
          workerId,
          fencingToken,
          delayMs: providerPollDelayMs,
          mode: 'poll',
          progress: 0.15,
          stage: 'queued_at_provider',
        });

        return {
          processed: true,
          action: 'submitted_and_scheduled_poll',
          job: scheduledJob || jobWithTaskId,
        };
      }

      // Case 2: Job already has a persisted `provider_job_id` -> poll status without resubmitting
      let pollResult;
      try {
        pollResult = await pollProviderTaskStatus(claimedJob, { fetchImpl });
      } catch (err) {
        const nextPollAttempt = Number(claimedJob.poll_attempts || 0) + 1;
        if (err.retryablePoll !== false && nextPollAttempt < claimedJob.max_poll_attempts) {
          const backoffMs = Math.min(5000, providerPollDelayMs * 2);
          const scheduledJob = await scheduleNextWorkerAttempt({
            jobId,
            workerId,
            fencingToken,
            delayMs: backoffMs,
            mode: 'poll',
            stage: 'poll_retry',
            error: err.message,
          });
          return {
            processed: true,
            action: 'scheduled_poll_retry',
            job: scheduledJob,
          };
        }

        const { job: failedJob } = await completeJobFailure({
          jobId,
          tenantId: claimedJob.tenant_id,
          workerId,
          fencingToken,
          errorMessage: err.message || 'Provider status polling failed',
          providerDetails: err.providerDetails || null,
        });
        return {
          processed: true,
          action: 'failed_poll',
          job: failedJob,
        };
      }

      if (pollResult.status === 'succeeded') {
        const { job: completedJob } = await completeJobSuccess({
          jobId,
          tenantId: claimedJob.tenant_id,
          workerId,
          fencingToken,
          providerJobId: claimedJob.provider_job_id,
          sourceUrl: pollResult.sourceUrl,
          outputs: pollResult.outputs || null,
          userBilledCredits: pollResult.userBilledCredits ?? null,
          providerReportedCost: pollResult.providerReportedCost ?? null,
          providerCostUnit: pollResult.providerCostUnit ?? null,
          providerDetails: pollResult.providerDetails || null,
        });
        return {
          processed: true,
          action: 'succeeded',
          job: completedJob,
        };
      }

      if (pollResult.status === 'failed') {
        const { job: failedJob } = await completeJobFailure({
          jobId,
          tenantId: claimedJob.tenant_id,
          workerId,
          fencingToken,
          errorMessage: pollResult.error || 'Provider reported generation failure',
          providerDetails: pollResult.providerDetails || null,
        });
        return {
          processed: true,
          action: 'failed',
          job: failedJob,
        };
      }

      // Still running at provider
      const nextPollAttempt = Number(claimedJob.poll_attempts || 0) + 1;
      if (nextPollAttempt >= claimedJob.max_poll_attempts) {
        const { job: timedOutJob } = await completeJobFailure({
          jobId,
          tenantId: claimedJob.tenant_id,
          workerId,
          fencingToken,
          errorMessage: `Provider status polling timed out after ${nextPollAttempt} attempts`,
        });
        return {
          processed: true,
          action: 'timed_out',
          job: timedOutJob,
        };
      }

      const scheduledJob = await scheduleNextWorkerAttempt({
        jobId,
        workerId,
        fencingToken,
        delayMs: providerPollDelayMs,
        mode: 'poll',
        progress: pollResult.progress,
        stage: pollResult.stage || 'generating',
      });

      return {
        processed: true,
        action: 'polled_running',
        job: scheduledJob,
      };
    } finally {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
    }
  }

  async function runOnce() {
    if (shuttingDown) {
      return { processed: false, job: null, reconciliationRequired: false };
    }
    const claim = await claimNextRunnableJob({ workerId, leaseDurationMs });
    if (!claim) {
      return { processed: false, job: null, reconciliationRequired: false };
    }
    if (claim.reconciliationRequired) {
      return {
        processed: true,
        action: 'reconciliation_required',
        job: claim.job,
        reconciliationRequired: true,
      };
    }

    activeStepPromise = executeClaimedJob(claim.job);
    try {
      return await activeStepPromise;
    } finally {
      activeStepPromise = null;
    }
  }

  async function drainUntilSettled({ maxIterations = 100, waitMs = 30 } = {}) {
    for (let i = 0; i < maxIterations; i++) {
      const step = await runOnce();
      if (!step.processed) {
        await new Promise((r) => setTimeout(r, waitMs));
        const retryStep = await runOnce();
        if (!retryStep.processed) {
          break;
        }
      } else if (
        step.action === 'submitted_and_scheduled_poll' ||
        step.action === 'polled_running' ||
        step.action === 'scheduled_submission_retry' ||
        step.action === 'scheduled_poll_retry'
      ) {
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }

  function scheduleNextTick(delay) {
    if (!running || shuttingDown) return;
    loopTimer = setTimeout(async () => {
      if (!running || shuttingDown) return;
      try {
        const res = await runOnce();
        scheduleNextTick(res.processed ? 10 : idlePollIntervalMs);
      } catch {
        scheduleNextTick(idlePollIntervalMs);
      }
    }, delay);
  }

  function start() {
    if (running) return;
    running = true;
    shuttingDown = false;
    scheduleNextTick(5);
  }

  async function stop() {
    shuttingDown = true;
    running = false;
    if (loopTimer) {
      clearTimeout(loopTimer);
      loopTimer = null;
    }
    if (activeStepPromise) {
      try {
        await activeStepPromise;
      } catch {
        // ignore in-flight step error during shutdown
      }
    }
  }

  return {
    workerId,
    runOnce,
    executeClaimedJob,
    drainUntilSettled,
    start,
    stop,
  };
}
