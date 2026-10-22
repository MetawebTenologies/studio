import crypto from 'crypto';
import {
  query,
  withTransaction,
  withSystemContext,
  withTenantContext,
  assumeSystemRole,
  parseSafeCreditBigInt,
  assertValidCreditUnits,
  assertDisposableTestDatabase,
  runMigrations,
  seedDevelopmentTenant,
} from './db.js';
import { validateExternalMediaUrl } from './media-validator.js';
import { redactProviderDetails } from './adapters/redact.js';

function formatJobRow(row) {
  if (!row) return null;
  const userBilledCredits =
    row.user_billed_credits !== null && row.user_billed_credits !== undefined
      ? parseSafeCreditBigInt(row.user_billed_credits, 'user_billed_credits')
      : row.actual_cost !== null && row.actual_cost !== undefined
        ? parseSafeCreditBigInt(row.actual_cost, 'actual_cost')
        : null;
  const providerReportedCost =
    row.provider_reported_cost !== null && row.provider_reported_cost !== undefined
      ? Number(row.provider_reported_cost)
      : null;

  return {
    job_id: row.job_id,
    tenant_id: row.tenant_id,
    user_id: row.user_id,
    project_id: row.project_id,
    idempotency_key: row.idempotency_key,
    modality: row.modality,
    model: row.model,
    resolved_provider_model: row.resolved_provider_model,
    execution_route: row.execution_route || 'legacy',
    execution_route_version: row.execution_route_version || '2026-10-21.v1',
    pricing_policy_version: row.pricing_policy_version || 'tc-pricing-v1',
    inputs: row.inputs_json || {},
    workflow: row.workflow_json || {},
    delivery: row.delivery_json || {},
    status: row.status,
    submission_state: row.submission_state,
    submission_attempt_id: row.submission_attempt_id,
    submission_attempts: Number(row.submission_attempts || 0),
    poll_attempts: Number(row.poll_attempts || 0),
    max_submission_attempts: Number(row.max_submission_attempts || 3),
    max_poll_attempts: Number(row.max_poll_attempts || 180),
    next_run_at: row.next_run_at ? new Date(row.next_run_at).toISOString() : null,
    lease_owner: row.lease_owner,
    lease_expires_at: row.lease_expires_at ? new Date(row.lease_expires_at).toISOString() : null,
    fencing_token: Number(row.fencing_token || 0),
    progress: Number(row.progress || 0),
    provider: row.provider,
    provider_job_id: row.provider_job_id,
    credits_reserved: parseSafeCreditBigInt(row.credits_reserved, 'credits_reserved'),
    estimated_cost: parseSafeCreditBigInt(row.estimated_cost, 'estimated_cost'),
    user_billed_credits: userBilledCredits,
    actual_cost: userBilledCredits,
    provider_reported_cost: providerReportedCost,
    provider_cost_unit: row.provider_cost_unit || null,
    last_event_version: Number(row.last_event_version || 0),
    events_url: row.events_url,
    output: row.output_json || null,
    outputs: row.outputs_json || [],
    error: row.error || null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  };
}

function formatEventRow(row) {
  if (!row) return null;
  return {
    seq_id: Number(row.seq_id),
    event_id: row.event_id,
    event_version: Number(row.event_version),
    job_id: row.job_id,
    tenant_id: row.tenant_id,
    type: row.type,
    status: row.status,
    progress: Number(row.progress || 0),
    provider: row.provider,
    provider_job_id: row.provider_job_id,
    occurred_at: row.occurred_at ? new Date(row.occurred_at).toISOString() : null,
    data: row.data_json || {},
  };
}

