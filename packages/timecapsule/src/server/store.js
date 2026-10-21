import { EventEmitter } from 'events';
import crypto from 'crypto';

const globalStoreKey = '__TIMECAPSULE_AUTHORITATIVE_STORE__';

function createInitialState(initialCredits = 5000) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(200);
  return {
    jobs: new Map(),
    simulationJobs: new Map(),
    idempotencyIndex: new Map(),
    tenants: new Map([
      [
        'org_preview_default',
        {
          tenant_id: 'org_preview_default',
          credits_balance: initialCredits,
          credits_reserved: 0,
          reservations: new Map(),
          ledger: [],
        },
      ],
      [
        'org_default',
        {
          tenant_id: 'org_default',
          credits_balance: initialCredits,
          credits_reserved: 0,
          reservations: new Map(),
          ledger: [],
        },
      ],
    ]),
    assets: new Map(),
    emitter,
  };
}

function getState() {
  if (!globalThis[globalStoreKey]) {
    globalThis[globalStoreKey] = createInitialState();
  }
  return globalThis[globalStoreKey];
}

export function resetStoreForTests(initialCredits = 5000) {
  globalThis[globalStoreKey] = createInitialState(initialCredits);
  return globalThis[globalStoreKey];
}

export function ensureTenant(tenantId = 'org_default', defaultCredits = 5000) {
  const state = getState();
  if (!state.tenants.has(tenantId)) {
    state.tenants.set(tenantId, {
      tenant_id: tenantId,
      credits_balance: defaultCredits,
      credits_reserved: 0,
      reservations: new Map(),
      ledger: [],
    });
  }
  return state.tenants.get(tenantId);
}

export function getTenantCredits(tenantId = 'org_default') {
  const tenant = ensureTenant(tenantId);
  return {
    tenant_id: tenant.tenant_id,
    available_credits: tenant.credits_balance - tenant.credits_reserved,
    total_credits: tenant.credits_balance,
    reserved_credits: tenant.credits_reserved,
  };
}

export function reserveCredits(tenantId, jobId, amount) {
  const tenant = ensureTenant(tenantId);
  const numericAmount = Math.max(0, Math.round(Number(amount) || 0));
  const available = tenant.credits_balance - tenant.credits_reserved;
  if (available < numericAmount) {
    const err = new Error(`Insufficient credits: required ${numericAmount}, available ${available}`);
    err.code = 'INSUFFICIENT_CREDITS';
    err.statusCode = 402;
    throw err;
  }
  tenant.credits_reserved += numericAmount;
  tenant.reservations.set(jobId, {
    job_id: jobId,
    amount: numericAmount,
    status: 'reserved',
    reserved_at: new Date().toISOString(),
  });
  tenant.ledger.push({
    entry_id: `led_${crypto.randomBytes(6).toString('hex')}`,
    job_id: jobId,
    type: 'reserve',
    amount: numericAmount,
    occurred_at: new Date().toISOString(),
  });
  return numericAmount;
}

export function settleCredits(tenantId, jobId, actualCost = null) {
  const tenant = ensureTenant(tenantId);
  const reservation = tenant.reservations.get(jobId);
  if (!reservation || reservation.status !== 'reserved') return 0;

  const cost =
    actualCost !== null && Number.isFinite(Number(actualCost))
      ? Math.max(0, Math.round(Number(actualCost)))
      : reservation.amount;

  tenant.credits_reserved = Math.max(0, tenant.credits_reserved - reservation.amount);
  tenant.credits_balance = Math.max(0, tenant.credits_balance - cost);
  reservation.status = 'settled';
  reservation.settled_amount = cost;
  reservation.settled_at = new Date().toISOString();

  tenant.ledger.push({
    entry_id: `led_${crypto.randomBytes(6).toString('hex')}`,
    job_id: jobId,
    type: 'settle',
    amount: cost,
    occurred_at: reservation.settled_at,
  });
  return cost;
}

export function releaseCredits(tenantId, jobId) {
  const tenant = ensureTenant(tenantId);
  const reservation = tenant.reservations.get(jobId);
  if (!reservation || reservation.status !== 'reserved') return 0;

  tenant.credits_reserved = Math.max(0, tenant.credits_reserved - reservation.amount);
  reservation.status = 'released';
  reservation.released_at = new Date().toISOString();

  tenant.ledger.push({
    entry_id: `led_${crypto.randomBytes(6).toString('hex')}`,
    job_id: jobId,
    type: 'release',
    amount: reservation.amount,
    occurred_at: reservation.released_at,
  });
  return reservation.amount;
}

