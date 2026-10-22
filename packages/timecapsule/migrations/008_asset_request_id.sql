-- Timecapsule Security & Audit Fix (P0-3: Asset Provider and Request ID Persistence)
-- Adds `request_id` column to `assets` table and ensures permissions are granted to system & tenant roles.

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS request_id TEXT NULL;

-- Ensure grants for roles
GRANT SELECT, INSERT, UPDATE, DELETE ON assets TO timecapsule_system_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON assets TO timecapsule_tenant_role;
