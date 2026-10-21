-- Timecapsule Checkpoint 3A: Provider Routes, Pricing Policy Versioning, Private Provider Details, and Provider-Hosted Uploads
-- 1. Persist explicit provider route metadata, pricing policy version, and redacted private provider details on jobs.
-- 2. Enforce immutability of provider, resolved_provider_model, and execution_route on jobs so already-created jobs
--    always continue through their original provider adapter.
-- 3. Extend assets storage_type constraint to support 'provider_hosted_upload' (durable = FALSE) and record upload provider.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS execution_route TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS execution_route_version TEXT NOT NULL DEFAULT '2026-10-21.v1',
  ADD COLUMN IF NOT EXISTS pricing_policy_version TEXT NOT NULL DEFAULT 'tc-pricing-v1',
  ADD COLUMN IF NOT EXISTS provider_details_private_json JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION trg_enforce_jobs_invariants()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tenant_id <> NEW.tenant_id THEN
    RAISE EXCEPTION 'Job tenant_id is immutable (job_id=%)', OLD.job_id
      USING ERRCODE = '23514';
  END IF;

  IF OLD.provider <> NEW.provider OR OLD.resolved_provider_model <> NEW.resolved_provider_model OR OLD.execution_route <> NEW.execution_route THEN
    RAISE EXCEPTION 'Job provider routing (provider, resolved_provider_model, execution_route) is immutable after creation (job_id=%)',
      OLD.job_id
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

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS provider TEXT NULL;

ALTER TABLE assets
  DROP CONSTRAINT IF EXISTS chk_assets_storage_type;

ALTER TABLE assets
  ADD CONSTRAINT chk_assets_storage_type
  CHECK (storage_type IN ('inline_data_url', 'external_url_reference', 'provider_hosted_upload'));