export function getIdempotentJob(tenantId, idempotencyKey) {
  if (!idempotencyKey) return null;
  const state = getState();
  const compositeKey = `${tenantId}:${idempotencyKey}`;
  const jobId = state.idempotencyIndex.get(compositeKey);
  if (!jobId) return null;
  return state.jobs.get(jobId) || state.simulationJobs.get(jobId) || null;
}

export function createJobRecord({
  tenantId = 'org_default',
  userId = 'usr_default',
  projectId = 'prj_default',
  idempotencyKey = null,
  modality = 'image',
  model,
  inputs = {},
  workflow = {},
  delivery = {},
  provider = 'kie',
  creditsReserved = 0,
  estimatedCost = 0,
  simulationMode = false,
}) {
  const state = getState();
  if (idempotencyKey) {
    const existing = getIdempotentJob(tenantId, idempotencyKey);
    if (existing) return { job: existing, deduplicated: true };
  }

  const jobId = `${simulationMode ? 'sim_job' : 'job'}_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  const job = {
    job_id: jobId,
    tenant_id: tenantId,
    user_id: userId,
    project_id: projectId,
    idempotency_key: idempotencyKey,
    modality,
    model,
    inputs,
    workflow,
    delivery,
    status: 'queued',
    progress: 0,
    provider,
    provider_job_id: null,
    simulation: Boolean(simulationMode),
    billable: !simulationMode,
    credits_reserved: simulationMode ? 0 : creditsReserved,
    estimated_cost: simulationMode ? 0 : estimatedCost,
    actual_cost: null,
    events_url: `/api/v1/generations/${jobId}/events`,
    output: null,
    outputs: [],
    error: null,
    events: [],
    created_at: now,
    updated_at: now,
  };

  if (simulationMode) {
    state.simulationJobs.set(jobId, job);
  } else {
    state.jobs.set(jobId, job);
  }
  if (idempotencyKey) {
    state.idempotencyIndex.set(`${tenantId}:${idempotencyKey}`, jobId);
  }

  return { job, deduplicated: false };
}

export function getJob(jobId) {
  const state = getState();
  return state.jobs.get(jobId) || state.simulationJobs.get(jobId) || null;
}

export function updateJob(jobId, patch = {}) {
  const job = getJob(jobId);
  if (!job) return null;
  Object.assign(job, patch, { updated_at: new Date().toISOString() });
  return job;
}

export function listJobs(tenantId = 'org_default', limit = 50) {
  const state = getState();
  const items = [];
  for (const job of state.jobs.values()) {
    if (!tenantId || job.tenant_id === tenantId) {
      items.push(job);
    }
  }
  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return items.slice(0, limit);
}

export function emitJobEvent(jobId, { type, status, progress, providerJobId, data = {} }) {
  const state = getState();
  const job = state.jobs.get(jobId) || state.simulationJobs.get(jobId);
  if (!job) return null;

  if (status) job.status = status;
  if (typeof progress === 'number') job.progress = progress;
  if (providerJobId) job.provider_job_id = providerJobId;
  job.updated_at = new Date().toISOString();

  const envelope = {
    event_id: `evt_${crypto.randomBytes(8).toString('hex')}`,
    job_id: job.job_id,
    tenant_id: job.tenant_id,
    type,
    status: job.status,
    progress: job.progress,
    provider: job.provider,
    provider_job_id: job.provider_job_id,
    occurred_at: job.updated_at,
    data,
  };

  job.events.push(envelope);
  state.emitter.emit(`job:${jobId}`, envelope);
  return envelope;
}

export function getLatestJobSnapshotEvent(jobId) {
  const job = getJob(jobId);
  if (!job) return null;
  if (job.events.length > 0) {
    return job.events[job.events.length - 1];
  }
  return {
    event_id: `evt_snapshot_${job.job_id}`,
    job_id: job.job_id,
    tenant_id: job.tenant_id,
    type: 'generation.snapshot',
    status: job.status,
    progress: job.progress,
    provider: job.provider,
    provider_job_id: job.provider_job_id,
    occurred_at: job.updated_at,
    data: {
      output: job.output,
      error: job.error,
    },
  };
}

export function subscribeJobEvents(jobId, callback) {
  const state = getState();
  const channel = `job:${jobId}`;
  state.emitter.on(channel, callback);
  return () => {
    state.emitter.off(channel, callback);
  };
}

export function registerAsset(assetRecord) {
  const state = getState();
  const assetId = assetRecord.asset_id || `ast_${crypto.randomBytes(8).toString('hex')}`;
  const fullRecord = {
    ...assetRecord,
    asset_id: assetId,
    url: `/api/v1/assets/${assetId}`,
    created_at: new Date().toISOString(),
  };
  state.assets.set(assetId, fullRecord);
  return fullRecord;
}

export function getAsset(assetId) {
  return getState().assets.get(assetId) || null;
}