function formatAssetRow(row) {
  if (!row) return null;
  return {
    asset_id: row.asset_id,
    tenant_id: row.tenant_id,
    user_id: row.user_id || null,
    job_id: row.job_id,
    modality: row.modality,
    content_type: row.content_type,
    storage_type: row.storage_type,
    provider: row.provider || null,
    request_id: row.request_id || null,
    durable: Boolean(row.durable),
    private: Boolean(row.private),
    source_url: row.source_url,
    filename: row.filename,
    status: row.status,
    url: row.url,
    thumbnail_url: row.thumbnail_url || null,
    metadata: row.metadata_json || {},
    deleted_at: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

/**
 * Resets the PostgreSQL tables and seeds explicit test tenants.
 * Restricted strictly to non-production test environments and explicitly
 * designated disposable *_test databases. Refuses to run against the application DB.
 */
export async function resetStoreForTests(
  initialCredits = 5000,
  tenantIds = ['org_preview_default', 'org_default']
) {
  const expectedTestDb = assertDisposableTestDatabase();
  await runMigrations();
  await withTransaction(async (client) => {
    const dbCheck = await client.query('SELECT current_database() AS db_name');
    const actualDbName = String(dbCheck.rows[0]?.db_name || '').trim();
    if (
      !actualDbName ||
      actualDbName.toLowerCase() !== expectedTestDb.toLowerCase() ||
      !actualDbName.toLowerCase().endsWith('_test')
    ) {
      const err = new Error(
        `Refusing to TRUNCATE non-test database "${actualDbName}". Expected disposable test database "${expectedTestDb}".`
      );
      err.code = 'NON_DISPOSABLE_DATABASE_REFUSED';
      err.statusCode = 403;
      throw err;
    }

    await client.query(
      'TRUNCATE TABLE job_events, assets, credit_ledger, credit_reservations, idempotency_keys, jobs, tenants RESTART IDENTITY CASCADE'
    );
  });
  for (const tenantId of tenantIds) {
    await seedDevelopmentTenant({ tenantId, targetCredits: initialCredits });
  }
}

/**
 * Reads tenant credit balances from PostgreSQL without auto-creating free credits on boot.
 */
export async function getTenantCredits(tenantId) {
  if (!tenantId) {
    const err = new Error('tenantId is required');
    err.code = 'MISSING_TENANT_ID';
    err.statusCode = 400;
    throw err;
  }
  return withTenantContext(tenantId, async (client) => {
    const res = await client.query(
      `SELECT tenant_id, credits_balance, credits_reserved
       FROM tenants
       WHERE tenant_id = $1`,
      [tenantId]
    );
    if (res.rowCount === 0) {
      return {
        tenant_id: tenantId,
        available_credits: 0,
        total_credits: 0,
        reserved_credits: 0,
      };
    }
    const row = res.rows[0];
    const balance = parseSafeCreditBigInt(row.credits_balance, 'credits_balance');
    const reserved = parseSafeCreditBigInt(row.credits_reserved, 'credits_reserved');
    return {
      tenant_id: row.tenant_id,
      available_credits: balance - reserved,
      total_credits: balance,
      reserved_credits: reserved,
    };
  });
}

export async function getTenantLedger(tenantId) {
  if (!tenantId) return [];
  return withTenantContext(tenantId, async (client) => {
    const res = await client.query(
      `SELECT entry_id, tenant_id, job_id, entry_type, amount, balance_after, reserved_after, metadata_json, occurred_at
       FROM credit_ledger
       WHERE tenant_id = $1
       ORDER BY occurred_at ASC, entry_id ASC`,
      [tenantId]
    );
    return res.rows.map((r) => ({
      entry_id: r.entry_id,
      tenant_id: r.tenant_id,
      job_id: r.job_id,
      entry_type: r.entry_type,
      amount: parseSafeCreditBigInt(r.amount, 'amount'),
      balance_after: parseSafeCreditBigInt(r.balance_after, 'balance_after'),
      reserved_after: parseSafeCreditBigInt(r.reserved_after, 'reserved_after'),
      metadata: r.metadata_json || {},
      occurred_at: new Date(r.occurred_at).toISOString(),
    }));
  });
}

export async function getCreditReservation(jobId, optionsOrTenant = {}) {
  const tenant_id =
    typeof optionsOrTenant === 'string' ? optionsOrTenant : optionsOrTenant?.tenant_id || null;
  const runner = tenant_id
    ? (cb) => withTenantContext(tenant_id, cb)
    : (cb) => withSystemContext(cb);
  return runner(async (client) => {
    const res = await client.query(
      `SELECT job_id, tenant_id, amount, status, settled_amount, reserved_at, settled_at, released_at, updated_at
       FROM credit_reservations
       WHERE job_id = $1`,
      [jobId]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      job_id: r.job_id,
      tenant_id: r.tenant_id,
      amount: parseSafeCreditBigInt(r.amount, 'amount'),
      status: r.status,
      settled_amount:
        r.settled_amount !== null && r.settled_amount !== undefined
          ? parseSafeCreditBigInt(r.settled_amount, 'settled_amount')
          : null,
      reserved_at: new Date(r.reserved_at).toISOString(),
      settled_at: r.settled_at ? new Date(r.settled_at).toISOString() : null,
      released_at: r.released_at ? new Date(r.released_at).toISOString() : null,
    };
  });
}

/**
 * Checks if an idempotency key already exists for a tenant BEFORE checking current provider
 * credentials, so an already-accepted idempotent request can still be replayed even if
 * provider configuration later becomes unavailable.
 */
export async function checkExistingIdempotentJob(tenantId, idempotencyKey, requestFingerprint) {
  if (!idempotencyKey) return null;
  return withTenantContext(tenantId, async (client) => {
    const res = await client.query(
      `SELECT ik.request_fingerprint, j.*
       FROM idempotency_keys ik
       JOIN jobs j ON j.tenant_id = ik.tenant_id AND j.job_id = ik.job_id
       WHERE ik.tenant_id = $1 AND ik.idempotency_key = $2`,
      [tenantId, idempotencyKey]
    );
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    if (requestFingerprint && row.request_fingerprint !== requestFingerprint) {
      const err = new Error(
        `Idempotency-Key "${idempotencyKey}" has already been used with a different request payload`
      );
      err.code = 'IDEMPOTENCY_PAYLOAD_MISMATCH';
      err.status = 409;
      err.statusCode = 409;
      throw err;
    }
    return formatJobRow(row);
  });
}

/**
 * Creates the job, reservation, ledger entry, idempotency binding, initial job event,
 * and durable worker dispatch eligibility in a single ACID PostgreSQL transaction.
 *
 * Lock order:
 *   1. tenants (FOR UPDATE)
 *   2. jobs (INSERT)
 *   3. credit_reservations (INSERT)
 *   4. credit_ledger (INSERT)
 *   5. idempotency_keys (INSERT)
 *   6. job_events (INSERT)
 */
export async function createSubmissionTransaction({
  tenantId,
  userId,
  projectId = 'prj_default',
  idempotencyKey = null,
  requestFingerprint,
  canonicalPayload,
  modality,
  model,
  resolvedProviderModel,
  provider,
  executionRoute = 'legacy',
  executionRouteVersion = '2026-10-21.v1',
  pricingPolicyVersion = 'tc-pricing-v1',
  inputs,
  workflow,
  delivery,
  estimatedCost,
}) {
  const validCost = assertValidCreditUnits(estimatedCost, {
    allowZero: false,
    fieldName: 'estimatedCost',
  });

  // TASK A3 LIMITATION & SPLIT PROPOSAL NOTE:
  // createSubmissionTransaction currently executes entirely under timecapsule_system_role because:
  // 1. Locking & updating tenants.credits_reserved requires elevated privileges that tenant roles
  //    must NOT possess (otherwise a malicious tenant could grant or modify their own credit limit).
  // 2. Initializing unseeded tenants (INSERT INTO tenants) requires administrative rights.
  // 3. Appending to immutable audit ledgers (credit_ledger and job_events) must be tamper-proof.
  //
  // Proposed future split:
  // - Step 1 (Tenant Context): Validate tenant session, check user quota, and stage the job input payload.
  // - Step 2 (System Service / Credit Gate): Atomically lock tenant balance, reserve credits, and append ledger entry.
  // - Step 3 (Tenant Context): Insert job row and idempotency key bound to the reservation ID.
  return withTransaction(async (client) => {
    await assumeSystemRole(client);
    // Ensure a 0-balance tenant row exists if never seeded, then acquire row lock (Lock #1: tenants)
    await client.query(
      `INSERT INTO tenants (tenant_id, credits_balance, credits_reserved)
       VALUES ($1, 0, 0)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenantId]
    );

    const tenantRes = await client.query(
      `SELECT tenant_id, credits_balance, credits_reserved
       FROM tenants
       WHERE tenant_id = $1
       FOR UPDATE`,
      [tenantId]
    );
    const tenantRow = tenantRes.rows[0];

    // Re-check idempotency under the tenant row lock so concurrent duplicate requests serialize cleanly
    if (idempotencyKey) {
      const idemRes = await client.query(
        `SELECT ik.request_fingerprint, j.*
         FROM idempotency_keys ik
         JOIN jobs j ON j.tenant_id = ik.tenant_id AND j.job_id = ik.job_id
         WHERE ik.tenant_id = $1 AND ik.idempotency_key = $2`,
        [tenantId, idempotencyKey]
      );
      if (idemRes.rowCount > 0) {
        const existingRow = idemRes.rows[0];
        if (existingRow.request_fingerprint !== requestFingerprint) {
          const err = new Error(
            `Idempotency-Key "${idempotencyKey}" has already been used with a different request payload`
          );
          err.code = 'IDEMPOTENCY_PAYLOAD_MISMATCH';
          err.status = 409;
          err.statusCode = 409;
          throw err;
        }
        return {
          job: formatJobRow(existingRow),
          deduplicated: true,
        };
      }
    }

    const currentBalance = parseSafeCreditBigInt(tenantRow.credits_balance, 'credits_balance');
    const currentReserved = parseSafeCreditBigInt(tenantRow.credits_reserved, 'credits_reserved');
    const available = currentBalance - currentReserved;

    if (available < validCost) {
      const err = new Error(
        `Insufficient credits: required ${validCost}, available ${available}`
      );
      err.code = 'INSUFFICIENT_CREDITS';
      err.status = 402;
      err.statusCode = 402;
      throw err;
    }

    const newReserved = currentReserved + validCost;
    await client.query(
      `UPDATE tenants
       SET credits_reserved = $2, updated_at = NOW()
       WHERE tenant_id = $1`,
      [tenantId, newReserved]
    );

    const jobId = `job_${crypto.randomBytes(8).toString('hex')}`;
    const eventsUrl = `/api/v1/generations/${jobId}/events`;

    const jobInsertRes = await client.query(
      `INSERT INTO jobs (
         job_id, tenant_id, user_id, project_id, idempotency_key,
         modality, model, resolved_provider_model, provider,
         execution_route, execution_route_version, pricing_policy_version,
         status, submission_state, progress,
         credits_reserved, estimated_cost,
         inputs_json, workflow_json, delivery_json,
         last_event_version, events_url
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9,
         $10, $11, $12,
         'queued', 'not_submitted', 0,
         $13, $13,
         $14::jsonb, $15::jsonb, $16::jsonb,
         1, $17
       ) RETURNING *`,
      [
        jobId,
        tenantId,
        userId,
        projectId,
        idempotencyKey,
        modality,
        model,
        resolvedProviderModel,
        provider,
        executionRoute,
        executionRouteVersion,
        pricingPolicyVersion,
        validCost,
        JSON.stringify(inputs || {}),
        JSON.stringify(workflow || {}),
        JSON.stringify(delivery || {}),
        eventsUrl,
      ]
    );

    await client.query(
      `INSERT INTO credit_reservations (
         job_id, tenant_id, amount, status
       ) VALUES ($1, $2, $3, 'reserved')`,
      [jobId, tenantId, validCost]
    );

    const ledgerEntryId = `led_${crypto.randomBytes(8).toString('hex')}`;
    await client.query(
      `INSERT INTO credit_ledger (
         entry_id, tenant_id, job_id, entry_type, amount, balance_after, reserved_after, metadata_json
       ) VALUES ($1, $2, $3, 'reserve', $4, $5, $6, $7::jsonb)`,
      [
        ledgerEntryId,
        tenantId,
        jobId,
        validCost,
        currentBalance,
        newReserved,
        JSON.stringify({
          model,
          modality,
          provider,
          execution_route: executionRoute,
          execution_route_version: executionRouteVersion,
          pricing_policy_version: pricingPolicyVersion,
        }),
      ]
    );

    if (idempotencyKey) {
      await client.query(
        `INSERT INTO idempotency_keys (
           tenant_id, idempotency_key, request_fingerprint, normalized_request_json, job_id
         ) VALUES ($1, $2, $3, $4::jsonb, $5)`,
        [
          tenantId,
          idempotencyKey,
          requestFingerprint,
          JSON.stringify(canonicalPayload),
          jobId,
        ]
      );
    }

    const eventId = `evt_${crypto.randomBytes(8).toString('hex')}`;
    await client.query(
      `INSERT INTO job_events (
         event_id, job_id, tenant_id, event_version, type, status, progress, provider, provider_job_id, data_json
       ) VALUES ($1, $2, $3, 1, 'generation.accepted', 'queued', 0, $4, NULL, $5::jsonb)`,
      [
        eventId,
        jobId,
        tenantId,
        provider,
        JSON.stringify({
          credits_reserved: validCost,
          estimated_cost: validCost,
          execution_route: executionRoute,
          pricing_policy_version: pricingPolicyVersion,
        }),
      ]
    );

    return {
      job: formatJobRow(jobInsertRes.rows[0]),
      deduplicated: false,
    };
  });
}

export async function getJob(jobId, optionsOrTenant = {}) {
  if (!jobId) return null;
  const tenant_id =
    typeof optionsOrTenant === 'string' ? optionsOrTenant : optionsOrTenant?.tenant_id || null;
  const runner = tenant_id
    ? (cb) => withTenantContext(tenant_id, cb)
    : (cb) => withSystemContext(cb);
  return runner(async (client) => {
    const res = await client.query('SELECT * FROM jobs WHERE job_id = $1', [jobId]);
    if (res.rowCount === 0) return null;
    return formatJobRow(res.rows[0]);
  });
}

export async function getJobPrivateProviderDetails(jobId, optionsOrTenant = {}) {
  if (!jobId) return null;
  const tenant_id =
    typeof optionsOrTenant === 'string' ? optionsOrTenant : optionsOrTenant?.tenant_id || null;
  const runner = tenant_id
    ? (cb) => withTenantContext(tenant_id, cb)
    : (cb) => withSystemContext(cb);
  return runner(async (client) => {
    const res = await client.query(
      'SELECT job_id, provider, provider_job_id, execution_route, provider_details_private_json FROM jobs WHERE job_id = $1',
      [jobId]
    );
    if (res.rowCount === 0) return null;
    return res.rows[0].provider_details_private_json || {};
  });
}

export async function listJobs(tenantId, limit = 50) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  return withTenantContext(tenantId, async (client) => {
    const res = await client.query(
      `SELECT * FROM jobs
       WHERE tenant_id = $1
       ORDER BY created_at DESC, job_id DESC
       LIMIT $2`,
      [tenantId, safeLimit]
    );
    return res.rows.map(formatJobRow);
  });
}

/**
 * Claims the next runnable job using `FOR UPDATE SKIP LOCKED`, increments `fencing_token`,
 * and persists lease ownership before releasing the transaction.
 *
 * If an expired lease is found on a job whose `submission_state = 'submitting'` and
 * `provider_job_id IS NULL`, the previous worker crashed after initiating submission
 * but before persisting `provider_job_id`. Rather than blindly resubmitting or releasing
 * credits, this transitions the job to `status = 'reconciling_submission'` and
 * `submission_state = 'submission_unknown'`.
 */
export async function claimNextRunnableJob({ workerId, leaseDurationMs = 30000 }) {
  if (!workerId) {
    throw new Error('workerId is required to claim a job');
  }
  const safeLeaseMs = Math.max(25, Number(leaseDurationMs) || 30000);

  return withTransaction(async (client) => {
    await assumeSystemRole(client);
    const candidateRes = await client.query(
      `SELECT j.*
       FROM jobs j
       JOIN tenants t ON t.tenant_id = j.tenant_id
       WHERE t.status = 'active'
         AND (
           (j.status = 'queued' AND j.next_run_at <= NOW())
           OR
           (j.status = 'running' AND (j.lease_expires_at IS NULL OR j.lease_expires_at <= NOW()))
         )
       ORDER BY j.next_run_at ASC, j.created_at ASC
       LIMIT 1
       FOR UPDATE OF j SKIP LOCKED`
    );

    if (candidateRes.rowCount === 0) {
      return null;
    }

    const row = candidateRes.rows[0];

    // Recovery guard: if a previous worker crashed while `submission_state = 'submitting'`
    // and before persisting `provider_job_id`, do NOT blindly resubmit.
    if (row.submission_state === 'submitting' && !row.provider_job_id) {
      const nextEventVersion = Number(row.last_event_version || 0) + 1;
      const newFencingToken = Number(row.fencing_token || 0) + 1;
      const reason =
        'Worker lease expired after provider submission began but before provider_job_id was persisted; marked submission_unknown for reconciliation without resubmission.';

      const reconciledRes = await client.query(
        `UPDATE jobs
         SET status = 'reconciling_submission',
             submission_state = 'submission_unknown',
             lease_owner = NULL,
             lease_expires_at = NULL,
             fencing_token = $2,
             last_event_version = $3,
             error = $4,
             updated_at = NOW()
         WHERE job_id = $1
         RETURNING *`,
        [row.job_id, newFencingToken, nextEventVersion, reason]
      );

      await client.query(
        `INSERT INTO job_events (
           event_id, job_id, tenant_id, event_version, type, status, progress, provider, provider_job_id, data_json
         ) VALUES ($1, $2, $3, $4, 'generation.reconciliation_required', 'reconciling_submission', $5, $6, NULL, $7::jsonb)`,
        [
          `evt_${crypto.randomBytes(8).toString('hex')}`,
          row.job_id,
          row.tenant_id,
          nextEventVersion,
          Number(row.progress || 0),
          row.provider,
          JSON.stringify({
            reason,
            submission_attempt_id: row.submission_attempt_id,
          }),
        ]
      );

      return {
        job: formatJobRow(reconciledRes.rows[0]),
        reconciliationRequired: true,
      };
    }

    const newFencingToken = Number(row.fencing_token || 0) + 1;
    const claimedRes = await client.query(
      `UPDATE jobs
       SET status = 'running',
           lease_owner = $2,
           lease_expires_at = NOW() + ($3 * INTERVAL '1 millisecond'),
           fencing_token = $4,
           updated_at = NOW()
       WHERE job_id = $1
       RETURNING *`,
      [row.job_id, workerId, safeLeaseMs, newFencingToken]
    );

    return {
      job: formatJobRow(claimedRes.rows[0]),
      reconciliationRequired: false,
    };
  });
}

function createStaleFencingError(jobId, workerId, fencingToken) {
  const err = new Error(
    `Stale worker lease or fencing token for job ${jobId} (worker=${workerId}, token=${fencingToken})`
  );
  err.code = 'STALE_WORKER_FENCING_TOKEN';
  err.status = 409;
  err.statusCode = 409;
  return err;
}

export async function heartbeatJobLease({
  jobId,
  workerId,
  fencingToken,
  leaseDurationMs = 30000,
}) {
  const safeLeaseMs = Math.max(500, Number(leaseDurationMs) || 30000);
  return withSystemContext(async (client) => {
    const res = await client.query(
      `UPDATE jobs
       SET lease_expires_at = NOW() + ($4 * INTERVAL '1 millisecond'),
           updated_at = NOW()
       WHERE job_id = $1
         AND lease_owner = $2
         AND fencing_token = $3
         AND status = 'running'
       RETURNING *`,
      [jobId, workerId, fencingToken, safeLeaseMs]
    );
    if (res.rowCount === 0) {
      throw createStaleFencingError(jobId, workerId, fencingToken);
    }
    return formatJobRow(res.rows[0]);
  });
}

/**
 * Persists a unique `submission_attempt_id` and transitions `submission_state` to `'submitting'`
 * BEFORE the worker contacts the external provider over the network.
 */
export async function beginProviderSubmissionAttempt({ jobId, workerId, fencingToken }) {
  return withTransaction(async (client) => {
    const jobRes = await client.query(
      `SELECT * FROM jobs WHERE job_id = $1 FOR UPDATE`,
      [jobId]
    );
    if (jobRes.rowCount === 0) {
      throw new Error(`Job not found: ${jobId}`);
    }
    const row = jobRes.rows[0];
    if (
      row.status !== 'running' ||
      row.lease_owner !== workerId ||
      Number(row.fencing_token) !== Number(fencingToken)
    ) {
      throw createStaleFencingError(jobId, workerId, fencingToken);
    }

    if (row.provider_job_id || row.submission_state === 'submitted') {
      return formatJobRow(row);
    }

    if (row.submission_state !== 'not_submitted') {
      const err = new Error(
        `Cannot begin submission for job ${jobId} in submission_state=${row.submission_state}`
      );
      err.code = 'INVALID_SUBMISSION_STATE';
      err.statusCode = 409;
      throw err;
    }

    const attemptId = `sub_${crypto.randomBytes(10).toString('hex')}`;
    const nextEventVersion = Number(row.last_event_version || 0) + 1;
    const nextAttempts = Number(row.submission_attempts || 0) + 1;

    const updatedRes = await client.query(
      `UPDATE jobs
       SET submission_state = 'submitting',
           submission_attempt_id = $2,
           submission_started_at = NOW(),
           submission_attempts = $3,
           progress = GREATEST(progress, 0.05),
           last_event_version = $4,
           updated_at = NOW()
       WHERE job_id = $1
       RETURNING *`,
      [jobId, attemptId, nextAttempts, nextEventVersion]
    );

    await client.query(
      `INSERT INTO job_events (
         event_id, job_id, tenant_id, event_version, type, status, progress, provider, provider_job_id, data_json
       ) VALUES ($1, $2, $3, $4, 'generation.started', 'running', 0.05, $5, NULL, $6::jsonb)`,
      [
        `evt_${crypto.randomBytes(8).toString('hex')}`,
        row.job_id,
        row.tenant_id,
        nextEventVersion,
        row.provider,
        JSON.stringify({
          stage: 'submitting_to_provider',
          submission_attempt_id: attemptId,
          attempt: nextAttempts,
        }),
      ]
    );

    return formatJobRow(updatedRes.rows[0]);
  });
}

/**
 * Immediately persists `provider_job_id` and transitions `submission_state = 'submitted'`
 * as soon as the provider returns a task ID.
 */
export async function recordProviderTaskId({
  jobId,
  workerId,
  fencingToken,
  providerJobId,
  providerDetails = null,
}) {
  if (!providerJobId) {
    throw new Error('providerJobId is required');
  }
  return withTransaction(async (client) => {
    const jobRes = await client.query(
      `SELECT * FROM jobs WHERE job_id = $1 FOR UPDATE`,
      [jobId]
    );
    if (jobRes.rowCount === 0) {
      throw new Error(`Job not found: ${jobId}`);
    }
    const row = jobRes.rows[0];
    if (
      row.status !== 'running' ||
      row.lease_owner !== workerId ||
      Number(row.fencing_token) !== Number(fencingToken)
    ) {
      throw createStaleFencingError(jobId, workerId, fencingToken);
    }

    const nextEventVersion = Number(row.last_event_version || 0) + 1;
    const nextProgress = Math.max(Number(row.progress || 0), 0.15);
    const mergedDetails = redactProviderDetails({
      ...(row.provider_details_private_json || {}),
      ...(providerDetails ? { submit: providerDetails } : {}),
    });

    const updatedRes = await client.query(
      `UPDATE jobs
       SET provider_job_id = $2,
           submission_state = 'submitted',
           progress = $3,
           last_event_version = $4,
           provider_details_private_json = $5::jsonb,
           updated_at = NOW()
       WHERE job_id = $1
       RETURNING *`,
      [jobId, String(providerJobId), nextProgress, nextEventVersion, JSON.stringify(mergedDetails)]
    );

    await client.query(
      `INSERT INTO job_events (
         event_id, job_id, tenant_id, event_version, type, status, progress, provider, provider_job_id, data_json
       ) VALUES ($1, $2, $3, $4, 'generation.progress', 'running', $5, $6, $7, $8::jsonb)`,
      [
        `evt_${crypto.randomBytes(8).toString('hex')}`,
        row.job_id,
        row.tenant_id,
        nextEventVersion,
        nextProgress,
        row.provider,
        String(providerJobId),
        JSON.stringify({ stage: 'queued_at_provider' }),
      ]
    );

    return formatJobRow(updatedRes.rows[0]);
  });
}

/**
 * Transitions a job with an ambiguous provider submission outcome into
 * `status = 'reconciling_submission'` and `submission_state = 'submission_unknown'`
 * without releasing the credit reservation or resubmitting.
 */
export async function markSubmissionAmbiguous({
  jobId,
  workerId,
  fencingToken,
  reason,
}) {
  return withTransaction(async (client) => {
    const jobRes = await client.query(
      `SELECT * FROM jobs WHERE job_id = $1 FOR UPDATE`,
      [jobId]
    );
    if (jobRes.rowCount === 0) {
      throw new Error(`Job not found: ${jobId}`);
    }
    const row = jobRes.rows[0];
    if (
      row.status !== 'running' ||
      row.lease_owner !== workerId ||
      Number(row.fencing_token) !== Number(fencingToken)
    ) {
      throw createStaleFencingError(jobId, workerId, fencingToken);
    }

    const nextEventVersion = Number(row.last_event_version || 0) + 1;
    const updatedRes = await client.query(
      `UPDATE jobs
       SET status = 'reconciling_submission',
           submission_state = 'submission_unknown',
           lease_owner = NULL,
           lease_expires_at = NULL,
           last_event_version = $2,
           error = $3,
           updated_at = NOW()
       WHERE job_id = $1
       RETURNING *`,
      [jobId, nextEventVersion, reason || 'Ambiguous provider submission outcome']
    );

    await client.query(
      `INSERT INTO job_events (
         event_id, job_id, tenant_id, event_version, type, status, progress, provider, provider_job_id, data_json
       ) VALUES ($1, $2, $3, $4, 'generation.reconciliation_required', 'reconciling_submission', $5, $6, $7, $8::jsonb)`,
      [
        `evt_${crypto.randomBytes(8).toString('hex')}`,
        row.job_id,
        row.tenant_id,
        nextEventVersion,
        Number(row.progress || 0),
        row.provider,
        row.provider_job_id,
        JSON.stringify({
          reason: reason || 'Ambiguous provider submission outcome',
          submission_attempt_id: row.submission_attempt_id,
        }),
      ]
    );

    return formatJobRow(updatedRes.rows[0]);
  });
}

/**
 * Schedules a pre-submission retry (when provider was definitely not reached, e.g., ECONNREFUSED/429)
 * or schedules the next status-poll tick for an already-submitted `provider_job_id`.
 */
export async function scheduleNextWorkerAttempt({
  jobId,
  workerId,
  fencingToken,
  delayMs = 500,
  mode = 'poll', // 'submission_retry' | 'poll'
  progress = null,
  stage = null,
  error = null,
}) {
  const safeDelayMs = Math.max(10, Number(delayMs) || 500);
  return withTransaction(async (client) => {
    const jobRes = await client.query(
      `SELECT * FROM jobs WHERE job_id = $1 FOR UPDATE`,
      [jobId]
    );
    if (jobRes.rowCount === 0) {
      throw new Error(`Job not found: ${jobId}`);
    }
    const row = jobRes.rows[0];
    if (
      row.status !== 'running' ||
      row.lease_owner !== workerId ||
      Number(row.fencing_token) !== Number(fencingToken)
    ) {
      throw createStaleFencingError(jobId, workerId, fencingToken);
    }

    if (mode === 'submission_retry') {
      const updatedRes = await client.query(
        `UPDATE jobs
         SET status = 'queued',
             submission_state = 'not_submitted',
             submission_attempt_id = NULL,
             submission_started_at = NULL,
             lease_owner = NULL,
             lease_expires_at = NULL,
             next_run_at = NOW() + ($2 * INTERVAL '1 millisecond'),
             error = $3,
             updated_at = NOW()
         WHERE job_id = $1
         RETURNING *`,
        [jobId, safeDelayMs, error]
      );
      return formatJobRow(updatedRes.rows[0]);
    }

    // mode === 'poll'
    const nextPollAttempts = Number(row.poll_attempts || 0) + 1;
    const nextProgress =
      typeof progress === 'number'
        ? Math.min(0.95, Math.max(Number(row.progress || 0), progress))
        : Math.min(0.9, Math.max(Number(row.progress || 0.15), 0.15 + nextPollAttempts * 0.05));
    const nextEventVersion = Number(row.last_event_version || 0) + 1;

    const updatedRes = await client.query(
      `UPDATE jobs
       SET status = 'queued',
           poll_attempts = $2,
           progress = $3,
           lease_owner = NULL,
           lease_expires_at = NULL,
           next_run_at = NOW() + ($4 * INTERVAL '1 millisecond'),
           last_event_version = $5,
           error = $6,
           updated_at = NOW()
       WHERE job_id = $1
       RETURNING *`,
      [jobId, nextPollAttempts, nextProgress, safeDelayMs, nextEventVersion, error]
    );

    await client.query(
      `INSERT INTO job_events (
         event_id, job_id, tenant_id, event_version, type, status, progress, provider, provider_job_id, data_json
       ) VALUES ($1, $2, $3, $4, 'generation.progress', 'running', $5, $6, $7, $8::jsonb)`,
      [
        `evt_${crypto.randomBytes(8).toString('hex')}`,
        row.job_id,
        row.tenant_id,
        nextEventVersion,
        nextProgress,
        row.provider,
        row.provider_job_id,
        JSON.stringify({
          stage: stage || 'generating',
          poll_attempt: nextPollAttempts,
        }),
      ]
    );

    return formatJobRow(updatedRes.rows[0]);
  });
}

/**
 * Atomically transitions a job to `succeeded`, registers the external media reference,
 * transitions `credit_reservations` (`reserved -> settled`), updates `tenants` balances,
 * appends the immutable `settle` entry to `credit_ledger`, and persists `generation.succeeded`
 * in `job_events`.
 *
 * Lock order:
 *   1. tenants (FOR UPDATE)
 *   2. jobs (FOR UPDATE)
 *   3. credit_reservations (FOR UPDATE)
 */
export async function completeJobSuccess({
  jobId,
  tenantId = null,
  workerId = null,
  fencingToken = null,
  providerJobId = null,
  sourceUrl,
  outputs = null,
  userBilledCredits = null,
  providerReportedCost = null,
  providerCostUnit = null,
  providerDetails = null,
}) {
  const validatedMedia = validateExternalMediaUrl(sourceUrl);
  const validatedOutputUrls = Array.isArray(outputs) && outputs.length > 0
    ? outputs.map((u) => validateExternalMediaUrl(u).url)
    : [validatedMedia.url];

  return withTransaction(async (client) => {
    await assumeSystemRole(client);
    // Resolve tenantId if not passed
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const lookupRes = await client.query(
        'SELECT tenant_id FROM jobs WHERE job_id = $1',
        [jobId]
      );
      if (lookupRes.rowCount === 0) {
        throw new Error(`Job not found: ${jobId}`);
      }
      resolvedTenantId = lookupRes.rows[0].tenant_id;
    }

    // Lock #1: tenants
    const tenantRes = await client.query(
      `SELECT tenant_id, credits_balance, credits_reserved
       FROM tenants
       WHERE tenant_id = $1
       FOR UPDATE`,
      [resolvedTenantId]
    );
    if (tenantRes.rowCount === 0) {
      throw new Error(`Tenant not found: ${resolvedTenantId}`);
    }
    const tenantRow = tenantRes.rows[0];

    // Lock #2: jobs
    const jobRes = await client.query(
      `SELECT * FROM jobs
       WHERE job_id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [jobId, resolvedTenantId]
    );
    if (jobRes.rowCount === 0) {
      throw new Error(`Job not found: ${jobId}`);
    }
    const jobRow = jobRes.rows[0];

    // Lock #3: credit_reservations
    const resvRes = await client.query(
      `SELECT * FROM credit_reservations
       WHERE job_id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [jobId, resolvedTenantId]
    );
    if (resvRes.rowCount === 0) {
      throw new Error(`Credit reservation not found for job: ${jobId}`);
    }
    const resvRow = resvRes.rows[0];

    // Duplicate completion event guard: if already succeeded, return idempotently without settling twice
    if (jobRow.status === 'succeeded' && resvRow.status === 'settled') {
      if (fencingToken !== null && Number(jobRow.fencing_token) !== Number(fencingToken)) {
        throw createStaleFencingError(jobId, workerId, fencingToken);
      }
      return {
        job: formatJobRow(jobRow),
        alreadyTerminal: true,
      };
    }

    // Conflicting terminal state guard: a failed/released job can never be settled
    if (jobRow.status === 'failed' || resvRow.status === 'released') {
      const err = new Error(
        `Conflicting terminal transition: job ${jobId} is already in state status=${jobRow.status}, reservation=${resvRow.status}`
      );
      err.code = 'CONFLICTING_TERMINAL_STATE';
      err.status = 409;
      err.statusCode = 409;
      throw err;
    }

    // Verify worker fencing token if called by a worker
    if (fencingToken !== null) {
      if (
        jobRow.status !== 'running' ||
        jobRow.lease_owner !== workerId ||
        Number(jobRow.fencing_token) !== Number(fencingToken)
      ) {
        throw createStaleFencingError(jobId, workerId, fencingToken);
      }
    }

    const reservedAmount = parseSafeCreditBigInt(resvRow.amount, 'reservation.amount');
    const currentBalance = parseSafeCreditBigInt(tenantRow.credits_balance, 'credits_balance');
    const currentReserved = parseSafeCreditBigInt(tenantRow.credits_reserved, 'credits_reserved');

    // Timecapsule user-billed credits are strictly separate from provider-reported cost.
    // Default user charge is the Timecapsule reserved amount; if an explicit Timecapsule
    // userBilledCredits charge is provided, cap it at reservedAmount so it never overdrafts.
    let settledUserCredits = reservedAmount;
    if (
      userBilledCredits !== null &&
      userBilledCredits !== undefined &&
      Number.isFinite(Number(userBilledCredits))
    ) {
      const requestedUserCredits = Math.max(0, Math.round(Number(userBilledCredits)));
      settledUserCredits = Math.min(reservedAmount, requestedUserCredits);
    }

    let normalizedProviderCost = null;
    if (
      providerReportedCost !== null &&
      providerReportedCost !== undefined &&
      Number.isFinite(Number(providerReportedCost)) &&
      Number(providerReportedCost) >= 0
    ) {
      normalizedProviderCost = Number(providerReportedCost);
    }
    const normalizedProviderCostUnit = providerCostUnit ? String(providerCostUnit).trim() : null;

    const newReserved = currentReserved - reservedAmount;
    const newBalance = currentBalance - settledUserCredits;

    // 1. Transition reservation: reserved -> settled
    await client.query(
      `UPDATE credit_reservations
       SET status = 'settled',
           settled_amount = $2,
           settled_at = NOW(),
           updated_at = NOW()
       WHERE job_id = $1 AND status = 'reserved'`,
      [jobId, settledUserCredits]
    );

    // 2. Update tenant balances
    await client.query(
      `UPDATE tenants
       SET credits_reserved = $2,
           credits_balance = $3,
           updated_at = NOW()
       WHERE tenant_id = $1`,
      [resolvedTenantId, newReserved, newBalance]
    );

    // 3. Append immutable ledger entry
    const ledgerEntryId = `led_${crypto.randomBytes(8).toString('hex')}`;
    await client.query(
      `INSERT INTO credit_ledger (
         entry_id, tenant_id, job_id, entry_type, amount, balance_after, reserved_after, metadata_json
       ) VALUES ($1, $2, $3, 'settle', $4, $5, $6, $7::jsonb)`,
      [
        ledgerEntryId,
        resolvedTenantId,
        jobId,
        settledUserCredits,
        newBalance,
        newReserved,
        JSON.stringify({
          reserved_amount: reservedAmount,
          user_billed_credits: settledUserCredits,
          released_unused_credits: reservedAmount - settledUserCredits,
          provider_reported_cost: normalizedProviderCost,
          provider_cost_unit: normalizedProviderCostUnit,
          pricing_policy_version: jobRow.pricing_policy_version || 'tc-pricing-v1',
          capped_to_reservation:
            userBilledCredits !== null && Number(userBilledCredits) > reservedAmount,
        }),
      ]
    );

    // 4. Register external media reference(s) in assets table
    const inferredMime =
      ['video', 'i2v', 'v2v', 'lipsync'].includes(jobRow.modality) ? 'video/mp4' : 'image/png';
    const outputPayloads = [];

    for (const outUrl of validatedOutputUrls) {
      const assetId = `ast_${crypto.randomBytes(8).toString('hex')}`;
      const assetUrl = `/api/v1/assets/${assetId}`;
      const isInlineData = outUrl.startsWith('data:');
      const storageType = isInlineData ? 'inline_data_url' : 'external_url_reference';

      await client.query(
        `INSERT INTO assets (
           asset_id, tenant_id, job_id, modality, content_type, storage_type, provider, request_id, durable, private, source_url, status, url
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, TRUE, $9, 'reference_registered', $10)`,
        [
          assetId,
          resolvedTenantId,
          jobId,
          jobRow.modality,
          inferredMime,
          storageType,
          jobRow.provider,
          jobRow.provider_job_id || null,
          outUrl,
          assetUrl,
        ]
      );

      outputPayloads.push({
        asset_id: assetId,
        url: outUrl,
        delivery_url: assetUrl,
        content_type: inferredMime,
        storage_type: storageType,
        provider: jobRow.provider,
        durable: false,
      });
    }

    const outputPayload = outputPayloads[0];
    const nextEventVersion = Number(jobRow.last_event_version || 0) + 1;
    const finalProviderJobId = providerJobId || jobRow.provider_job_id;
    const mergedDetails = redactProviderDetails({
      ...(jobRow.provider_details_private_json || {}),
      ...(providerDetails ? { terminal: providerDetails } : {}),
    });

    // 5. Transition job to terminal succeeded state
    const updatedJobRes = await client.query(
      `UPDATE jobs
       SET status = 'succeeded',
           submission_state = 'submitted',
           provider_job_id = COALESCE($2, provider_job_id),
           progress = 1,
           user_billed_credits = $3,
           actual_cost = $3,
           provider_reported_cost = $4,
           provider_cost_unit = $5,
           output_json = $6::jsonb,
           outputs_json = $7::jsonb,
           provider_details_private_json = $8::jsonb,
           lease_owner = NULL,
           lease_expires_at = NULL,
           last_event_version = $9,
           error = NULL,
           updated_at = NOW(),
           completed_at = NOW()
       WHERE job_id = $1
       RETURNING *`,
      [
        jobId,
        finalProviderJobId ? String(finalProviderJobId) : null,
        settledUserCredits,
        normalizedProviderCost,
        normalizedProviderCostUnit,
        JSON.stringify(outputPayload),
        JSON.stringify(outputPayloads),
        JSON.stringify(mergedDetails),
        nextEventVersion,
      ]
    );

    // 6. Persist terminal generation.succeeded event
    await client.query(
      `INSERT INTO job_events (
         event_id, job_id, tenant_id, event_version, type, status, progress, provider, provider_job_id, data_json
       ) VALUES ($1, $2, $3, $4, 'generation.succeeded', 'succeeded', 1, $5, $6, $7::jsonb)`,
      [
        `evt_${crypto.randomBytes(8).toString('hex')}`,
        jobId,
        resolvedTenantId,
        nextEventVersion,
        jobRow.provider,
        finalProviderJobId ? String(finalProviderJobId) : null,
        JSON.stringify({
          url: outputPayload.url,
          urls: outputPayloads.map((o) => o.url),
          delivery_url: outputPayload.delivery_url,
          asset_id: outputPayload.asset_id,
          storage_type: outputPayload.storage_type,
          durable: false,
          credits_settled: settledUserCredits,
          user_billed_credits: settledUserCredits,
          provider_reported_cost: normalizedProviderCost,
          provider_cost_unit: normalizedProviderCostUnit,
        }),
      ]
    );

    return {
      job: formatJobRow(updatedJobRes.rows[0]),
      alreadyTerminal: false,
    };
  });
}

/**
 * Atomically transitions a job to `failed`, transitions `credit_reservations` (`reserved -> released`),
 * restores `credits_reserved` on `tenants`, appends the immutable `release` entry to `credit_ledger`,
 * and persists `generation.failed` in `job_events`.
 *
 * Lock order:
 *   1. tenants (FOR UPDATE)
 *   2. jobs (FOR UPDATE)
 *   3. credit_reservations (FOR UPDATE)
 */
export async function completeJobFailure({
  jobId,
  tenantId = null,
  workerId = null,
  fencingToken = null,
  errorMessage = 'Generation failed',
  providerDetails = null,
}) {
  return withTransaction(async (client) => {
    await assumeSystemRole(client);
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const lookupRes = await client.query(
        'SELECT tenant_id FROM jobs WHERE job_id = $1',
        [jobId]
      );
      if (lookupRes.rowCount === 0) {
        throw new Error(`Job not found: ${jobId}`);
      }
      resolvedTenantId = lookupRes.rows[0].tenant_id;
    }

    // Lock #1: tenants
    const tenantRes = await client.query(
      `SELECT tenant_id, credits_balance, credits_reserved
       FROM tenants
       WHERE tenant_id = $1
       FOR UPDATE`,
      [resolvedTenantId]
    );
    if (tenantRes.rowCount === 0) {
      throw new Error(`Tenant not found: ${resolvedTenantId}`);
    }
    const tenantRow = tenantRes.rows[0];

    // Lock #2: jobs
    const jobRes = await client.query(
      `SELECT * FROM jobs
       WHERE job_id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [jobId, resolvedTenantId]
    );
    if (jobRes.rowCount === 0) {
      throw new Error(`Job not found: ${jobId}`);
    }
    const jobRow = jobRes.rows[0];

    // Lock #3: credit_reservations
    const resvRes = await client.query(
      `SELECT * FROM credit_reservations
       WHERE job_id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [jobId, resolvedTenantId]
    );
    if (resvRes.rowCount === 0) {
      throw new Error(`Credit reservation not found for job: ${jobId}`);
    }
    const resvRow = resvRes.rows[0];

    // Duplicate failure event guard: if already failed/released, return idempotently without releasing twice
    if (jobRow.status === 'failed' && resvRow.status === 'released') {
      if (fencingToken !== null && Number(jobRow.fencing_token) !== Number(fencingToken)) {
        throw createStaleFencingError(jobId, workerId, fencingToken);
      }
      return {
        job: formatJobRow(jobRow),
        alreadyTerminal: true,
      };
    }

    // Conflicting terminal state guard: a succeeded/settled job can never be released
    if (jobRow.status === 'succeeded' || resvRow.status === 'settled') {
      const err = new Error(
        `Conflicting terminal transition: job ${jobId} is already in state status=${jobRow.status}, reservation=${resvRow.status}`
      );
      err.code = 'CONFLICTING_TERMINAL_STATE';
      err.status = 409;
      err.statusCode = 409;
      throw err;
    }

    if (fencingToken !== null) {
      if (
        jobRow.status !== 'running' ||
        jobRow.lease_owner !== workerId ||
        Number(jobRow.fencing_token) !== Number(fencingToken)
      ) {
        throw createStaleFencingError(jobId, workerId, fencingToken);
      }
    }

    const reservedAmount = parseSafeCreditBigInt(resvRow.amount, 'reservation.amount');
    const currentBalance = parseSafeCreditBigInt(tenantRow.credits_balance, 'credits_balance');
    const currentReserved = parseSafeCreditBigInt(tenantRow.credits_reserved, 'credits_reserved');
    const newReserved = currentReserved - reservedAmount;

    // 1. Transition reservation: reserved -> released
    await client.query(
      `UPDATE credit_reservations
       SET status = 'released',
           released_at = NOW(),
           updated_at = NOW()
       WHERE job_id = $1 AND status = 'reserved'`,
      [jobId]
    );

    // 2. Update tenant reserved credits
    await client.query(
      `UPDATE tenants
       SET credits_reserved = $2,
           updated_at = NOW()
       WHERE tenant_id = $1`,
      [resolvedTenantId, newReserved]
    );

    // 3. Append immutable release ledger entry
    const ledgerEntryId = `led_${crypto.randomBytes(8).toString('hex')}`;
    await client.query(
      `INSERT INTO credit_ledger (
         entry_id, tenant_id, job_id, entry_type, amount, balance_after, reserved_after, metadata_json
       ) VALUES ($1, $2, $3, 'release', $4, $5, $6, $7::jsonb)`,
      [
        ledgerEntryId,
        resolvedTenantId,
        jobId,
        reservedAmount,
        currentBalance,
        newReserved,
        JSON.stringify({ reason: errorMessage }),
      ]
    );

    const nextEventVersion = Number(jobRow.last_event_version || 0) + 1;
    const mergedDetails = redactProviderDetails({
      ...(jobRow.provider_details_private_json || {}),
      ...(providerDetails ? { failure: providerDetails } : {}),
    });

    // 4. Transition job to terminal failed state
    const updatedJobRes = await client.query(
      `UPDATE jobs
       SET status = 'failed',
           lease_owner = NULL,
           lease_expires_at = NULL,
           last_event_version = $2,
           error = $3,
           provider_details_private_json = $4::jsonb,
           updated_at = NOW(),
           completed_at = NOW()
       WHERE job_id = $1
       RETURNING *`,
      [jobId, nextEventVersion, errorMessage, JSON.stringify(mergedDetails)]
    );

    // 5. Persist terminal generation.failed event
    await client.query(
      `INSERT INTO job_events (
         event_id, job_id, tenant_id, event_version, type, status, progress, provider, provider_job_id, data_json
       ) VALUES ($1, $2, $3, $4, 'generation.failed', 'failed', $5, $6, $7, $8::jsonb)`,
      [
        `evt_${crypto.randomBytes(8).toString('hex')}`,
        jobId,
        resolvedTenantId,
        nextEventVersion,
        Number(jobRow.progress || 0),
        jobRow.provider,
        jobRow.provider_job_id,
        JSON.stringify({ error: errorMessage }),
      ]
    );

    return {
      job: formatJobRow(updatedJobRes.rows[0]),
      alreadyTerminal: false,
    };
  });
}

/**
 * Operator reconciliation helper for jobs in `reconciling_submission` (`submission_unknown`):
 * - action === 'attach_provider_task': attaches the discovered `providerJobId` and re-queues
 *   the job for status polling (`submission_state = 'submitted'`).
 * - action === 'confirm_not_submitted_refund': confirms the provider never created a task,
 *   transitions the job to `failed`, and releases the credit reservation.
 */
export async function reconcileAmbiguousJob({
  jobId,
  action, // 'attach_provider_task' | 'confirm_not_submitted_refund'
  providerJobId = null,
  reason = 'Operator manual reconciliation',
}) {
  if (action === 'confirm_not_submitted_refund') {
    return completeJobFailure({
      jobId,
      errorMessage: `Reconciled as not submitted: ${reason}`,
    });
  }

  if (action === 'attach_provider_task') {
    if (!providerJobId) {
      throw new Error('providerJobId is required for attach_provider_task reconciliation');
    }
    return withTransaction(async (client) => {
      const jobRes = await client.query(
        'SELECT * FROM jobs WHERE job_id = $1 FOR UPDATE',
        [jobId]
      );
      if (jobRes.rowCount === 0) {
        throw new Error(`Job not found: ${jobId}`);
      }
      const row = jobRes.rows[0];
      if (row.status !== 'reconciling_submission') {
        throw new Error(
          `Job ${jobId} is in status=${row.status}; expected reconciling_submission`
        );
      }

      const nextEventVersion = Number(row.last_event_version || 0) + 1;
      const updatedRes = await client.query(
        `UPDATE jobs
         SET status = 'queued',
             submission_state = 'submitted',
             provider_job_id = $2,
             next_run_at = NOW(),
             last_event_version = $3,
             error = NULL,
             updated_at = NOW()
         WHERE job_id = $1
         RETURNING *`,
        [jobId, String(providerJobId), nextEventVersion]
      );

      await client.query(
        `INSERT INTO job_events (
           event_id, job_id, tenant_id, event_version, type, status, progress, provider, provider_job_id, data_json
         ) VALUES ($1, $2, $3, $4, 'generation.progress', 'running', $5, $6, $7, $8::jsonb)`,
        [
          `evt_${crypto.randomBytes(8).toString('hex')}`,
          row.job_id,
          row.tenant_id,
          nextEventVersion,
          Math.max(Number(row.progress || 0), 0.15),
          row.provider,
          String(providerJobId),
          JSON.stringify({ stage: 'reconciled_provider_task', reason }),
        ]
      );

      return formatJobRow(updatedRes.rows[0]);
    });
  }

  throw new Error(`Unsupported reconciliation action: ${action}`);
}

/**
 * Fetches ordered persisted events for a job.
 * Supports resuming from `afterEventVersion` or resolving `lastEventId` (which can be either
 * an `event_id` string like `evt_...` or a numeric `event_version`).
 */
export async function getJobEventsAfter(
  jobId,
  { afterEventVersion = 0, lastEventId = null, tenant_id = null } = {}
) {
  let startVersion = Number(afterEventVersion) || 0;
  const runner = tenant_id
    ? (cb) => withTenantContext(tenant_id, cb)
    : (cb) => withSystemContext(cb);

  return runner(async (client) => {
    if (lastEventId) {
      const trimmed = String(lastEventId).trim();
      if (/^\d+$/.test(trimmed)) {
        startVersion = Math.max(startVersion, Number(trimmed));
      } else {
        const lookupRes = await client.query(
          `SELECT event_version FROM job_events WHERE job_id = $1 AND event_id = $2`,
          [jobId, trimmed]
        );
        if (lookupRes.rowCount > 0) {
          startVersion = Math.max(startVersion, Number(lookupRes.rows[0].event_version));
        }
      }
    }

    const res = await client.query(
      `SELECT *
       FROM job_events
       WHERE job_id = $1 AND event_version > $2
       ORDER BY event_version ASC`,
      [jobId, startVersion]
    );
    return res.rows.map(formatEventRow);
  });
}

export async function registerAsset(assetRecord) {
  if (!assetRecord?.tenant_id) {
    throw new Error('tenant_id is required to register an asset');
  }
  const assetId = assetRecord.asset_id || `ast_${crypto.randomBytes(8).toString('hex')}`;
  const assetUrl = `/api/v1/assets/${assetId}`;
  const isInline = String(assetRecord.source_url || '').startsWith('data:');
  const storageType =
    assetRecord.storage_type || (isInline ? 'inline_data_url' : 'external_url_reference');

  return withTenantContext(assetRecord.tenant_id, async (client) => {
    const res = await client.query(
      `INSERT INTO assets (
         asset_id, tenant_id, user_id, job_id, modality, content_type, storage_type, provider, request_id, thumbnail_url, metadata_json, durable, private, source_url, filename, status, url
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, TRUE, $12, $13, $14, $15)
       RETURNING *`,
      [
        assetId,
        assetRecord.tenant_id,
        assetRecord.user_id || null,
        assetRecord.job_id || null,
        assetRecord.modality || 'image',
        assetRecord.content_type || 'application/octet-stream',
        storageType,
        assetRecord.provider || null,
        assetRecord.request_id || null,
        assetRecord.thumbnail_url || null,
        JSON.stringify(assetRecord.metadata || {}),
        assetRecord.source_url,
        assetRecord.filename || null,
        assetRecord.status || 'reference_registered',
        assetUrl,
      ]
    );

    return formatAssetRow(res.rows[0]);
  });
}

export async function getAsset(assetId, optionsOrTenant = {}) {
  if (!assetId) return null;
  const tenant_id =
    typeof optionsOrTenant === 'string' ? optionsOrTenant : optionsOrTenant?.tenant_id || null;
  const includeDeleted =
    typeof optionsOrTenant === 'object' && Boolean(optionsOrTenant?.includeDeleted);
  const runner = tenant_id
    ? (cb) => withTenantContext(tenant_id, cb)
    : (cb) => withSystemContext(cb);

  return runner(async (client) => {
    const queryStr = includeDeleted
      ? 'SELECT * FROM assets WHERE asset_id = $1'
      : 'SELECT * FROM assets WHERE asset_id = $1 AND deleted_at IS NULL';
    const res = await client.query(queryStr, [assetId]);
    if (res.rowCount === 0) return null;
    return formatAssetRow(res.rows[0]);
  });
}

export async function listTenantUploads({ tenant_id, user_id = null, limit = 50, cursor = null } = {}) {
  if (!tenant_id) throw new Error('tenant_id is required to list uploads');
  const maxLimit = Math.min(Math.max(1, Number(limit) || 50), 100);
  return withTenantContext(tenant_id, async (client) => {
    const params = [tenant_id, maxLimit];
    let queryStr = `
      SELECT * FROM assets
      WHERE tenant_id = $1
        AND deleted_at IS NULL
        AND modality IN ('upload', 'image')
    `;
    if (user_id) {
      params.push(user_id);
      queryStr += ` AND (user_id = $${params.length} OR user_id IS NULL)`;
    }
    if (cursor) {
      params.push(cursor);
      queryStr += ` AND created_at < $${params.length}`;
    }
    queryStr += ` ORDER BY created_at DESC LIMIT $2`;

    const res = await client.query(queryStr, params);
    return res.rows.map(formatAssetRow);
  });
}

export async function softDeleteAsset({ tenant_id, asset_id }) {
  if (!tenant_id || !asset_id) throw new Error('tenant_id and asset_id are required');
  return withTenantContext(tenant_id, async (client) => {
    const res = await client.query(
      `UPDATE assets
       SET deleted_at = NOW()
       WHERE tenant_id = $1 AND asset_id = $2 AND deleted_at IS NULL
       RETURNING asset_id`,
      [tenant_id, asset_id]
    );
    return res.rowCount > 0;
  });
}
