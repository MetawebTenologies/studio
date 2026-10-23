# Timecapsule Studio — Pre-Merge Architecture Reconciliation & Template Specification

**Document Version:** 1.0.0  
**Date:** 2026-10-23  
**Status:** Reviewed Architectural Baseline  
**Scope:** Architecture Reconciliation, Auth Seam Semantics, Operational Disclosures, and Corrected Template Registry Specification  

---

## 1. Authentication Seam & Identity Lifecycle

### 1.1 Multi-Tiered Verification Semantics
The platform separates authentication and session invalidation into three distinct architectural layers:

```
[Client Tier: Google Firebase SDK]
       │
       │ Bearer ID Token (RS256 JWT, 1-hour expiry)
       ▼
[Layer 1: Stateless Google JWKS Verification]
       │  • Signature verified against public Google JWKS certificates
       │  • Algorithm enforced: RS256
       │  • Expiration (exp) and issued-at (iat) validated (clock tolerance: 5s)
       │  • Audience (aud) MUST EXACTLY EQUAL configured Firebase Project ID
       │  • Issuer (iss) MUST EXACTLY EQUAL `https://securetoken.google.com/<projectId>`
       │  • Subject (sub) non-empty string representing Firebase UID
       ▼
[Layer 2: Timecapsule Backend-For-Frontend (BFF) Session]
       │  • Exchange route: POST /api/v1/session
       │  • User identity mapped strictly by `firebase_uid` (never by email alone)
       │  • Suspended users (`users.status !== 'active'`) immediately rejected with HTTP 403
       │  • Suspended tenants (`tenants.status !== 'active'`) immediately rejected with HTTP 403
       │  • Verified user granted HMAC-SHA256 `timecapsule_session` cookie
       ▼
[Layer 3: Internal Session Revocation & Governance]
          • Application session lifetime: 8 hours (`SESSION_MAX_AGE_SECONDS = 28800`)
          • Token version check: Every privileged request verifies `session.token_version === user.token_version`
          • Revocation latency: Evaluated on the immediate **next authorization check / HTTP request**
