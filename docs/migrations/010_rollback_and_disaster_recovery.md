# Migration Rollback and Disaster Recovery Notes (Migrations 007 - 010)

## Overview
This document specifies the rollback and forward-recovery procedures for migrations 007, 008, 009, and 010.

---

## 1. Migration 010: `010_rls_tenants_and_users_hardening.sql`

### Changes Introduced:
- Enabled and forced RLS on `tenants`, `users`, and `job_events`.
- Revoked all table permissions from `PUBLIC` on `tenants`, `users`, `job_events`, and `schema_migrations`.
- Revoked `schema_migrations` from `timecapsule_system_role` and `timecapsule_tenant_role`.
- Established strict tenant isolation policies for `timecapsule_tenant_role` on `tenants`, `users`, and `job_events`.
- Cleaned up assets tenant isolation policy to prevent soft-delete update RLS conflicts.

### Reversion Script (`rollback_010.sql`):
```sql
BEGIN;

-- 1. Drop RLS policies on tenants, users, job_events
DROP POLICY IF EXISTS rls_tenants_system_policy ON tenants;
DROP POLICY IF EXISTS rls_tenants_tenant_isolation ON tenants;

DROP POLICY IF EXISTS rls_users_system_policy ON users;
DROP POLICY IF EXISTS rls_users_tenant_isolation ON users;

DROP POLICY IF EXISTS rls_job_events_system_policy ON job_events;
DROP POLICY IF EXISTS rls_job_events_tenant_isolation ON job_events;

-- 2. Disable Row Level Security on tenants, users, job_events
ALTER TABLE tenants NO FORCE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

ALTER TABLE users NO FORCE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

ALTER TABLE job_events NO FORCE ROW LEVEL SECURITY;
ALTER TABLE job_events DISABLE ROW LEVEL SECURITY;

-- 3. Restore pre-010 assets policy
DROP POLICY IF EXISTS rls_assets_tenant_isolation ON assets;
CREATE POLICY rls_assets_tenant_isolation ON assets
  FOR ALL
  TO timecapsule_tenant_role
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')
    AND deleted_at IS NULL
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')
  );

-- 4. Remove migration record
DELETE FROM schema_migrations WHERE version = '010';

COMMIT;
```

---

## 2. Migration 009: `009_user_uploads_and_soft_delete.sql`

### Reversion Script (`rollback_009.sql`):
```sql
BEGIN;

DROP INDEX IF EXISTS idx_assets_tenant_modality_active;

ALTER TABLE assets
  DROP COLUMN IF EXISTS metadata_json,
  DROP COLUMN IF EXISTS thumbnail_url,
  DROP COLUMN IF EXISTS deleted_at,
  DROP COLUMN IF EXISTS user_id;

DELETE FROM schema_migrations WHERE version = '009';

COMMIT;
```

---

## 3. Migration 008: `008_asset_request_id.sql`

### Reversion Script (`rollback_008.sql`):
```sql
BEGIN;

DROP INDEX IF EXISTS idx_assets_request_id;
ALTER TABLE assets DROP COLUMN IF EXISTS request_id;

DELETE FROM schema_migrations WHERE version = '008';

COMMIT;
```

---

## 4. Migration 007: `007_system_role_hardening.sql`

### Reversion Script (`rollback_007.sql`):
```sql
BEGIN;

-- Drop fail-closed policies
DROP POLICY IF EXISTS rls_jobs_system_policy ON jobs;
DROP POLICY IF EXISTS rls_assets_system_policy ON assets;
DROP POLICY IF EXISTS rls_credit_reservations_system_policy ON credit_reservations;
DROP POLICY IF EXISTS rls_credit_ledger_system_policy ON credit_ledger;
DROP POLICY IF EXISTS rls_idempotency_keys_system_policy ON idempotency_keys;
DROP POLICY IF EXISTS rls_memberships_system_policy ON memberships;

-- Restore dual policies from migration 006
\i packages/timecapsule/migrations/006_force_rls.sql

DELETE FROM schema_migrations WHERE version = '007';

COMMIT;
```
