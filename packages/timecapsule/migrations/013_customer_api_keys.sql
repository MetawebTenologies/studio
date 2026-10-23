-- Migration 013: Customer Developer API Key Lifecycle (KEY-1)
-- Introduces customer developer API keys for programmatic access.
-- 1. Creates `customer_api_keys` table scoped to tenant and user.
-- 2. Stores only cryptographic SHA-256 hash of secret key (never plaintext).
-- 3. Enables RLS with tenant isolation: tenants can only manage their own keys.
-- 4. Provides instant revocation via `revoked_at` timestamp.

CREATE TABLE IF NOT EXISTS customer_api_keys (
  key_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes JSONB NOT NULL DEFAULT '["generations:write", "generations:read", "models:read", "uploads:write"]'::jsonb,
  revoked_at TIMESTAMPTZ NULL,
  last_used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for fast lookup on Bearer auth verification and tenant listings
CREATE INDEX IF NOT EXISTS idx_customer_api_keys_hash
  ON customer_api_keys (key_hash);

CREATE INDEX IF NOT EXISTS idx_customer_api_keys_tenant
  ON customer_api_keys (tenant_id, revoked_at);

-- Enable and Force Row Level Security
ALTER TABLE customer_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_api_keys FORCE ROW LEVEL SECURITY;

-- Tenant RLS Policy: Tenants can only view and manage keys within their tenant context
DROP POLICY IF EXISTS rls_customer_api_keys_tenant_all ON customer_api_keys;
CREATE POLICY rls_customer_api_keys_tenant_all ON customer_api_keys
  FOR ALL TO timecapsule_tenant_role
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

-- System Role Policy: Unrestricted access for internal background workers, auth verification, and migrations
DROP POLICY IF EXISTS rls_customer_api_keys_system_all ON customer_api_keys;
CREATE POLICY rls_customer_api_keys_system_all ON customer_api_keys
  FOR ALL TO timecapsule_system_role
  USING (true) WITH CHECK (true);

-- Permissions
GRANT USAGE ON SCHEMA public TO timecapsule_tenant_role;
GRANT ALL ON customer_api_keys TO timecapsule_tenant_role;

GRANT USAGE ON SCHEMA public TO timecapsule_system_role;
GRANT ALL ON customer_api_keys TO timecapsule_system_role;

REVOKE ALL ON customer_api_keys FROM PUBLIC;

-- Step 5: Multi-Provider Cascade Router Invariant Support
-- Allow authorized internal cascade failover (via transitionJobCascadeRoute)
-- while strictly preserving immutability once provider_job_id has been persisted.
CREATE OR REPLACE FUNCTION trg_enforce_jobs_invariants()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tenant_id <> NEW.tenant_id THEN
    RAISE EXCEPTION 'Job tenant_id is immutable (job_id=%)', OLD.job_id
      USING ERRCODE = '23514';
  END IF;

  IF OLD.provider <> NEW.provider OR OLD.resolved_provider_model <> NEW.resolved_provider_model OR OLD.execution_route <> NEW.execution_route THEN
    IF COALESCE(current_setting('app.allow_cascade_failover', true), '') <> 'true' OR OLD.provider_job_id IS NOT NULL THEN
      RAISE EXCEPTION 'Job provider routing (provider, resolved_provider_model, execution_route) is immutable after creation (job_id=%)',
        OLD.job_id
        USING ERRCODE = '23514';
    END IF;
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

