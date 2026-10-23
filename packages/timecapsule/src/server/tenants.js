import crypto from 'crypto';
import { query, withTransaction, withSystemContext, withTenantContext, assumeSystemRole } from './db.js';
import { validateBrandingAtWriteTime } from './brandingValidation.js';

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
  const validatedBranding = validateBrandingAtWriteTime(branding);

  return withTransaction(async (client) => {
    await assumeSystemRole(client);
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
        JSON.stringify(validatedBranding),
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
  return withSystemContext(async (client) => {
    const res = await client.query(
      `SELECT tenant_id, slug, name, plan, status, branding, legal, flags, spend_ceiling_credits, credits_balance, credits_reserved, created_at
       FROM tenants WHERE tenant_id = $1`,
      [tenantId]
    );
    return res.rows[0] || null;
  });
}

export async function getTenantBySlug(slug) {
  if (!slug) return null;
  const normalized = String(slug).toLowerCase().trim();
  return withSystemContext(async (client) => {
    const res = await client.query(
      `SELECT tenant_id, slug, name, plan, status, branding, legal, flags, spend_ceiling_credits, credits_balance, credits_reserved, created_at
       FROM tenants WHERE slug = $1`,
      [normalized]
    );
    return res.rows[0] || null;
  });
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
    const validatedBranding = validateBrandingAtWriteTime(updates.branding);
    fields.push(`branding = $${idx++}`);
    values.push(JSON.stringify(validatedBranding));
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

  return withSystemContext(async (client) => {
    const res = await client.query(
      `UPDATE tenants SET ${fields.join(', ')} WHERE tenant_id = $1
       RETURNING tenant_id, slug, name, plan, status, branding, legal, flags, spend_ceiling_credits, credits_balance, credits_reserved, updated_at`,
      values
    );
    return res.rows[0] || null;
  });
}

export async function createUser({
  userId,
  email,
  authMode = 'otp',
  status = 'active',
  emailVerified = false,
}) {
  const id = userId || `usr_${crypto.randomBytes(8).toString('hex')}`;
  const normalizedEmail = String(email).toLowerCase().trim();

  return withSystemContext(async (client) => {
    const res = await client.query(
      `INSERT INTO users (user_id, email, auth_mode, status, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET updated_at = NOW(), email_verified = EXCLUDED.email_verified
       RETURNING user_id, email, auth_mode, status, email_verified, created_at`,
      [id, normalizedEmail, authMode, status, Boolean(emailVerified)]
    );
    return res.rows[0];
  });
}

export async function getUser(userId) {
  if (!userId) return null;
  return withSystemContext(async (client) => {
    const res = await client.query(
      `SELECT user_id, email, firebase_uid, email_verified, auth_mode, status, token_version, created_at FROM users WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  });
}

export async function getUserByFirebaseUid(firebaseUid) {
  if (!firebaseUid) return null;
  return withSystemContext(async (client) => {
    const res = await client.query(
      `SELECT user_id, email, firebase_uid, email_verified, auth_mode, status, token_version, created_at FROM users WHERE firebase_uid = $1`,
      [firebaseUid]
    );
    return res.rows[0] || null;
  });
}

export async function revokeUserSessions(userId) {
  if (!userId) return null;
  return withSystemContext(async (client) => {
    const res = await client.query(
      `UPDATE users
       SET token_version = token_version + 1, updated_at = NOW()
       WHERE user_id = $1
       RETURNING user_id, token_version`,
      [userId]
    );
    return res.rows[0] || null;
  });
}

/**
 * Atomically resolves or provisions a Firebase-authenticated user, their isolated tenant,
 * and tenant membership in a single transaction with row locking and unique constraints.
 *
 * Guarantees:
 * - Never links accounts by email alone (prevents account takeover).
 * - New users get least-privileged tenant owner role ('reseller_admin') and ZERO starter credits.
 * - Concurrent first sign-ins cannot create duplicate tenants or duplicate users.
 */
export async function provisionFirebaseUserAndTenant({
  firebaseUid,
  email,
  emailVerified = false,
  name = null,
}) {
  if (!firebaseUid) {
    throw new Error('firebaseUid is required for Firebase user provisioning');
  }

  const normalizedEmail = email ? String(email).toLowerCase().trim() : null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await withTransaction(async (client) => {
        await assumeSystemRole(client);

        // 1. Look up existing user by firebase_uid with row lock
        const existingRes = await client.query(
          `SELECT user_id, email, firebase_uid, email_verified, auth_mode, status, token_version, created_at
           FROM users WHERE firebase_uid = $1 FOR UPDATE`,
          [firebaseUid]
        );

        let user = existingRes.rows[0] || null;

        if (user) {
          if (user.status !== 'active') {
            const err = new Error('User account is suspended');
            err.code = 'USER_SUSPENDED';
            err.statusCode = 403;
            throw err;
          }

          // Update email_verified if newly verified
          if (emailVerified && !user.email_verified) {
            await client.query(
              `UPDATE users SET email_verified = true, updated_at = NOW() WHERE user_id = $1`,
              [user.user_id]
            );
            user.email_verified = true;
          }

          // Fetch primary membership
          const memRes = await client.query(
            `SELECT m.membership_id, m.user_id, m.tenant_id, m.role, m.status, t.status as tenant_status
             FROM memberships m
             JOIN tenants t ON t.tenant_id = m.tenant_id
             WHERE m.user_id = $1 AND m.status = 'active'
             ORDER BY m.created_at ASC
             LIMIT 1`,
            [user.user_id]
          );

          const membership = memRes.rows[0] || null;
          if (!membership || membership.tenant_status !== 'active') {
            const err = new Error('No active tenant membership found for user');
            err.code = 'TENANT_NOT_FOUND';
            err.statusCode = 403;
            throw err;
          }

          return {
            user,
            membership,
            tenantId: membership.tenant_id,
            role: membership.role,
            isNewUser: false,
          };
        }

        // 2. User does not exist by firebase_uid.
        // Strict Guard: Never link accounts by email alone!
        if (normalizedEmail) {
          const emailCollision = await client.query(
            `SELECT user_id, firebase_uid FROM users WHERE email = $1 FOR UPDATE`,
            [normalizedEmail]
          );
          if (emailCollision.rows.length > 0) {
            const collision = emailCollision.rows[0];
            if (collision.firebase_uid && collision.firebase_uid !== firebaseUid) {
              const err = new Error(
                'An account with this email already exists under a different identity provider. Account linking by email alone is forbidden.'
              );
              err.code = 'ACCOUNT_COLLISION_EMAIL_LINK_FORBIDDEN';
              err.statusCode = 409;
              throw err;
            }
            if (!collision.firebase_uid) {
              const err = new Error(
                'An existing account exists with this email. Automatic account takeover/linking by email alone is forbidden.'
              );
              err.code = 'ACCOUNT_COLLISION_EMAIL_LINK_FORBIDDEN';
              err.statusCode = 409;
              throw err;
            }
          }
        }

        // 3. Provision new user, tenant, and membership atomically
        const newUserId = `usr_${crypto.randomBytes(8).toString('hex')}`;
        const newTenantId = `tnt_${crypto.randomBytes(8).toString('hex')}`;
        const newMembershipId = `mem_${crypto.randomBytes(8).toString('hex')}`;
        const safeEmail = normalizedEmail || `${firebaseUid.slice(0, 12)}@timecapsule.local`;
        const safeSlugBase = (safeEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'studio').slice(0, 20);
        const tenantSlug = `${safeSlugBase}-${crypto.randomBytes(2).toString('hex')}`;
        const tenantName = name || `${safeSlugBase} Studio`;

        // Insert Tenant: NO starter credits (credits_balance = 0, credits_reserved = 0)
        await client.query(
          `INSERT INTO tenants (tenant_id, slug, name, plan, status, credits_balance, credits_reserved)
           VALUES ($1, $2, $3, 'starter', 'active', 0, 0)`,
          [newTenantId, tenantSlug, tenantName]
        );

        // Insert User: least-privileged, token_version = 1
        const userRes = await client.query(
          `INSERT INTO users (user_id, email, firebase_uid, email_verified, auth_mode, status, token_version)
           VALUES ($1, $2, $3, $4, 'firebase', 'active', 1)
           RETURNING user_id, email, firebase_uid, email_verified, auth_mode, status, token_version, created_at`,
          [newUserId, safeEmail, firebaseUid, Boolean(emailVerified)]
        );
        const newUser = userRes.rows[0];

        // Insert Membership: least-privileged tenant owner ('reseller_admin')
        const memRes = await client.query(
          `INSERT INTO memberships (membership_id, user_id, tenant_id, role, status)
           VALUES ($1, $2, $3, 'reseller_admin', 'active')
           RETURNING membership_id, user_id, tenant_id, role, status, created_at`,
          [newMembershipId, newUserId, newTenantId]
        );
        const newMembership = memRes.rows[0];

        return {
          user: newUser,
          membership: newMembership,
          tenantId: newTenantId,
          role: 'reseller_admin',
          isNewUser: true,
        };
      });
    } catch (err) {
      if (err.code === '23505' && attempt < 2) {
        // Unique violation from concurrent first sign-in race: retry so row-lock query finds it
        await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

export async function getUserByEmail(email) {
  if (!email) return null;
  const normalized = String(email).toLowerCase().trim();
  return withSystemContext(async (client) => {
    const res = await client.query(
      `SELECT user_id, email, auth_mode, status, created_at FROM users WHERE email = $1`,
      [normalized]
    );
    return res.rows[0] || null;
  });
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
