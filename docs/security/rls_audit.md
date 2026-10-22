# Row-Level Security (RLS) Runtime Audit & Query Path Classification

**Document Version:** 1.0.0  
**Date:** 2026-10-22  
**Branch:** `feat/marketplace-fidelity-f1f5`  
**Reference Approval:** Timecapsule Option A Approval (Condition 1)

---

## 1. Executive Summary & Runtime Connection Role

In PostgreSQL, Row Level Security (RLS) does **not** restrict table owners or superusers unless `FORCE ROW LEVEL SECURITY` is explicitly declared on each table (`ALTER TABLE <table> FORCE ROW LEVEL SECURITY;`).

### Runtime Connection Analysis
- **Runtime Connection Role:** The application pool (`packages/timecapsule/src/server/db.js`) connects to PostgreSQL using the credentials specified in `DATABASE_URL` (typically `timecapsule` or the local cluster owner).
- **Vulnerability Closed:** Without `FORCE ROW LEVEL SECURITY`, if `DATABASE_URL` connects as the table owner, RLS policies are silently ignored by the database engine, meaning tenant isolation would rely purely on application-level `WHERE tenant_id = $1` filters.
- **Remediation in Migration 006 (`006_force_rls.sql`):**
  1. `FORCE ROW LEVEL SECURITY` applied across all 6 tenant-scoped tables: `jobs`, `assets`, `credit_reservations`, `credit_ledger`, `idempotency_keys`, `memberships`.
  2. Dual-policy architecture separating tenant-scoped roles (`timecapsule_tenant_role`) from system actors (`app.is_system_actor = 'true'`).
  3. Integration test in `tests/tenancy.test.mjs` verifying that background workers claim and complete jobs across tenants under RLS without row starvation.

---

## 2. Table-by-Table RLS Policy Configuration

| Table | RLS Enabled | FORCE RLS | Tenant Role Policy (`timecapsule_tenant_role`) | System Actor Policy (`PUBLIC`) |
|---|---|---|---|---|
| `jobs` | Yes | **Yes** | `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')` | `current_user != 'timecapsule_tenant_role' AND (current_setting('app.is_system_actor', true) = 'true' OR ...)` |
| `assets` | Yes | **Yes** | `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')` | Same as above |
| `credit_reservations` | Yes | **Yes** | `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')` | Same as above |
| `credit_ledger` | Yes | **Yes** | `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')` | Same as above |
| `idempotency_keys` | Yes | **Yes** | `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')` | Same as above |
| `memberships` | Yes | **Yes** | `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')` | Same as above |

---

## 3. Query Path Classification & Audit

Every database access across the 6 RLS tables is classified into **Tenant-Scoped** (user/client initiated) vs **System-Actor** (worker, reconciler, admin).

### 3.1 `jobs` Table
| File & Function | Operation | Scope / Role | GUC Mechanism |
|---|---|---|---|
| `store.js:createSubmissionTransaction` | `INSERT INTO jobs` | Tenant-Scoped | `withTenantContext(client, tenantId, ...)` |
| `store.js:getJob` / `auth.js:authorizeJobAccess` | `SELECT * FROM jobs WHERE job_id = $1` | Tenant-Scoped | Filtered by tenant or system actor |
| `store.js:listJobs` | `SELECT * FROM jobs WHERE tenant_id = $1` | Tenant-Scoped | `app.tenant_id` enforced |
| `store.js:claimNextRunnableJob` | `SELECT ... FROM jobs ... FOR UPDATE SKIP LOCKED` | **System-Actor** | `app.is_system_actor = 'true'` |
| `store.js:heartbeatJobLease` | `UPDATE jobs SET lease_expires_at = ...` | **System-Actor** | Worker updates lease under active lock |
| `store.js:beginProviderSubmissionAttempt` | `UPDATE jobs SET submission_state = 'submitting'` | **System-Actor** | Worker updating state |
| `store.js:recordProviderTaskId` | `UPDATE jobs SET provider_job_id = ...` | **System-Actor** | Worker updating task id |
| `store.js:recordJobSucceededTransaction` | `UPDATE jobs SET status = 'succeeded'` | **System-Actor** | `app.is_system_actor = 'true'` |
| `store.js:recordJobFailedTransaction` | `UPDATE jobs SET status = 'failed'` | **System-Actor** | `app.is_system_actor = 'true'` |
| `store.js:reconcileSubmissionUnknown` | `UPDATE jobs ...` | **System-Actor** | Admin / Operator reconciliation |

