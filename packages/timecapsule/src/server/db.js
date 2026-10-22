import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

export const MAX_CREDIT_UNITS = 1_000_000_000_000; // 10^12 (< Number.MAX_SAFE_INTEGER)

let activePool = null;
let activePoolUrl = null;

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || typeof url !== 'string' || !url.trim()) {
    const err = new Error(
      'DATABASE_URL is not configured. Timecapsule requires PostgreSQL and refuses to fall back to in-memory or file storage.'
    );
    err.code = 'DATABASE_NOT_CONFIGURED';
    err.status = 503;
    err.statusCode = 503;
    throw err;
  }
  return url.trim();
}

const FORBIDDEN_TEST_DB_NAMES = new Set([
  'timecapsule',
  'timecapsule_prod',
  'timecapsule_production',
  'timecapsule_dev',
  'postgres',
  'template0',
  'template1',
]);

/**
 * Verifies that destructive test operations (such as TRUNCATE in resetStoreForTests)
 * only execute against an explicitly designated disposable *_test database and
 * refuse to run against the application database (`timecapsule`) or without
 * `TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB=1`.
 */
export function assertDisposableTestDatabase(connectionString = null) {
  if (process.env.NODE_ENV === 'production') {
    const err = new Error('Destructive test database operations are forbidden in production');
    err.code = 'DESTRUCTIVE_TEST_DB_FORBIDDEN';
    err.statusCode = 403;
    throw err;
  }

  if (process.env.TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB !== '1') {
    const err = new Error(
      'Destructive test database operations require TIMECAPSULE_ALLOW_DESTRUCTIVE_TEST_DB=1'
    );
    err.code = 'DESTRUCTIVE_TEST_DB_NOT_DESIGNATED';
    err.statusCode = 403;
    throw err;
  }

  const rawUrl = connectionString || getDatabaseUrl();
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    const err = new Error('Invalid DATABASE_URL for disposable test database check');
    err.code = 'DESTRUCTIVE_TEST_DB_INVALID_URL';
    err.statusCode = 400;
    throw err;
  }

  const dbName = decodeURIComponent((parsed.pathname || '').replace(/^\/+/, '')).trim();
  if (
    !dbName ||
    FORBIDDEN_TEST_DB_NAMES.has(dbName.toLowerCase()) ||
    !dbName.toLowerCase().endsWith('_test')
  ) {
    const err = new Error(
      `Refusing to run destructive test operation against database "${dbName || '<empty>'}". Destructive tests require an explicitly designated disposable *_test database (e.g., timecapsule_test) and refuse to run against the application database.`
    );
    err.code = 'NON_DISPOSABLE_DATABASE_REFUSED';
    err.statusCode = 403;
    throw err;
  }

  return dbName;
}

export function getPool() {
  const url = getDatabaseUrl();
  if (activePool && activePoolUrl === url) {
    return activePool;
  }
  if (activePool && activePoolUrl !== url) {
    activePool.end().catch(() => {});
    activePool = null;
  }
  activePoolUrl = url;
  activePool = new Pool({
    connectionString: url,
    max: Number(process.env.PG_POOL_MAX || 20),
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 3000),
    idleTimeoutMillis: 10000,
  });
  activePool.on('error', () => {
    // Prevent unhandled pool idle client errors from crashing process
  });
  return activePool;
}

export async function closePool() {
  if (activePool) {
    const p = activePool;
    activePool = null;
    activePoolUrl = null;
    await p.end().catch(() => {});
  }
}

export function normalizeDatabaseError(err) {
  if (!err) return err;
  if (err.code === 'DATABASE_NOT_CONFIGURED' || err.statusCode) {
    return err;
  }
  const connectionCodes = new Set([
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    'EHOSTUNREACH',
    '57P01',
    '57P02',
    '57P03',
    '08000',
    '08001',
    '08003',
    '08004',
    '08006',
    '3D000',
    '28P01',
  ]);
  const msg = String(err.message || '');
  if (
    connectionCodes.has(err.code) ||
    msg.includes('connect ECONNREFUSED') ||
    msg.includes('Connection terminated') ||
    msg.includes('timeout expired') ||
    msg.includes('does not exist')
  ) {
    const wrapped = new Error(`PostgreSQL database is unavailable: ${msg}`);
    wrapped.code = 'DATABASE_UNAVAILABLE';
    wrapped.status = 503;
    wrapped.statusCode = 503;
    wrapped.cause = err;
    return wrapped;
  }
  return err;
}

export async function query(text, params = []) {
  const pool = getPool();
  try {
    return await pool.query(text, params);
  } catch (err) {
    throw normalizeDatabaseError(err);
  }
}

export async function withTransaction(fn) {
  const pool = getPool();
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    throw normalizeDatabaseError(err);
  }

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback failure on dead connection
    }
    throw normalizeDatabaseError(err);
  } finally {
    client.release();
  }
}

/**
 * Sets the PostgreSQL session variable `app.tenant_id` for GUC-based Row Level Security isolation.
 */
export async function withTenantContext(client, tenantId, callback) {
  if (!tenantId) {
    throw new Error('tenantId is required for withTenantContext');
  }
  await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
  return await callback(client);
}

