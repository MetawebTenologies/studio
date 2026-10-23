import { withTenantContext, withSystemContext } from './db.js';
import { getModelCapabilities } from '../models/capabilities.js';

/**
 * Maximum character limit for user-supplied template input variables.
 */
export const MAX_TEMPLATE_USER_INPUT_LENGTH = 1000;

/**
 * Fetches all templates visible to the authenticated tenant under RLS:
 * - Published global templates (tenant_id IS NULL AND status = 'published')
 * - Private templates owned by this tenant (any status)
 */
export async function getTemplatesForTenant(tenantId) {
  if (!tenantId) {
    throw new Error('tenantId is required to query templates');
  }

  return withTenantContext(tenantId, async (client) => {
    const res = await client.query(
      `SELECT id, slug, version, title, category, description, model_id, default_parameters, status, created_at
       FROM app_templates
       ORDER BY created_at ASC`
    );

    return res.rows.map((row) => {
      const caps = getModelCapabilities(row.model_id);
      return {
        id: row.id,
        slug: row.slug,
        version: row.version,
        title: row.title,
        category: row.category,
        description: row.description,
        model_id: row.model_id,
        default_parameters: row.default_parameters,
        status: row.status,
        pricing: caps?.credit_estimate_policy || null,
        created_at: row.created_at,
      };
    });
  });
}

/**
 * Fetches a single template by slug under tenant RLS.
 * Returns null if not found or unauthorized.
 */
export async function getTemplateBySlug(slug, tenantId) {
  if (!slug || !tenantId) return null;

  return withTenantContext(tenantId, async (client) => {
    const res = await client.query(
      `SELECT id, slug, version, title, category, description, model_id, prompt_template, default_parameters, status, created_at
       FROM app_templates
       WHERE slug = $1`,
      [slug]
    );

    const row = res.rows[0];
    if (!row) return null;

    const caps = getModelCapabilities(row.model_id);
    return {
      id: row.id,
      slug: row.slug,
      version: row.version,
      title: row.title,
      category: row.category,
      description: row.description,
      model_id: row.model_id,
      prompt_template: row.prompt_template,
      default_parameters: row.default_parameters,
      status: row.status,
      pricing: caps?.credit_estimate_policy || null,
      created_at: row.created_at,
    };
  });
}

/**
 * Validates user input and deterministically synthesizes the final prompt
 * using the immutable database prompt harness.
 */
export function synthesizeTemplatePrompt(template, userPrompt) {
  if (!template || !template.prompt_template) {
    const err = new Error('Invalid template specification');
    err.code = 'TEMPLATE_SYNTHESIS_ERROR';
    err.statusCode = 422;
    throw err;
  }

  if (typeof userPrompt !== 'string' || !userPrompt.trim()) {
    const err = new Error('Please enter a description for your concept.');
    err.code = 'MISSING_TEMPLATE_VARIABLE';
    err.statusCode = 400;
    throw err;
  }

  const trimmed = userPrompt.trim();
  if (trimmed.length > MAX_TEMPLATE_USER_INPUT_LENGTH) {
    const err = new Error(
      `Input exceeds maximum allowed length of ${MAX_TEMPLATE_USER_INPUT_LENGTH} characters.`
    );
    err.code = 'TEMPLATE_VARIABLE_TOO_LONG';
    err.statusCode = 400;
    throw err;
  }

  // Sanitize: strip null bytes, unprintable control characters (retain common newlines/tabs)
  const sanitized = trimmed.replace(/\0/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Perform macro substitution
  const synthesized = template.prompt_template.replace(/\{user_prompt\}/g, sanitized);

  return synthesized;
}

/**
 * Seeds or restores the two approved starter templates into app_templates.
 * Idempotent via ON CONFLICT (slug).
 */
export async function seedStarterTemplates(client = null) {
  const runner = async (c) => {
    await c.query(`
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
    `);
  };

  if (client) {
    await runner(client);
  } else {
    await withSystemContext(runner);
  }
}
