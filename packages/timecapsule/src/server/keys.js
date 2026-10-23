import crypto from 'crypto';
import { query, withSystemContext } from './db.js';

export const API_KEY_PREFIX = 'tcs_live_';
export const DEFAULT_SCOPES = Object.freeze([
  'generations:write',
  'generations:read',
  'models:read',
  'uploads:write',
]);
export const ALLOWED_SCOPES = new Set([
  'generations:write',
  'generations:read',
  'models:read',
  'uploads:write',
  '*',
]);

export function generateApiKeySecret() {
  return `${API_KEY_PREFIX}${crypto.randomBytes(24).toString('hex')}`;
}

export function hashApiKeySecret(secret) {
  if (!secret || typeof secret !== 'string') {
    throw new Error('Valid secret string is required for hashing');
  }
  return crypto.createHash('sha256').update(secret.trim(), 'utf8').digest('hex');
}

export function isCustomerApiKey(candidate) {
  return typeof candidate === 'string' && candidate.trim().startsWith(API_KEY_PREFIX);
}

/**
 * Creates a new customer developer API key.
 * The plaintext `secret_key` is returned ONCE and never stored on the server.
 */
export async function createCustomerApiKey({ tenantId, userId, name, scopes = DEFAULT_SCOPES }) {
  if (!tenantId || typeof tenantId !== 'string') {
    const err = new Error('tenantId is required');
    err.code = 'INVALID_TENANT_ID';
    err.statusCode = 400;
    throw err;
  }
  if (!userId || typeof userId !== 'string') {
    const err = new Error('userId is required');
    err.code = 'INVALID_USER_ID';
    err.statusCode = 400;
    throw err;
  }
  const cleanName = String(name || '').trim();
  if (!cleanName) {
    const err = new Error('name is required for API key');
    err.code = 'INVALID_KEY_NAME';
    err.statusCode = 400;
    throw err;
  }

  const rawScopes = Array.isArray(scopes) ? scopes : DEFAULT_SCOPES;
  const filteredScopes = rawScopes
    .map((s) => String(s).trim())
    .filter((s) => ALLOWED_SCOPES.has(s));
  const finalScopes = filteredScopes.length > 0 ? filteredScopes : [...DEFAULT_SCOPES];

  const secretKey = generateApiKeySecret();
  const keyHash = hashApiKeySecret(secretKey);
  const keyPrefix = `${secretKey.slice(0, 17)}...`;
  const keyId = `key_${crypto.randomBytes(12).toString('hex')}`;

  return withSystemContext(async (client) => {
    const res = await client.query(
      `INSERT INTO customer_api_keys (
         key_id, tenant_id, user_id, name, key_prefix, key_hash, scopes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING key_id, tenant_id, user_id, name, key_prefix, scopes, created_at`,
      [keyId, tenantId, userId, cleanName, keyPrefix, keyHash, JSON.stringify(finalScopes)]
    );

    const row = res.rows[0];
    return {
      key_id: row.key_id,
      tenant_id: row.tenant_id,
      user_id: row.user_id,
      name: row.name,
      key_prefix: row.key_prefix,
      scopes: row.scopes,
      created_at: new Date(row.created_at).toISOString(),
      secret_key: secretKey, // Only returned once on creation
    };
  });
}

/**
 * Lists all API keys for a tenant.
 * Never exposes the key hash or plaintext secret.
 */
