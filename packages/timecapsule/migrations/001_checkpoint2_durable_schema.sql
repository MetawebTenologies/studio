-- Timecapsule Checkpoint 2: Durable Jobs, Credits, Reservations, Idempotency, Assets, and Events
-- Credit Semantics:
--   credits_balance  : Total unspent integer credit units owned by the tenant (includes held/reserved credits).
--   credits_reserved : Integer credit units currently held for active ('reserved') jobs.
--   available_credits: Derived as (credits_balance - credits_reserved). Must always be >= 0.

CREATE TABLE IF NOT EXISTS tenants (
  tenant_id TEXT PRIMARY KEY,
  credits_balance BIGINT NOT NULL DEFAULT 0,
  credits_reserved BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_tenants_balance_bounds
    CHECK (credits_balance >= 0 AND credits_balance <= 1000000000000),
  CONSTRAINT chk_tenants_reserved_bounds
    CHECK (credits_reserved >= 0 AND credits_reserved <= 1000000000000),
  CONSTRAINT chk_tenants_available_nonnegative
    CHECK (credits_balance >= credits_reserved)
);

-- The `jobs` table serves as both the authoritative job state record and the durable
-- worker dispatch queue (claimed via `FOR UPDATE SKIP LOCKED`), avoiding dual-write
-- divergence between a separate outbox table and job state.
CREATE TABLE IF NOT EXISTS jobs (
  job_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'prj_default',
  idempotency_key TEXT NULL,
  modality TEXT NOT NULL,
  model TEXT NOT NULL,
  resolved_provider_model TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_job_id TEXT NULL,
  status TEXT NOT NULL,
  submission_state TEXT NOT NULL DEFAULT 'not_submitted',
  submission_attempt_id TEXT NULL UNIQUE,
  submission_started_at TIMESTAMPTZ NULL,
  submission_attempts INTEGER NOT NULL DEFAULT 0,
  poll_attempts INTEGER NOT NULL DEFAULT 0,
  max_submission_attempts INTEGER NOT NULL DEFAULT 3,
  max_poll_attempts INTEGER NOT NULL DEFAULT 180,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_owner TEXT NULL,
  lease_expires_at TIMESTAMPTZ NULL,
  fencing_token BIGINT NOT NULL DEFAULT 0,
  progress DOUBLE PRECISION NOT NULL DEFAULT 0,
  credits_reserved BIGINT NOT NULL,
  estimated_cost BIGINT NOT NULL,
  actual_cost BIGINT NULL,
  inputs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  workflow_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivery_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json JSONB NULL,
  outputs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT NULL,
  last_event_version INTEGER NOT NULL DEFAULT 0,
  events_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  CONSTRAINT uq_jobs_tenant_job UNIQUE (tenant_id, job_id),
  CONSTRAINT chk_jobs_modality
    CHECK (modality IN ('image', 'i2i', 'video', 'i2v', 'v2v', 'lipsync')),
  CONSTRAINT chk_jobs_status
    CHECK (status IN ('queued', 'running', 'reconciling_submission', 'succeeded', 'failed')),
  CONSTRAINT chk_jobs_submission_state
    CHECK (submission_state IN ('not_submitted', 'submitting', 'submitted', 'submission_unknown')),
  CONSTRAINT chk_jobs_attempts_nonnegative
    CHECK (
      submission_attempts >= 0 AND
      poll_attempts >= 0 AND
      max_submission_attempts >= 1 AND
      max_poll_attempts >= 1 AND
      fencing_token >= 0 AND
      last_event_version >= 0
    ),
  CONSTRAINT chk_jobs_progress_bounds
    CHECK (progress >= 0 AND progress <= 1),
  CONSTRAINT chk_jobs_credit_bounds
    CHECK (
      credits_reserved > 0 AND
      credits_reserved <= 1000000000000 AND
      estimated_cost > 0 AND
      estimated_cost <= 1000000000000 AND
      credits_reserved = estimated_cost AND
      (actual_cost IS NULL OR (actual_cost >= 0 AND actual_cost <= credits_reserved))
    )
);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_created_at
  ON jobs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_worker_claim
  ON jobs (status, next_run_at ASC)
  WHERE status IN ('queued', 'running');

CREATE INDEX IF NOT EXISTS idx_jobs_lease_expiry
  ON jobs (lease_expires_at ASC)
  WHERE status = 'running';

CREATE OR REPLACE FUNCTION trg_enforce_jobs_invariants()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tenant_id <> NEW.tenant_id THEN
    RAISE EXCEPTION 'Job tenant_id is immutable (job_id=%)', OLD.job_id
      USING ERRCODE = '23514';
  END IF;

  IF OLD.status IN ('succeeded', 'failed') AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'Cannot transition job % from terminal status % to %',
      OLD.job_id, OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  IF NEW.fencing_token < OLD.fencing_token THEN
    RAISE EXCEPTION 'Fencing token for job % cannot decrease (old=%, new=%)',
      OLD.job_id, OLD.fencing_token, NEW.fencing_token
      USING ERRCODE = '23514';
  END IF;

  IF OLD.provider_job_id IS NOT NULL AND (NEW.provider_job_id IS NULL OR NEW.provider_job_id <> OLD.provider_job_id) THEN
    RAISE EXCEPTION 'Persisted provider_job_id for job % is immutable (old=%, new=%)',
      OLD.job_id, OLD.provider_job_id, NEW.provider_job_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_jobs_invariants ON jobs;
