-- Timecapsule White-Label Engine (Phase W0: Multi-Tenant Foundations)
-- Adds tenant parameters (slug, status, plan, branding, legal, flags, spend_ceiling)
-- Adds users and memberships tables with strict roles and tenancy isolation foreign keys.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE NULL,
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Default Tenant',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS legal JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS spend_ceiling_credits BIGINT NULL;

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS chk_tenants_status;

ALTER TABLE tenants
  ADD CONSTRAINT chk_tenants_status
  CHECK (status IN ('active', 'suspended', 'killed'));

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS chk_tenants_plan;

ALTER TABLE tenants
  ADD CONSTRAINT chk_tenants_plan
  CHECK (plan IN ('starter', 'growth', 'scale', 'internal'));

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS chk_tenants_spend_ceiling_nonnegative;

ALTER TABLE tenants
  ADD CONSTRAINT chk_tenants_spend_ceiling_nonnegative
  CHECK (spend_ceiling_credits IS NULL OR spend_ceiling_credits >= 0);

CREATE INDEX IF NOT EXISTS idx_tenants_slug
  ON tenants (slug)
  WHERE slug IS NOT NULL;

-- 2. Users table (global or tenant-scoped via memberships)
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  auth_mode TEXT NOT NULL DEFAULT 'otp',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_users_auth_mode
    CHECK (auth_mode IN ('otp', 'token', 'preview', 'password')),
  CONSTRAINT chk_users_status
    CHECK (status IN ('active', 'invited', 'suspended'))
);

CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

-- 3. Memberships table (junction: user, tenant, role)
CREATE TABLE IF NOT EXISTS memberships (
  membership_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'end_user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_memberships_user_tenant
    UNIQUE (user_id, tenant_id),
  CONSTRAINT chk_memberships_role
    CHECK (role IN ('platform_admin', 'reseller_admin', 'end_user')),
  CONSTRAINT chk_memberships_status
    CHECK (status IN ('active', 'suspended'))
);

CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role
  ON memberships (tenant_id, role);

CREATE INDEX IF NOT EXISTS idx_memberships_user
  ON memberships (user_id);
