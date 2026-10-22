import crypto from 'crypto';
import { query, withTransaction, withSystemContext, withTenantContext } from './db.js';

export async function createTenant({
  tenantId,
  slug = null,
  name = 'Default Tenant',
  plan = 'starter',
  status = 'active',
  branding = {},
  legal = {},
  flags = {},
  spendCeilingCredits = null,
  initialCredits = 0,
}) {
  const id = tenantId || `tnt_${crypto.randomBytes(8).toString('hex')}`;
  const normalizedSlug = slug ? String(slug).toLowerCase().trim() : null;

  return withTransaction(async (client) => {
    await withSystemContext(client, async () => {});
    const res = await client.query(
      `INSERT INTO tenants (
        tenant_id, slug, name, plan, status, branding, legal, flags, spend_ceiling_credits, credits_balance, credits_reserved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0)
      RETURNING tenant_id, slug, name, plan, status, branding, legal, flags, spend_ceiling_credits, credits_balance, credits_reserved, created_at`,
      [
        id,
        normalizedSlug,
        name,
        plan,
        status,
        JSON.stringify(branding),
        JSON.stringify(legal),
        JSON.stringify(flags),
        spendCeilingCredits,
        initialCredits,
      ]
    );

    if (initialCredits > 0) {
      await client.query(
        `INSERT INTO credit_ledger (
          entry_id, tenant_id, job_id, entry_type, amount, balance_after, reserved_after, metadata_json
        ) VALUES ($1, $2, NULL, 'grant', $3, $3, 0, $4)`,
        [
          `led_init_${crypto.randomBytes(8).toString('hex')}`,
          id,
          initialCredits,
          JSON.stringify({ granted_at: new Date().toISOString(), plan }),
        ]
      );
    }

    return res.rows[0];
  });
}

export async function getTenant(tenantId) {
  if (!tenantId) return null;
  const res = await query(
    `SELECT tenant_id, slug, name, plan, status, branding, legal, flags, spend_ceiling_credits, credits_balance, credits_reserved, created_at
     FROM tenants WHERE tenant_id = $1`,
    [tenantId]
  );
  return res.rows[0] || null;
}

export async function getTenantBySlug(slug) {
  if (!slug) return null;
  const normalized = String(slug).toLowerCase().trim();
  const res = await query(
    `SELECT tenant_id, slug, name, plan, status, branding, legal, flags, spend_ceiling_credits, credits_balance, credits_reserved, created_at
     FROM tenants WHERE slug = $1`,
    [normalized]
  );
  return res.rows[0] || null;
}

export async function updateTenant(tenantId, updates = {}) {
  const fields = [];
  const values = [tenantId];
  let idx = 2;

  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.slug !== undefined) {
    fields.push(`slug = $${idx++}`);
    values.push(updates.slug ? String(updates.slug).toLowerCase().trim() : null);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(updates.status);
  }
  if (updates.plan !== undefined) {
    fields.push(`plan = $${idx++}`);
    values.push(updates.plan);
  }
  if (updates.branding !== undefined) {
    fields.push(`branding = $${idx++}`);
    values.push(JSON.stringify(updates.branding));
  }
  if (updates.legal !== undefined) {
    fields.push(`legal = $${idx++}`);
    values.push(JSON.stringify(updates.legal));
  }
  if (updates.flags !== undefined) {
    fields.push(`flags = $${idx++}`);
    values.push(JSON.stringify(updates.flags));
  }
  if (updates.spendCeilingCredits !== undefined) {
    fields.push(`spend_ceiling_credits = $${idx++}`);
    values.push(updates.spendCeilingCredits);
  }

  if (fields.length === 0) {
    return getTenant(tenantId);
  }

  fields.push(`updated_at = NOW()`);

  const res = await query(
    `UPDATE tenants SET ${fields.join(', ')} WHERE tenant_id = $1
     RETURNING tenant_id, slug, name, plan, status, branding, legal, flags, spend_ceiling_credits, credits_balance, credits_reserved, updated_at`,
    values
  );
  return res.rows[0] || null;
}

export async function createUser({
  userId,
  email,
  authMode = 'otp',
  status = 'active',
}) {
  const id = userId || `usr_${crypto.randomBytes(8).toString('hex')}`;
  const normalizedEmail = String(email).toLowerCase().trim();

  const res = await query(
    `INSERT INTO users (user_id, email, auth_mode, status)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
     RETURNING user_id, email, auth_mode, status, created_at`,
    [id, normalizedEmail, authMode, status]
  );
  return res.rows[0];
}

export async function getUser(userId) {
  if (!userId) return null;
  const res = await query(
    `SELECT user_id, email, auth_mode, status, created_at FROM users WHERE user_id = $1`,
    [userId]
  );
  return res.rows[0] || null;
}

export async function getUserByEmail(email) {
  if (!email) return null;
  const normalized = String(email).toLowerCase().trim();
  const res = await query(
    `SELECT user_id, email, auth_mode, status, created_at FROM users WHERE email = $1`,
    [normalized]
  );
  return res.rows[0] || null;
}

export async function createMembership({
  membershipId,
  userId,
  tenantId,
  role = 'end_user',
  status = 'active',
}) {
  const id = membershipId || `mem_${crypto.randomBytes(8).toString('hex')}`;
  return withSystemContext(async (client) => {
    const res = await client.query(
      `INSERT INTO memberships (membership_id, user_id, tenant_id, role, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status, updated_at = NOW()
       RETURNING membership_id, user_id, tenant_id, role, status, created_at, updated_at`,
      [id, userId, tenantId, role, status]
    );
    return res.rows[0];
  });
}

export async function getMembership(userId, tenantId) {
  if (!userId || !tenantId) return null;
  return withSystemContext(async (client) => {
    const res = await client.query(
      `SELECT membership_id, user_id, tenant_id, role, status, created_at, updated_at
       FROM memberships WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );
    return res.rows[0] || null;
  });
}

export async function listMembershipsForTenant(tenantId) {
  if (!tenantId) return [];
  return withTenantContext(tenantId, async (client) => {
    const res = await client.query(
      `SELECT m.membership_id, m.user_id, m.tenant_id, m.role, m.status, u.email, m.created_at
       FROM memberships m
       JOIN users u ON u.user_id = m.user_id
       WHERE m.tenant_id = $1
       ORDER BY m.created_at ASC`,
      [tenantId]
    );
    return res.rows;
  });
}

export async function seedTenantWithAdmin({
  tenantId,
  slug,
  name,
  plan = 'starter',
  adminEmail,
  initialCredits = 5000,
}) {
  const tenant = await createTenant({
    tenantId,
    slug,
    name,
    plan,
    initialCredits,
  });

  const user = await createUser({
    email: adminEmail,
    authMode: 'token',
  });

  const membership = await createMembership({
    userId: user.user_id,
    tenantId: tenant.tenant_id,
    role: 'reseller_admin',
  });

  return {
    tenant,
    user,
    membership,
  };
}