export async function listCustomerApiKeys({ tenantId }) {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('tenantId is required');
  }

  const res = await withSystemContext(async (client) => {
    return client.query(
      `SELECT key_id, tenant_id, user_id, name, key_prefix, scopes, revoked_at, last_used_at, created_at
       FROM customer_api_keys
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );
  });

  return res.rows.map((row) => ({
    key_id: row.key_id,
    tenant_id: row.tenant_id,
    user_id: row.user_id,
    name: row.name,
    key_prefix: row.key_prefix,
    scopes: row.scopes,
    revoked_at: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    last_used_at: row.last_used_at ? new Date(row.last_used_at).toISOString() : null,
    created_at: new Date(row.created_at).toISOString(),
  }));
}

/**
 * Revokes an API key immediately.
 */
export async function revokeCustomerApiKey(keyId, { tenantId }) {
  if (!keyId || typeof keyId !== 'string') {
    const err = new Error('keyId is required');
    err.code = 'INVALID_KEY_ID';
    err.statusCode = 400;
    throw err;
  }

  return withSystemContext(async (client) => {
    const res = await client.query(
      `UPDATE customer_api_keys
       SET revoked_at = NOW(),
           updated_at = NOW()
       WHERE key_id = $1
         AND (tenant_id = $2 OR $2 IS NULL)
         AND revoked_at IS NULL
       RETURNING key_id, tenant_id, revoked_at`,
      [keyId, tenantId || null]
    );

    if (res.rowCount === 0) {
      const existing = await client.query(
        'SELECT key_id, revoked_at FROM customer_api_keys WHERE key_id = $1',
        [keyId]
      );
      if (existing.rowCount === 0) {
        const err = new Error(`API key not found: ${keyId}`);
        err.code = 'KEY_NOT_FOUND';
        err.statusCode = 404;
        throw err;
      }
      return { key_id: keyId, revoked: true, alreadyRevoked: true };
    }

    return {
      key_id: res.rows[0].key_id,
      tenant_id: res.rows[0].tenant_id,
      revoked_at: new Date(res.rows[0].revoked_at).toISOString(),
      revoked: true,
      alreadyRevoked: false,
    };
  });
}

/**
 * Authenticates an incoming Bearer token formatted as a customer API key (`tcs_live_...`).
 * Returns an authenticated session object or throws 401/403.
 */
export async function authenticateCustomerApiKey(rawKey) {
  if (!isCustomerApiKey(rawKey)) {
    return null;
  }

  const keyHash = hashApiKeySecret(rawKey);

  const res = await withSystemContext(async (client) => {
    return client.query(
      `SELECT k.key_id, k.tenant_id, k.user_id, k.name AS key_name, k.scopes, k.revoked_at,
              t.status AS tenant_status, u.status AS user_status, u.email, u.email_verified,
              m.role AS membership_role
       FROM customer_api_keys k
       JOIN tenants t ON t.tenant_id = k.tenant_id
       JOIN users u ON u.user_id = k.user_id
       LEFT JOIN memberships m ON m.tenant_id = k.tenant_id AND m.user_id = k.user_id
       WHERE k.key_hash = $1`,
      [keyHash]
    );
  });

  if (res.rowCount === 0) {
    const err = new Error('Invalid API key');
    err.code = 'INVALID_API_KEY';
    err.statusCode = 401;
    throw err;
  }

  const row = res.rows[0];

  if (row.revoked_at) {
    const err = new Error('API key has been revoked');
    err.code = 'API_KEY_REVOKED';
    err.statusCode = 401;
    throw err;
  }

  if (row.tenant_status === 'suspended' || row.tenant_status === 'killed') {
    const err = new Error(`Tenant is ${row.tenant_status}`);
    err.code = `TENANT_${row.tenant_status.toUpperCase()}`;
    err.statusCode = 403;
    throw err;
  }

  if (row.user_status !== 'active') {
    const err = new Error('User account is suspended');
    err.code = 'USER_SUSPENDED';
    err.statusCode = 403;
    throw err;
  }

  // Update last_used_at without blocking auth verification
  withSystemContext(async (client) => {
    await client.query(
      'UPDATE customer_api_keys SET last_used_at = NOW() WHERE key_id = $1',
      [row.key_id]
    );
  }).catch(() => {});

  const scopes = Array.isArray(row.scopes) ? row.scopes : [];

  return {
    user_id: row.user_id,
    tenant_id: row.tenant_id,
    role: row.membership_role || 'end_user',
    auth_mode: 'customer_api_key',
    key_id: row.key_id,
    key_name: row.key_name,
    scopes,
    email: row.email || null,
    email_verified: Boolean(row.email_verified),
    scope: 'tenant_scoped',
  };
}
