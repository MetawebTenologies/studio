-- Timecapsule Security Fix (Condition 1: Force RLS & System Actor Policies)
-- Ensures table owners and superusers cannot accidentally bypass RLS without system actor intent.
ALTER TABLE jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE assets FORCE ROW LEVEL SECURITY;
ALTER TABLE credit_reservations FORCE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger FORCE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;

-- Dual Policies for non-tenant connections (system actors, background workers, admin tools):
-- Specifically excludes timecapsule_tenant_role so tenant role is strictly bound by rls_*_tenant_isolation.
DROP POLICY IF EXISTS rls_jobs_system_policy ON jobs;
CREATE POLICY rls_jobs_system_policy ON jobs
  FOR ALL
  TO PUBLIC
  USING (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  );

DROP POLICY IF EXISTS rls_assets_system_policy ON assets;
CREATE POLICY rls_assets_system_policy ON assets
  FOR ALL
  TO PUBLIC
  USING (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  );

DROP POLICY IF EXISTS rls_credit_reservations_system_policy ON credit_reservations;
CREATE POLICY rls_credit_reservations_system_policy ON credit_reservations
  FOR ALL
  TO PUBLIC
  USING (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  );

DROP POLICY IF EXISTS rls_credit_ledger_system_policy ON credit_ledger;
CREATE POLICY rls_credit_ledger_system_policy ON credit_ledger
  FOR ALL
  TO PUBLIC
  USING (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  );

DROP POLICY IF EXISTS rls_idempotency_keys_system_policy ON idempotency_keys;
CREATE POLICY rls_idempotency_keys_system_policy ON idempotency_keys
  FOR ALL
  TO PUBLIC
  USING (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  );

DROP POLICY IF EXISTS rls_memberships_system_policy ON memberships;
CREATE POLICY rls_memberships_system_policy ON memberships
  FOR ALL
  TO PUBLIC
  USING (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    current_user != 'timecapsule_tenant_role' AND (
      current_setting('app.is_system_actor', true) = 'true'
      OR NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
  );