export function parseSafeCreditBigInt(raw, fieldName = 'credit_amount') {
  if (raw === null || raw === undefined) return 0;
  let bi;
  try {
    bi = BigInt(String(raw));
  } catch {
    const err = new Error(`Invalid BIGINT value for ${fieldName}: ${String(raw)}`);
    err.code = 'INVALID_CREDIT_AMOUNT';
    err.status = 500;
    err.statusCode = 500;
    throw err;
  }
  if (bi < 0n || bi > BigInt(MAX_CREDIT_UNITS)) {
    const err = new Error(
      `Credit value out of bounds for ${fieldName}: ${bi.toString()} (allowed 0..${MAX_CREDIT_UNITS})`
    );
    err.code = 'CREDIT_BOUNDS_EXCEEDED';
    err.status = 500;
    err.statusCode = 500;
    throw err;
  }
  const num = Number(bi);
  if (!Number.isSafeInteger(num)) {
    const err = new Error(`Unsafe integer conversion for ${fieldName}`);
    err.code = 'UNSAFE_CREDIT_INTEGER';
    err.status = 500;
    err.statusCode = 500;
    throw err;
  }
  return num;
}

export function assertValidCreditUnits(value, { allowZero = false, fieldName = 'amount' } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    const err = new Error(`${fieldName} must be a finite integer credit unit`);
    err.code = 'INVALID_CREDIT_AMOUNT';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }
  const min = allowZero ? 0 : 1;
  if (value < min || value > MAX_CREDIT_UNITS) {
    const err = new Error(
      `${fieldName} must be an integer between ${min} and ${MAX_CREDIT_UNITS} (got ${value})`
    );
    err.code = 'INVALID_CREDIT_AMOUNT';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }
  return value;
}

export async function runMigrations() {
  return withTransaction(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const appliedRes = await client.query(
      'SELECT version, filename, checksum, applied_at FROM schema_migrations ORDER BY version ASC'
    );
    const appliedMap = new Map(appliedRes.rows.map((r) => [r.version, r]));
    const newlyApplied = [];

    for (const filename of files) {
      const version = filename.split('_')[0];
      const fullPath = path.join(MIGRATIONS_DIR, filename);
      const sql = fs.readFileSync(fullPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sql, 'utf8').digest('hex');

      const existing = appliedMap.get(version);
      if (existing) {
        if (existing.checksum !== checksum) {
          const err = new Error(
            `Migration checksum mismatch for version ${version} (${filename}): expected ${existing.checksum}, found ${checksum}`
          );
          err.code = 'MIGRATION_CHECKSUM_MISMATCH';
          throw err;
        }
        continue;
      }

      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (version, filename, checksum) VALUES ($1, $2, $3)',
        [version, filename, checksum]
      );
      newlyApplied.push({ version, filename, checksum });
    }

    return {
      totalMigrations: files.length,
      newlyApplied,
    };
  });
}

export async function getMigrationStatus() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const tableExistsRes = await query(`
    SELECT to_regclass('public.schema_migrations') AS reg
  `);
  const appliedMap = new Map();
  if (tableExistsRes.rows[0]?.reg) {
    const res = await query(
      'SELECT version, filename, checksum, applied_at FROM schema_migrations ORDER BY version ASC'
    );
    for (const row of res.rows) {
      appliedMap.set(row.version, row);
    }
  }

  return files.map((filename) => {
    const version = filename.split('_')[0];
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
    const checksum = crypto.createHash('sha256').update(sql, 'utf8').digest('hex');
    const applied = appliedMap.get(version);
    return {
      version,
      filename,
      checksum,
      applied: Boolean(applied),
      applied_at: applied?.applied_at || null,
      checksum_match: applied ? applied.checksum === checksum : null,
    };
  });
}

/**
 * Explicit, idempotent development seed helper.
 * Never called automatically on application boot.
 */
export async function seedDevelopmentTenant({
  tenantId = 'org_preview_default',
  targetCredits = 5000,
} = {}) {
  const validatedTarget = assertValidCreditUnits(targetCredits, {
    allowZero: true,
    fieldName: 'targetCredits',
  });

  return withTransaction(async (client) => {
    await client.query(
      `INSERT INTO tenants (tenant_id, credits_balance, credits_reserved)
       VALUES ($1, 0, 0)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenantId]
    );

    const lockedRes = await client.query(
      `SELECT tenant_id, credits_balance, credits_reserved
       FROM tenants
       WHERE tenant_id = $1
       FOR UPDATE`,
      [tenantId]
    );
    const row = lockedRes.rows[0];
    const currentBalance = parseSafeCreditBigInt(row.credits_balance, 'credits_balance');
    const currentReserved = parseSafeCreditBigInt(row.credits_reserved, 'credits_reserved');
    const currentAvailable = currentBalance - currentReserved;

    if (currentAvailable >= validatedTarget) {
      return {
        tenant_id: tenantId,
        seeded_delta: 0,
        credits_balance: currentBalance,
        credits_reserved: currentReserved,
        available_credits: currentAvailable,
      };
    }

    const delta = validatedTarget - currentAvailable;
    const newBalance = currentBalance + delta;

    await client.query(
      `UPDATE tenants
       SET credits_balance = $2, updated_at = NOW()
       WHERE tenant_id = $1`,
      [tenantId, newBalance]
    );

    const entryId = `led_seed_${crypto.randomBytes(8).toString('hex')}`;
    await client.query(
      `INSERT INTO credit_ledger (
         entry_id, tenant_id, job_id, entry_type, amount, balance_after, reserved_after, metadata_json
       ) VALUES ($1, $2, NULL, 'grant', $3, $4, $5, $6::jsonb)`,
      [
        entryId,
        tenantId,
        delta,
        newBalance,
        currentReserved,
        JSON.stringify({ reason: 'explicit_development_seed' }),
      ]
    );

    return {
      tenant_id: tenantId,
      seeded_delta: delta,
      credits_balance: newBalance,
      credits_reserved: currentReserved,
      available_credits: newBalance - currentReserved,
    };
  });
}
