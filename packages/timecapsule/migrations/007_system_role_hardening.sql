-- Timecapsule Security Fix (P0-1 / S8: Hardened System Role & Fail-Closed RLS)
-- 1. Creates dedicated timecapsule_system_role (NOINHERIT).
-- 2. Scopes all system RLS bypass policies strictly TO timecapsule_system_role USING (true) WITH CHECK (true).
-- 3. Revokes all permissions on tenant-isolated tables from PUBLIC to ensure fail-closed access.
-- 4. Binds system worker and administrative operations to explicit SET LOCAL ROLE timecapsule_system_role.

-- Step 1: Ensure timecapsule_system_role exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'timecapsule_system_role') THEN
    CREATE ROLE timecapsule_system_role NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'timecapsule_tenant_role') THEN
    CREATE ROLE timecapsule_tenant_role NOINHERIT;
  END IF;
END $$;

-- Step 2: Grant table and sequence permissions to timecapsule_system_role
GRANT USAGE ON SCHEMA public TO timecapsule_system_role;
GRANT ALL ON jobs TO timecapsule_system_role;
GRANT ALL ON assets TO timecapsule_system_role;
GRANT ALL ON credit_reservations TO timecapsule_system_role;
GRANT ALL ON credit_ledger TO timecapsule_system_role;
GRANT ALL ON idempotency_keys TO timecapsule_system_role;
GRANT ALL ON memberships TO timecapsule_system_role;
GRANT ALL ON tenants TO timecapsule_system_role;
GRANT ALL ON users TO timecapsule_system_role;
GRANT ALL ON job_events TO timecapsule_system_role;
GRANT ALL ON schema_migrations TO timecapsule_system_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO timecapsule_system_role;

-- Grant SELECT on reference tables to timecapsule_tenant_role for joins
GRANT SELECT ON tenants TO timecapsule_tenant_role;
GRANT SELECT ON users TO timecapsule_tenant_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO timecapsule_tenant_role;

-- Step 3: Grant timecapsule_system_role and timecapsule_tenant_role to CURRENT_USER
DO $$
BEGIN
  EXECUTE format('GRANT timecapsule_system_role TO %I', CURRENT_USER);
  EXECUTE format('GRANT timecapsule_tenant_role TO %I', CURRENT_USER);
END $$;

-- Step 4: Revoke table permissions from PUBLIC on tenant-scoped tables
REVOKE ALL ON jobs FROM PUBLIC;
REVOKE ALL ON assets FROM PUBLIC;
REVOKE ALL ON credit_reservations FROM PUBLIC;
REVOKE ALL ON credit_ledger FROM PUBLIC;
REVOKE ALL ON idempotency_keys FROM PUBLIC;
REVOKE ALL ON memberships FROM PUBLIC;

-- Step 5: Drop fail-open system policies from migration 006
DROP POLICY IF EXISTS rls_jobs_system_policy ON jobs;
DROP POLICY IF EXISTS rls_assets_system_policy ON assets;
DROP POLICY IF EXISTS rls_credit_reservations_system_policy ON credit_reservations;
DROP POLICY IF EXISTS rls_credit_ledger_system_policy ON credit_ledger;
DROP POLICY IF EXISTS rls_idempotency_keys_system_policy ON idempotency_keys;
DROP POLICY IF EXISTS rls_memberships_system_policy ON memberships;

-- Step 6: Create fail-closed system policies scoped strictly TO timecapsule_system_role
CREATE POLICY rls_jobs_system_policy ON jobs
  FOR ALL
  TO timecapsule_system_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY rls_assets_system_policy ON assets
  FOR ALL
  TO timecapsule_system_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY rls_credit_reservations_system_policy ON credit_reservations
  FOR ALL
  TO timecapsule_system_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY rls_credit_ledger_system_policy ON credit_ledger
  FOR ALL
  TO timecapsule_system_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY rls_idempotency_keys_system_policy ON idempotency_keys
  FOR ALL
  TO timecapsule_system_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY rls_memberships_system_policy ON memberships
  FOR ALL
  TO timecapsule_system_role
  USING (true)
  WITH CHECK (true);
