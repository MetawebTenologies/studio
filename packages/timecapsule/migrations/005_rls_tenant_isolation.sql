-- Timecapsule Security Fix (Phase S1: Row Level Security & GUC Tenant Isolation)
-- Enables Row Level Security (RLS) on user-visible tenant-scoped tables.
-- Uses `tenant_id = current_setting('app.tenant_id')` policy for strict multi-tenant data isolation.

-- 1. Create a dedicated non-bypass application role for tenant-scoped connections if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'timecapsule_tenant_role') THEN
    CREATE ROLE timecapsule_tenant_role NOINHERIT;
  END IF;
END $$;

-- Grant permissions to tenant role on tenant-scoped tables
GRANT USAGE ON SCHEMA public TO timecapsule_tenant_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON jobs TO timecapsule_tenant_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON assets TO timecapsule_tenant_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON credit_reservations TO timecapsule_tenant_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON credit_ledger TO timecapsule_tenant_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON idempotency_keys TO timecapsule_tenant_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON memberships TO timecapsule_tenant_role;

-- 2. Enable Row Level Security on user-visible tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies with tenant_id = NULLIF(current_setting('app.tenant_id', true), '')
DROP POLICY IF EXISTS rls_jobs_tenant_isolation ON jobs;
CREATE POLICY rls_jobs_tenant_isolation ON jobs
  FOR ALL
  TO timecapsule_tenant_role
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

DROP POLICY IF EXISTS rls_assets_tenant_isolation ON assets;
CREATE POLICY rls_assets_tenant_isolation ON assets
  FOR ALL
  TO timecapsule_tenant_role
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

DROP POLICY IF EXISTS rls_credit_reservations_tenant_isolation ON credit_reservations;
CREATE POLICY rls_credit_reservations_tenant_isolation ON credit_reservations
  FOR ALL
  TO timecapsule_tenant_role
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

DROP POLICY IF EXISTS rls_credit_ledger_tenant_isolation ON credit_ledger;
CREATE POLICY rls_credit_ledger_tenant_isolation ON credit_ledger
  FOR ALL
  TO timecapsule_tenant_role
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

DROP POLICY IF EXISTS rls_idempotency_keys_tenant_isolation ON idempotency_keys;
CREATE POLICY rls_idempotency_keys_tenant_isolation ON idempotency_keys
  FOR ALL
  TO timecapsule_tenant_role
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

DROP POLICY IF EXISTS rls_memberships_tenant_isolation ON memberships;
CREATE POLICY rls_memberships_tenant_isolation ON memberships
  FOR ALL
  TO timecapsule_tenant_role
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));