```

### 1.2 Upstream Revocation Limitations vs. Internal Invalidation
1. **Stateless JWKS Limitation:** Cryptographic signature verification via public JWKS confirms mathematical validity at signing time; it **does not** query Google's Identity Toolkit backend. Consequently, if a user is disabled or has their refresh tokens revoked in the Firebase Console, their existing 1-hour client JWT remains mathematically valid until its `exp` timestamp elapses.
2. **Internal Invalidation Authority:** All privileged operations (generation submission, file upload, credit reservation, asset deletion) are gated by the Timecapsule BFF session. Calling `revokeUserSessions(userId)` increments `users.token_version` in PostgreSQL. Active sessions presenting the old `token_version` fail closed on their next request.
3. **Suspended User Re-Exchange Prevention:** A user whose status is set to `'suspended'` in the database cannot obtain a new session token via `POST /api/v1/session`. The transaction verifies `user.status === 'active'` and `membership.tenant_status === 'active'` before signing any session payload.

### 1.3 Behavior for In-Flight Workloads and Active Streams
* **Active Server-Sent Events (SSE) Streams:** A persistent SSE connection to `/api/v1/generations/[jobId]/events` authenticates once during the initial HTTP upgrade handshake. If a user's session is revoked while an SSE connection is actively open, the open connection continues streaming terminal events for that specific `job_id` until completion or disconnect. Subsequent reconnections (or attempts to access other jobs) are rejected on the reconnect handshake.
* **Running Jobs:** If a tenant or user is suspended while a job is currently executing on an external provider:
  - Jobs already claimed and leased by an asynchronous worker execute to completion or failure to preserve provider contract consistency.
  - The worker lease loop checks `t.status = 'active'` prior to claiming queued jobs; pending jobs for suspended tenants are rejected and will not be claimed.

---

## 2. Release Truth & Operational Disclosures

### 2.1 Provider Verification Status
* **Status:** All integrated provider routes (`nano-banana-pro`, `nano-banana-pro-edit`, `seedance-pro-t2v`, `seedance-pro-i2v`, `veo3.1-fast-text-to-video`, `veo3.1-fast-image-to-video`) are classified as **`contract_tested`**.
* **Live Paid Evidence:** Zero live paid calls have been executed in production. Provider routes cannot be certified as "live production verified" until an authorized, single-call live test is conducted under approved operator credentials and recorded in `docs/compliance/provider_calls.md`.

### 2.2 Ambiguous Execution Outcomes & Settlement Safety
* **No Automatic Refunds on Ambiguous Outcomes:** If an asynchronous network drop, provider gateway timeout (HTTP 504), or process crash occurs after upstream submission has been dispatched but before a terminal result is received:
  - The job transitions to `reconciling_submission`.
  - Credits remain **held in reservation** and are **not automatically refunded**.
  - Automatic refunds during ambiguous states would introduce double-spend risk (user receiving completed media while reclaiming credits). Credits are settled only after deterministic reconciliation via provider polling or manual administrative reconciliation.

### 2.3 Deployment Boundary & CI Trigger Scope
* **Repository Evidence Scope:** Repository inspection confirms the absence of `.github/workflows`, `vercel.json`, and Netlify configuration files within the codebase.
* **Boundary Disclosure:** Repository inspection alone cannot prove the complete absence of external CI/CD mechanisms (e.g., external webhook listeners, remote cron tasks, or external cloud deployment monitors pointing at repository remotes).
* **Database Safety:** Deploying static preview builds to Firebase Hosting does not apply PostgreSQL migrations. Database schema migrations require deliberate, explicit execution of `npm run db:migrate`.

---

## 3. Corrected Two-Template Specification (Data-Driven Registry)

### 3.1 Scope & Active Underlying Route
* **Available Route:** Single active, tested, verified image route: `nano-banana-pro` (Text-to-Image / T2I), governed by pricing policy `tier_image_resolution_v1`.
* **Flux Status:** `flux-dev` is **not available** in the verified release catalog and is excluded from template bindings.

### 3.2 Template Profiles

#### Profile 1: Commercial Product Concept (`product-concept-pro`)
* **Category:** Product Visualization
* **Honest Scope:** Generates photorealistic 2D raster concept renders of packaged goods, bottles, and hardware from structured text descriptions. Does not generate 3D CAD geometry or perform background replacement on uploaded images.
* **Underlying Model Route:** `nano-banana-pro` (T2I).
* **Prompt Harness:**
  ```text
  Commercial studio product concept photography, {prompt}, centered composition, soft diffuse studio strobe lighting, clean commercial backdrop, f/4 aperture, crisp packaging typography, photorealistic 8k
  ```
* **Supported Parameters:** `aspect_ratio: "1:1" | "16:9" | "9:16"`, `resolution: "1k" | "2k"`.

#### Profile 2: Minimalist Brand Logo Concept (`brand-logo-concept`)
* **Category:** Brand Identity
* **Honest Scope:** Generates raster visual insignia concepts and graphic badges (JPEG/PNG) based on brand descriptors. Does not generate vector SVG paths, editable font layers, or guaranteed exclusive trademarks.
* **Underlying Model Route:** `nano-banana-pro` (T2I).
* **Prompt Harness:**
  ```text
  Minimalist brand insignia, flat graphic logo design for {prompt}, vector art aesthetic, clean bold geometric lines, high-contrast monochrome on solid white background, modern corporate iconography, zero clutter
  ```
* **Supported Parameters:** `aspect_ratio: "1:1"`, `resolution: "1k"`.

### 3.3 Database Schema Specification (Future Migration 012 — Proposed Only)
* **Tenant ID SQL Type:** The `tenants.tenant_id` column is **`TEXT`**, not `UUID`. Foreign key bindings adhere strictly to `TEXT REFERENCES tenants(tenant_id)`.
* **Model Validation:** Model bindings are enforced via application-level release-catalog validation; no SQL foreign key to `models` exists.

```sql
-- DRAFT SPECIFICATION ONLY — NOT APPLIED TO DATABASE
CREATE TABLE app_templates (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  tenant_id TEXT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE, -- NULL = Global System Template
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

-- Row-Level Security Rules:
-- 1. Ordinary tenant context can select published global templates OR their own private templates (any status)
CREATE POLICY rls_app_templates_tenant_select ON app_templates
  FOR SELECT TO timecapsule_tenant_role
  USING (
    (tenant_id IS NULL AND status = 'published')
    OR (tenant_id = current_setting('app.current_tenant_id', true))
  );

-- 2. System and administrator roles retain full access
CREATE POLICY rls_app_templates_system_all ON app_templates
  FOR ALL TO timecapsule_system_role
  USING (true) WITH CHECK (true);
```

### 3.4 Pricing Authority & Deep-Link Safety
1. **Pricing Authority:** The template record carries no independent billing authority. Credit reservations resolve dynamically via the model's pricing policy (`tier_image_resolution_v1`):
   - `1k` resolution: **15 credits**
   - `2k` resolution: **25 credits**
   - `4k` resolution: **40 credits**
2. **Deep-Link Execution Safety:** Deep-linking (`/studio?model=nano-banana-pro&preset={slug}`) populates client-side form controls only. It never triggers automatic job submission. User confirmation is mandatory.
3. **Job-Time Immutability:** When a job is initiated from a template, `/api/v1/generations` snapshots the resolved parameters and template version into `jobs.resolved_parameters` to protect against subsequent template edits.

---

## 4. Provider Permission Outreach Draft

* **Target Organization:** Vadoo Internet Services Private Limited (Operators of MuAPI.ai)
* **Verified Contact Channel:** `support@vadoo.tv` / Partner Inquiry via `muapi.ai`

```text
SUBJECT: Commercial Inquiry: Timecapsule Studio API Reseller & Partner Terms

Dear Vadoo Internet Services / MuAPI Leadership Team,

We are developing Timecapsule Studio (https://timecapsule-studio.web.app), a creative 
multimodal production workspace.

We are writing to explore formal commercial reseller and partner arrangements with MuAPI.

Specifically, we seek to establish:
1. Reseller & White-Label Terms: Permissibility of routing customer-initiated generative media 
   workloads through dedicated high-volume MuAPI accounts.
2. Supported Catalog Synchronization: Clarification on the supported, documented method 
   for programmatically retrieving active model schemas, capabilities, and pricing schedules.
3. Asynchronous SLAs: Ingress concurrency limits and webhook notification support for 
   long-running video generation pipelines (Veo 3.1, Kling 2.1, Seedance 2.5).

We respect your platform terms and wish to operate strictly within authorized commercial 
bounds prior to scaling production traffic. We welcome the opportunity to review partner terms.

Sincerely,
[Platform Owner Name]
Founder, Timecapsule Studio
```