### 3.2 `assets` Table
| File & Function | Operation | Scope / Role | GUC Mechanism |
|---|---|---|---|
| `store.js:registerAsset` | `INSERT INTO assets` | Tenant-Scoped | Scoped to `tenant_id` |
| `store.js:getAsset` | `SELECT * FROM assets WHERE asset_id = $1` | Tenant-Scoped | Verified against session `tenant_id` |
| `store.js:recordJobSucceededTransaction` | `INSERT INTO assets` | **System-Actor** | `app.is_system_actor = 'true'` registers output media |

### 3.3 `credit_reservations` Table
| File & Function | Operation | Scope / Role | GUC Mechanism |
|---|---|---|---|
| `store.js:createSubmissionTransaction` | `INSERT INTO credit_reservations` | Tenant-Scoped | `tenant_id = $1` |
| `store.js:recordJobSucceededTransaction` | `UPDATE credit_reservations SET status = 'settled'` | **System-Actor** | `app.is_system_actor = 'true'` |
| `store.js:recordJobFailedTransaction` | `UPDATE credit_reservations SET status = 'released'` | **System-Actor** | `app.is_system_actor = 'true'` |

### 3.4 `credit_ledger` Table
| File & Function | Operation | Scope / Role | GUC Mechanism |
|---|---|---|---|
| `store.js:createSubmissionTransaction` | `INSERT INTO credit_ledger (reserve)` | Tenant-Scoped | `tenant_id = $1` |
| `store.js:recordJobSucceededTransaction` | `INSERT INTO credit_ledger (settle)` | **System-Actor** | `app.is_system_actor = 'true'` |
| `store.js:recordJobFailedTransaction` | `INSERT INTO credit_ledger (release)` | **System-Actor** | `app.is_system_actor = 'true'` |
| `tenants.js:seedDevelopmentTenant` | `INSERT INTO credit_ledger (grant)` | **System-Actor** | Admin seed operation |

### 3.5 `idempotency_keys` Table
| File & Function | Operation | Scope / Role | GUC Mechanism |
|---|---|---|---|
| `store.js:createSubmissionTransaction` | `SELECT ... FROM idempotency_keys` | Tenant-Scoped | Scoped to `tenant_id` |
| `store.js:createSubmissionTransaction` | `INSERT INTO idempotency_keys` | Tenant-Scoped | Scoped to `tenant_id` |

### 3.6 `memberships` Table
| File & Function | Operation | Scope / Role | GUC Mechanism |
|---|---|---|---|
| `tenants.js:createMembership` | `INSERT INTO memberships` | Tenant-Scoped / Admin | Scoped to `tenant_id` |
| `tenants.js:getMembership` | `SELECT * FROM memberships` | Tenant-Scoped | Scoped to `tenant_id` |
| `tenants.js:listMembershipsForTenant` | `SELECT * FROM memberships WHERE tenant_id = $1` | Tenant-Scoped | Scoped to `tenant_id` |

---

## 4. Verification & Integration Testing

In `tests/tenancy.test.mjs`:
- **`Condition 1 Integration: Worker claims and executes jobs under Row Level Security without starvation`**:
  - Seeds a queued job for Tenant A.
  - Verifies RLS is `relrowsecurity = true` AND `relforcerowsecurity = true` across all 6 tables.
  - Executes the actual worker loop (`claimNextRunnableJob` + `executeClaimedJob`).
  - Confirms worker is NOT starved by RLS and cleanly claims and transitions the job to `succeeded`.
  - Verifies asset creation and credit settlement succeed.
  - Verifies that under `timecapsule_tenant_role`, Tenant A sees its job/asset while Tenant B sees 0 rows for Tenant A.
