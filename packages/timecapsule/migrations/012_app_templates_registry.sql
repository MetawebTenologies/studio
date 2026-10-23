-- Migration 012: Data-Driven App Template Registry
-- Introduces isolated template registry for single-purpose creative apps.
-- 1. Creates `app_templates` table with tenant reference (TEXT) and draft status.
-- 2. Scopes tenant read access via RLS: tenants see published global templates OR their own private templates.
-- 3. Seeds the two approved starter templates: Commercial Product Concept & Minimalist Brand Logo Concept.

CREATE TABLE IF NOT EXISTS app_templates (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  tenant_id TEXT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  model_id TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  default_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid slug lookup and tenant-scoped listings
CREATE INDEX IF NOT EXISTS idx_app_templates_slug
  ON app_templates (slug);

CREATE INDEX IF NOT EXISTS idx_app_templates_tenant_status
  ON app_templates (tenant_id, status);

-- Enable & Force Row-Level Security
ALTER TABLE app_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_templates FORCE ROW LEVEL SECURITY;

-- Step 2: RLS Policies
-- Ordinary tenant context: sees published global templates OR their own private templates
DROP POLICY IF EXISTS rls_app_templates_tenant_select ON app_templates;
CREATE POLICY rls_app_templates_tenant_select ON app_templates
  FOR SELECT TO timecapsule_tenant_role
  USING (
    (tenant_id IS NULL AND status = 'published')
    OR (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  );

-- System context: unrestricted access for worker, migrations, and platform admins
DROP POLICY IF EXISTS rls_app_templates_system_all ON app_templates;
CREATE POLICY rls_app_templates_system_all ON app_templates
  FOR ALL TO timecapsule_system_role
  USING (true) WITH CHECK (true);

-- Step 3: Grant and Revoke Privileges
GRANT USAGE ON SCHEMA public TO timecapsule_tenant_role;
GRANT SELECT ON app_templates TO timecapsule_tenant_role;

GRANT USAGE ON SCHEMA public TO timecapsule_system_role;
GRANT ALL ON app_templates TO timecapsule_system_role;

REVOKE ALL ON app_templates FROM PUBLIC;

-- Step 4: Seed the Two Approved System Templates (status = 'published')
INSERT INTO app_templates (
  id,
  slug,
  tenant_id,
  version,
  title,
  category,
  description,
  model_id,
  prompt_template,
  default_parameters,
  status
) VALUES (
  'tmpl_product_concept_01',
  'product-concept-pro',
  NULL,
  1,
  'Commercial Product Concept',
  'Product Visualization',
  'Photorealistic 2D raster studio product concept staging.',
  'nano-banana-pro',
  'Commercial studio product concept photography, {user_prompt}, centered composition, soft diffuse studio strobe lighting, clean commercial backdrop, f/4 aperture, crisp packaging typography, photorealistic 8k',
  '{"aspect_ratio": "1:1", "resolution": "1k"}'::jsonb,
  'published'
), (
  'tmpl_brand_logo_01',
  'brand-logo-concept',
  NULL,
  1,
  'Minimalist Brand Logo Concept',
  'Brand Identity',
  'Raster visual insignia and minimal logo concept artwork.',
  'nano-banana-pro',
  'Minimalist brand insignia, flat graphic logo design for {user_prompt}, vector art aesthetic, clean bold geometric lines, high-contrast monochrome on solid white background, modern corporate iconography, zero clutter',
  '{"aspect_ratio": "1:1", "resolution": "1k"}'::jsonb,
  'published'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  model_id = EXCLUDED.model_id,
  prompt_template = EXCLUDED.prompt_template,
  default_parameters = EXCLUDED.default_parameters,
  status = EXCLUDED.status,
  updated_at = NOW();
