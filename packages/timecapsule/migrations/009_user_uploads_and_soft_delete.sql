-- Timecapsule Track F9: User Upload History, Soft Delete, and Metadata
-- 1. Add user_id, deleted_at, thumbnail_url, and metadata_json to assets table.
-- 2. Create index on active tenant uploads.
-- 3. Update tenant RLS policy on assets to enforce deleted_at IS NULL for tenant queries.
-- 4. Ensure permissions for system and tenant roles.

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS user_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_assets_tenant_modality_active
  ON assets (tenant_id, modality, created_at DESC)
  WHERE deleted_at IS NULL;

-- Recreate RLS tenant policy to exclude soft-deleted assets for tenant role
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

-- Ensure permissions for system and tenant roles
GRANT SELECT, INSERT, UPDATE, DELETE ON assets TO timecapsule_system_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON assets TO timecapsule_tenant_role;
