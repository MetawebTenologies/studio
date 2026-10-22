-- Timecapsule Security Fix (P0-1 / S8: Tenant & User RLS Hardening & Leak Elimination)
-- 1. Enables and forces Row Level Security on `tenants`, `users`, and `job_events`.
-- 2. Scopes system bypass policies strictly TO timecapsule_system_role USING (true) WITH CHECK (true).
-- 3. Scopes tenant policies TO timecapsule_tenant_role:
--    - tenants: tenant_id = NULLIF(current_setting('app.tenant_id', true), '')
--    - users: user_id IN (SELECT user_id FROM memberships WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
--    - job_events: tenant_id = NULLIF(current_setting('app.tenant_id', true), '')
-- 4. Revokes unneeded grant on schema_migrations from timecapsule_system_role and timecapsule_tenant_role.
-- 5. Revokes all permissions from PUBLIC on tenants, users, job_events, schema_migrations.

-- Step 1: Revoke all from PUBLIC and internal table access
REVOKE ALL ON tenants FROM PUBLIC;
REVOKE ALL ON users FROM PUBLIC;
REVOKE ALL ON job_events FROM PUBLIC;
REVOKE ALL ON schema_migrations FROM PUBLIC;
REVOKE ALL ON schema_migrations FROM timecapsule_system_role;
REVOKE ALL ON schema_migrations FROM timecapsule_tenant_role;

-- Step 2: Grant permissions on job_events to tenant role
GRANT SELECT ON job_events TO timecapsule_tenant_role;

-- Step 3: Enable and FORCE Row Level Security on tenants, users, job_events
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_events FORCE ROW LEVEL SECURITY;

-- Step 4: Drop any pre-existing policies on these tables
DROP POLICY IF EXISTS rls_tenants_system_policy ON tenants;
DROP POLICY IF EXISTS rls_tenants_tenant_isolation ON tenants;

DROP POLICY IF EXISTS rls_users_system_policy ON users;
DROP POLICY IF EXISTS rls_users_tenant_isolation ON users;

DROP POLICY IF EXISTS rls_job_events_system_policy ON job_events;
DROP POLICY IF EXISTS rls_job_events_tenant_isolation ON job_events;

-- Step 5: System role policies (fail-closed, strictly TO timecapsule_system_role)
CREATE POLICY rls_tenants_system_policy ON tenants
  FOR ALL
  TO timecapsule_system_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY rls_users_system_policy ON users
  FOR ALL
  TO timecapsule_system_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY rls_job_events_system_policy ON job_events
  FOR ALL
  TO timecapsule_system_role
  USING (true)
  WITH CHECK (true);

-- Step 6: Tenant role policies (scoped strictly to app.tenant_id)
CREATE POLICY rls_tenants_tenant_isolation ON tenants
  FOR SELECT
  TO timecapsule_tenant_role
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

CREATE POLICY rls_users_tenant_isolation ON users
  FOR SELECT
  TO timecapsule_tenant_role
  USING (
    user_id IN (
      SELECT m.user_id FROM memberships m
      WHERE m.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')
    )
  );

CREATE POLICY rls_job_events_tenant_isolation ON job_events
  FOR SELECT
  TO timecapsule_tenant_role
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

-- Step 7: Ensure assets tenant isolation policy is clean without soft-delete update conflict
DROP POLICY IF EXISTS rls_assets_tenant_isolation ON assets;
CREATE POLICY rls_assets_tenant_isolation ON assets
  FOR ALL
  TO timecapsule_tenant_role
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));