CREATE TRIGGER enforce_jobs_invariants
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION trg_enforce_jobs_invariants();

CREATE TABLE IF NOT EXISTS idempotency_keys (
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  normalized_request_json JSONB NOT NULL,
  job_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, idempotency_key),
  CONSTRAINT uq_idempotency_tenant_job UNIQUE (tenant_id, job_id),
  CONSTRAINT fk_idempotency_job
    FOREIGN KEY (tenant_id, job_id)
    REFERENCES jobs(tenant_id, job_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_reservations (
  job_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL,
  settled_amount BIGINT NULL,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ NULL,
  released_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_reservation_job
    FOREIGN KEY (tenant_id, job_id)
    REFERENCES jobs(tenant_id, job_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_reservation_amount
    CHECK (amount > 0 AND amount <= 1000000000000),
  CONSTRAINT chk_reservation_status
    CHECK (status IN ('reserved', 'settled', 'released')),
  CONSTRAINT chk_reservation_state_consistency
    CHECK (
      (status = 'reserved' AND settled_amount IS NULL AND settled_at IS NULL AND released_at IS NULL) OR
      (status = 'settled' AND settled_amount IS NOT NULL AND settled_amount >= 0 AND settled_amount <= amount AND settled_at IS NOT NULL AND released_at IS NULL) OR
      (status = 'released' AND settled_amount IS NULL AND settled_at IS NULL AND released_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_credit_reservations_tenant_status
  ON credit_reservations (tenant_id, status);

CREATE OR REPLACE FUNCTION trg_enforce_reservation_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tenant_id <> NEW.tenant_id OR OLD.job_id <> NEW.job_id OR OLD.amount <> NEW.amount THEN
    RAISE EXCEPTION 'Reservation identity and reserved amount are immutable (job_id=%)', OLD.job_id
      USING ERRCODE = '23514';
  END IF;

  IF OLD.status IN ('settled', 'released') THEN
    RAISE EXCEPTION 'Reservation for job % is already in terminal state % and cannot transition to %',
      OLD.job_id, OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_reservation_transition ON credit_reservations;
CREATE TRIGGER enforce_reservation_transition
  BEFORE UPDATE ON credit_reservations
  FOR EACH ROW
  EXECUTE FUNCTION trg_enforce_reservation_transition();

CREATE TABLE IF NOT EXISTS credit_ledger (
  entry_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  job_id TEXT NULL,
  entry_type TEXT NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  reserved_after BIGINT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_ledger_job
    FOREIGN KEY (tenant_id, job_id)
    REFERENCES jobs(tenant_id, job_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_ledger_entry_type
    CHECK (entry_type IN ('grant', 'reserve', 'settle', 'release')),
  CONSTRAINT chk_ledger_amounts
    CHECK (
      amount >= 0 AND
      amount <= 1000000000000 AND
      balance_after >= 0 AND
      reserved_after >= 0 AND
      balance_after >= reserved_after
    ),
  CONSTRAINT chk_ledger_job_presence
    CHECK (
      (entry_type = 'grant' AND job_id IS NULL AND amount > 0) OR
      (entry_type IN ('reserve', 'settle', 'release') AND job_id IS NOT NULL)
    )
);

-- Supplementary uniqueness guard ensuring at most one reserve, settle, or release ledger row per job.
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_ledger_job_entry_type
  ON credit_ledger (job_id, entry_type)
  WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_ledger_tenant_occurred_at
  ON credit_ledger (tenant_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION trg_prevent_credit_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'credit_ledger is append-only and immutable; % is prohibited', TG_OP
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_credit_ledger_mutation ON credit_ledger;
CREATE TRIGGER prevent_credit_ledger_mutation
  BEFORE UPDATE OR DELETE ON credit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION trg_prevent_credit_ledger_mutation();

CREATE TABLE IF NOT EXISTS assets (
  asset_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  job_id TEXT NULL,
  modality TEXT NOT NULL,
  content_type TEXT NOT NULL,
  storage_type TEXT NOT NULL,
  durable BOOLEAN NOT NULL DEFAULT FALSE,
  private BOOLEAN NOT NULL DEFAULT TRUE,
  source_url TEXT NOT NULL,
  filename TEXT NULL,
  status TEXT NOT NULL DEFAULT 'reference_registered',
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assets_tenant_asset UNIQUE (tenant_id, asset_id),
  CONSTRAINT fk_assets_job
    FOREIGN KEY (tenant_id, job_id)
    REFERENCES jobs(tenant_id, job_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_assets_storage_type
    CHECK (storage_type IN ('inline_data_url', 'external_url_reference')),
  CONSTRAINT chk_assets_not_durable_checkpoint2
    CHECK (durable = FALSE)
);

CREATE INDEX IF NOT EXISTS idx_assets_tenant_created_at
  ON assets (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS job_events (
  seq_id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  job_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  event_version INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  progress DOUBLE PRECISION NOT NULL DEFAULT 0,
  provider TEXT NOT NULL,
  provider_job_id TEXT NULL,
  data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_job_events_job_version UNIQUE (job_id, event_version),
  CONSTRAINT fk_job_events_job
    FOREIGN KEY (tenant_id, job_id)
    REFERENCES jobs(tenant_id, job_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_job_events_version_positive
    CHECK (event_version >= 1),
  CONSTRAINT chk_job_events_progress
    CHECK (progress >= 0 AND progress <= 1)
);

CREATE INDEX IF NOT EXISTS idx_job_events_job_version
  ON job_events (job_id, event_version ASC);
