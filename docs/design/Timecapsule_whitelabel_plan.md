Created At: 2026-10-22T18:10:05+05:30
Completed At: 2026-10-22T18:10:05+05:30
Showing lines 1-225 of 225
1: # TIMECAPSULE — WHITE-LABEL ENGINE: FEASIBILITY, ARCHITECTURE & EXECUTION PLAN
2: 
3: **Prepared as:** Principal Engineer & System Architect review — 2026-10-22
4: **Scope:** Owner question — "muapi.ai/docs/white-label — is it a good business model to keep, how hard is it to build, and how do we capture general users who want to launch an AI business?"
5: **Source of truth:** live muapi.ai/docs/white-label (fetched 2026-10-22) + Timecapsule monorepo state at `remediation/checkpoint-3` (tip `825a872`)
6: **Verdict up front:** ✅ **BUILD IT — this is the single best product decision available to Timecapsule.** Hardship = **MEDIUM (≈8–10 weeks to full parity, sellable MVP at week 4–5)**. Nothing in muapi's offering requires technology you don't already have; it requires *generalizing* what you have from n=1 to n>1 tenants.
7: 
8: ---
9: 
10: ## 0. EXECUTIVE VERDICT (read this if nothing else)
11: 
12: 1. **The business model is sound and proven.** muapi prices it at $49 / $149 / $499 per month for hosting branded AI studios. You are building the same engine on the same codebase family — with one structural advantage they don't advertise: **your core is self-hostable and multi-provider (Muapi + Kie fallback), so your COGS floor is lower and your pitch ("own your stack") is stronger.**
13: 2. **You are not building a new product — you are parameterizing the one you have.** Timecapsule itself is white-label instance #1. The clone-sprint theme-token work (`theme.muapi.css` → `theme.timecapsule.css`) already IS the white-label branding substrate; the sprint must elevate those tokens from *files* to *runtime data*.
14: 3. **≈60% of muapi's feature list is Easy/Medium for your codebase** because `packages/timecapsule` (PG queue, credit ledger, provider adapters) is already tenant-agnostic and `branding.js` already exists.
15: 4. **Only 3 genuinely hard parts:** (a) auth/org retrofit, (b) checkout on the *reseller's own* Stripe account, (c) custom-domain TLS automation. Each has a staged answer below; none is a blocker.
16: 5. **One survival-critical feature muapi does not advertise:** per-tenant spend ceilings, kill switch, and moderation hooks. When a reseller's end-users burn YOUR provider keys, YOU inherit the provider-ToS liability. Budget for it in W2, not "later".
17: 
18: ---
19: 
20: ## 1. WHAT MUAPI SHIPS (verified 2026-10-22) → TIMECAPSULE PARITY MATRIX
21: 
22: muapi's white-label = **a hosted, branded AI studio your resellers' end users sign up on and generate content in**, with the reseller controlling branding, catalog, pricing, domain, email, and end-user admin — while running on muapi's infrastructure and muapi's provider keys.
23: 
24: | # | Feature (muapi) | muapi detail | TC hardship | Est. | Where it lands in TC |
25: |---|---|---|---|---|---|
26: | 1 | Hosted branded app | no infra for reseller | — (you ARE the host) | — | platform itself |
27: | 2 | Logo / favicon / app name / primary color | dashboard-set, applies across app + custom domain | **EASY** | 1–2 d | `tenants.branding` JSON → runtime CSS vars + `<head>` injection; extends existing `branding.js` |
28: | 3 | Studio toggles | enable per-studio (Image, Video, Audio, AI Clipping, Vibe Motion, Lip Sync, Cinema, Marketing, Workflows, Agents, Design Agent, Apps, MCP & CLI) | **EASY** | 2–3 d | catalog registry already has release states → `tenant_studios` allowlist gate at route level (same mechanism as §catalog release states) |
29: | 4 | End-user credit markup | multiplier over muapi cost (e.g. 2.0 = reseller keeps margin) | **MEDIUM** | 2–3 d | `tenant_price_sheets` (multiplier per category or per model) applied at enqueue time in PG ledger |
30: | 5 | Free credits on signup | per-reseller configured grant | **EASY** | 0.5 d | ledger grant function (exists conceptually) + `tenants.free_credits` |
31: | 6 | Reseller's OWN Stripe checkout | **no Stripe Connect** — checkout sessions created in tenant's Stripe acct; muapi never touches funds | **HARD** | 5–8 d | staged: W4 = platform Stripe; W6+ = per-tenant key custody (see §4.2) |
32: | 7 | Custom domain + auto SSL | TXT verify → CNAME → auto-provisioned cert | **HARD** | 5–8 d | Caddy automatic HTTPS + host-based routing + DNS TXT verify job (see §4.3) |
33: | 8 | Sandbox mode | every generation returns an instant sample, zero credits charged | **EASY–MED** | 1–2 d | mock provider adapter (adapter pattern already exists) — flag `tenants.sandbox` |
34: | 9 | End-user management | view balances, adjust with reason, ban/unban | **MEDIUM** | 3–4 d | reseller admin console; **depends on auth (W0)** |
35: | 10 | Custom email sender | reseller's own SMTP for verification / password reset | **MEDIUM** | 1–2 d | per-tenant SMTP config in `tenant_settings`; deliverability = real risk, see §8 |
36: | 11 | ToS / Privacy links on sign-in | "By continuing you agree to…" | **TRIVIAL** | 0.5 d | `tenant_settings.legal` → auth footer |
37: | 12 | Platform plans (for resellers) | $49 Starter (100 users, Image+Video) · $149 Growth (1,000, all studios) · $499 Scale (unlimited) | **MEDIUM** | 3–4 d | platform billing in W4 (Stripe); plan limits enforced as `tenants.plan_limits` |
38: | 13 | Slug URL default | `muapi.ai/studio/your-slug` before custom domain | **EASY** | 1 d | `/s/[slug]/*` tenant route prefix + `slug.timecapsule.ai` wildcard subdomain |
39: | 14 | — (muapi does NOT ship) | per-tenant spend caps / kill switch / moderation | **(MEDIUM — you must add)** | 3 d | `tenants.spend_ceiling`, `tenants.status='killed'`, moderation hook before enqueue — survival feature, see §0.5 |
40: 
41: **Total to full parity:** ≈ 8–10 engineering weeks (one senior full-stack dev + agent assistance). **MVP cut line:** after W3 (features 1–5, 8, 11, 13, 14) — that is a sellable "Growth-equivalent" product *without* custom domains and *without* own-Stripe, at ≈ week 4–5.
42: 
43: ---
44: 
45: ## 2. CURRENT ASSET INVENTORY → WHAT WHITE-LABEL REQUIRES
46: 
47: ### 2.1 What you already have (at `remediation/checkpoint-3`)
48: 
49: | Asset | State | White-label role |
50: |---|---|---|
51: | `packages/timecapsule` — PG **queue** (submit-then-poll, 6 invariants) | built, tested | tenant-scoped with one `tenant_id` column |
52: | `packages/timecapsule` — PG **credit ledger** | built, tested | add price sheets + per-tenant grants; ledger already prices per job |
53: | `packages/timecapsule` — **provider adapters** (Muapi, Kie) + `branding.js` | built | adapter pattern → sandbox/mock adapter is trivial; `branding.js` generalizes to tenant config |
54: | `packages/studio` — shared UI (Image/Video/Cinema/LipSync) | built | studio toggles = route-level gating of this catalog |
55: | Next.js app router + Tailwind v4 | built | tenant-aware layout (theme vars from DB, not files) |
56: | Clone-sprint **theme token layer** | in progress (R0–R6) | **the white-label substrate** — must ship as runtime data, §2.2 |
57: | Auth | **name+PIN line deleted** — proper auth NOT yet built | ⚠️ W0 prerequisite for everything |
58: | Billing | none | W4 |
59: | Org/tenant concept | none | W0 |
60: | Domain automation | none | W5 |
61: 
62: ### 2.2 The critical architecture note (do this or white-label becomes a fork)
63: 
64: The clone sprint is introducing `theme.muapi.css` (reference values) and `theme.timecapsule.css` (override file). That is white-label for **n=1 done as files**. For n>1:
65: 
66: > **Elevate the token layer from files to data.** Keep `theme.muapi.css` as the compiled reference. Define the token *contract* (≈40–60 custom properties: `--bg`, `--surface`, `--accent`, `--radius`, font stack, …) and inject per-tenant values at runtime from `tenants.branding` JSON via a `<style>` block / `html` data-attributes in the root layout. `theme.timecapsule.css` then becomes simply the *default tenant's row in the database*.
67: >
68: > Rule to enforce in code review: **"Every hard-coded brand value in the main app is a white-label bug."** The FIDELITY CONTRACT (ghost-overlay ≤2px) stays intact — tenant theming changes token *values*, never token *consumption sites*.
69: 
70: ### 2.3 Target tenancy model (decisions locked here, not negotiated per-PR)
71: 
72: | Decision | Choice | Rationale |
73: |---|---|---|
74: | Tenant isolation | **single PG database, `tenants` table, `tenant_id` FK on every user-visible table + Postgres RLS as defense-in-depth** | schema-per-tenant / db-per-tenant is an ops trap at your scale; RLS makes a missed `WHERE` non-fatal |
75: | Routing | MVP: **path** `/s/[slug]/*` + **wildcard subdomain** `slug.timecapsule.ai`; custom domain (W5) for paying tiers | path+subdomain costs ≈1 day; custom domain is the only piece needing infra work |
76: | Identity | email OTP (+ password later), sessions via signed HTTP-only cookie; **one `users` table + `memberships` (user, tenant, role)** | you already deleted name+PIN; auth is a prerequisite for the main platform anyway — build it ONCE, tenant-aware |
77: | Roles | `platform_admin` / `reseller_admin` / `end_user` | reseller admin = the white-label dashboard persona |
78: | Money flow | **Stage A (MVP):** reseller pays platform subscription; end-users pay reseller *out-of-band* (reseller tops up wholesale credits). **Stage B (W4):** platform-held Stripe checkout, margin owed to reseller tracked in ledger, monthly payout. **Stage C (optional, Scale tier):** reseller's own Stripe keys (muapi's exact approach) | A needs no Stripe work at all; B is 3–4 days; C is 5–8 days of key-custody + per-tenant webhook plumbing — defer until a paying customer demands it |
79: | Catalog gating | per-tenant catalog = `platform_catalog ∩ tenant_studios.enabled`, then price-sheet markup | reuses route-level release-catalog mechanism from the review |
80: | Sandbox | adapter-level mock provider (`provider=mock`) returning canned samples instantly | zero cost when flag on; also serves as dev/test fixture — double duty |
81: 
82: ---
83: 
84: ## 3. SCHEMA SKETCH (W0 + W2 deliverable)
85: 
86: ```sql
87: -- W0
88: tenants            (id, slug, status['active'|'suspended'|'killed'], plan,
89:                     branding jsonb,        -- name, logo_url, favicon_url, primary_color, radius, font
90:                     legal jsonb,           -- tos_url, privacy_url
91:                     flags jsonb,           -- sandbox, email_sender cfg, limits
92:                     spend_ceiling_credits, created_at)
93: users              (id, email, password_hash|otp_only, status, created_at)
94: memberships        (user_id, tenant_id, role['reseller_admin'|'end_user'], status)
95: 
96: -- W2
97: tenant_studios     (tenant_id, studio_key, enabled)              -- toggles
98: tenant_price_sheets(tenant_id, scope['studio'|'model'], key,
99:                     markup numeric,                              -- e.g. 2.0
100:                     unit_override_credits)                       -- optional absolute price
101: ledger             (…, tenant_id, reseller_cost_credits, end_user_price_credits)
102:                     -- store BOTH: your COGS and their price → margin report for free
103: 
104: -- W4/W5
105: platform_subscriptions (tenant_id, stripe_customer_id, plan, status)
106: tenant_domains     (tenant_id, domain, txt_token, verified_at, cert_state)
107: tenant_stripe      (tenant_id, acct_id, key_cipher, webhook_secret, created_at)  -- Stage C only
108: audit_log          (tenant_id, actor_id, action, subject, reason, at)  -- balance adjust w/ reason, ban, kill switch
109: ```
110: 
111: ---
112: 
113: ## 4. THE THREE HARD PROBLEMS & THE CHOSEN ANSWERS
114: 
115: ### 4.1 Auth/org retrofit (W0 — hardest prerequisite, not hard tech)
116: The remediation deleted the unsafe name+PIN line, so there is no auth to fight — only auth to build. Build it **tenant-aware from day one**: every session carries `tenant_id` + `role`; every BFF route resolves tenant from session (or slug/subdomain/host) and passes it into the queue/ledger layer. Add an **isolation test suite** (`tests/tenancy.test.mjs`) with the same discipline as the rename guard: fixture with 2 tenants + 1 platform admin; assert no cross-tenant read/write through any route; CI-block on failure.
117: 
118: ### 4.2 Checkout on the reseller's own Stripe account (Stage C)
119: Why muapi avoids Connect: Connect makes muapi a party to the funds; with the reseller's own keys, muapi never touches customer money. The cost of that choice lands on *you*: (1) store per-tenant secret keys encrypted (KMS/envelope, never env), (2) create Checkout Sessions **with the tenant's key** server-side, (3) route webhooks per tenant (one shared webhook endpoint → look up tenant by `account`/metadata), (4) handle the failure matrix (invalid key, expired, payout disputes) — and the trust question of holding resellers' payment credentials. **Recommendation: ship Stage A→B first; build C only when a paying Scale-tier customer requires it.** B (platform Stripe, margin accounting) delivers 90% of the business outcome with 30% of the risk.
120: 
121: ### 4.3 Custom domains + automatic TLS (W5)
122: Pattern (muapi's, proven): TXT record for ownership verification → CNAME to your apex → background verifier → auto-provision cert. Implementation on a single-host deployment (per the review's 3-process topology): run **Caddy** as the edge — it provisions/renews certs on-demand for any hostname routed to it; app resolves tenant by Host header. Verify job = cron checking TXT token → mark `tenant_domains.verified_at`. Add rate-limits + abuse guards on domain claims (someone must not point `app.stripe.com` at you). Effort concentrates in the *verification state machine*, not Caddy itself.
123: 
124: ### 4.4 Email sender (W6) — the underrated trap
125: Per-tenant SMTP is easy code. **Deliverability is the risk**: a reseller with a burned domain reputation will produce "verification emails go to spam" tickets that look like YOUR outage. Mitigation: validate SPF/DKIM alignment at config time (send test message + verify), fall back to shared sender with a visible warning badge, document DMARC requirements in onboarding.
126: 
127: ---
128: 
129: ## 5. EXECUTION ROADMAP (W0–W6, sequenced AFTER clone sprint R0–R6)
130: 
131: > **Sequencing rule:** Clone sprint first. R0–R6 lands the muapi-fidelity storefront + token layer; white-label W0 begins the week R6 closes. They share the theme-token workstream — do not run them in parallel with two different token designs.
132: 
133: | Phase | Deliverable | Acceptance criteria (verifiable) | Est. |
134: |---|---|---|---|
135: | **W0** Foundations | auth (email OTP) + `tenants`/`users`/`memberships` + RLS + tenant resolution middleware + isolation test suite | `tests/tenancy.test.mjs` green: cross-tenant access returns 404/403 on every enumerated route; session carries tenant+role | 1.5–2 wks |
136: | **W1** Branding-as-data | token contract (40–60 vars) + `tenants.branding` → runtime injection + admin "Brand" editor (name/logo/favicon/color) | two tenants, two logos/colors, zero hard-coded brand values left in `packages/studio` (grep gate in CI) | 1 wk |
137: | **W2** Credits & catalog | `tenant_studios` toggles + `tenant_price_sheets` markup at enqueue + free-credits grant + spend ceiling + **kill switch** + mock adapter (`sandbox=1` → instant samples, 0 credits) | markup math unit-tested against ledger; killed tenant's enqueue → 403; sandbox job costs 0 and returns in <3s | 1–1.5 wks |
138: | **W3** Reseller console + end-user admin | `/admin` (platform) + `/dashboard` (reseller): users list, balances, adjust-with-reason (audit log), ban/unban, studio toggles, markup editor | every mutation writes `audit_log`; end-user of tenant A invisible to admin of tenant B | 1–1.5 wks |
139: | **→ MVP CUT LINE** | **Sellable: path+subdomain tenants, branding, toggles, markup, free credits, sandbox, admin, spend caps** | demo: create tenant via script → branded studio live at `slug.timecapsule.ai` in <10 min | **≈ wk 4–5** |
140: | **W4** Platform billing | Stripe checkout for reseller plans + plan limits enforcement + margin ledger + payout report | plan limit hit → upsell wall; margin report = Σ(end_user_price − reseller_cost) per tenant | 1.5–2 wks |
141: | **W5** Custom domains | TXT verify state machine + Caddy + host-based tenant resolution + cert automation | `app.reseller.com` serves branded studio with valid cert <30 min after DNS; unverified domain rejected | 1.5–2 wks |
142: | **W6** Email + legal + hardening | per-tenant SMTP + ToS/Privacy on auth screens + load/abuse pass + status page | OTP from reseller domain lands in Gmail inbox (manual check); rate limits on auth + enqueue | 1 wk |
143: 
144: **Full parity total: ≈ 8–10 weeks.** With agent assistance on CRUD/test scaffolding, realistic solo-dev clock is the upper bound; the MVP line is the one to sell against.
145: 
146: ---
147: 
148: ## 6. BUSINESS MODEL — HOW TO GRAB THE GENERAL USERS
149: 
150: ### 6.1 Why the instinct is right
151: The users you describe — "people seeking to adapt AI business and content creation" — are **operators, not builders**. They don't want an API; they want a *branded product they can charge for this week*. muapi validated demand at $49–499/mo. Your wedge: **same product, self-hostable lineage, lower floor price, dual-provider resilience.**
152: 
153: ### 6.2 Target segments (ordered by acquisition cost)
154: 
155: | Segment | What they sell | Why white-label fits | Pricing anchor |
156: |---|---|---|---|
157: | Indie/micro-SaaS founders | a niche image/video tool ("headshot studio for lawyers") | zero-code launch, own brand, own Stripe | muapi Starter/Growth |
158: | Agencies & SMMA | content retainer for clients | branded tool per client = 10x perceived value of deliverables | Growth/Scale |
159: | Creators & communities | fan-facing generators (courses, Discords) | free credits hook + branded domain = community moat | Starter |
160: | Vertical operators | product shots, real-estate visuals, wedding/photo | workflow-only catalog (Marketing Studio pattern) | Growth/Scale |
161: 
162: ### 6.3 Suggested pricing (undercut ~40%, keep margin via COGS)
163: 
164: | Plan | Price | Includes | vs muapi |
165: |---|---|---|---|
166: | Starter | **$29/mo** | 100 end users · Image + Video studios · subdomain | muapi $49 |
167: | Growth | **$99/mo** | 1,000 end users · all studios · custom domain · own SMTP | muapi $149 |
168: | Scale | **$299/mo** | unlimited users · own-Stripe (Stage C) · priority support | muapi $499 |
169: 
170: Plus the **credit markup is where resellers make money — so it's where YOU make money**: reseller margin = markup − your wholesale. Your margin stack is one layer thinner than muapi's if you route top SKUs direct-to-provider (Kie/fal) as volume grows.
171: 
172: ### 6.4 The general-user funnel (marketplace → white-label)
173: 
174: 1. **Marketplace (the muapi clone)** = top of funnel: public, SEO-able, dark-themed, 627-model catalog. Free tier: watermark + small credits → converts to credit packs (impulse, $9–29).
175: 2. **Studio subscription** for regular creators (the "flat-rate feel").
176: 3. **White-label upsell** triggers shown INSIDE the product: "3 of your generations this month were shared publicly — put your brand on this." The marketplace IS the demo for the white-label product. This is why the clone sprint's fidelity work is not vanity — it is the sales page for W0–W6.
177: 4. **Blog / Rankings / Docs stubs** (already planned as STUB in route map) = the SEO surface that captures "start an AI business" searches.
178: 
179: ### 6.5 GTM sequence (post-MVP)
180: Week 1–2: launch 5 design-partner resellers at 50% off for case studies. Week 3–6: publish "launch your AI tool in a weekend" playbook + Product Hunt. Week 7+: agency outreach (they buy Scale and self-serve at 10 seats' worth of value).
181: 
182: ---
183: 
184: ## 7. EFFORT & COST SUMMARY
185: 
186: - **Engineering:** ≈8–10 weeks to full muapi parity; sellable MVP ≈4–5 weeks (§5 cut line).
187: - **Infra delta:** Caddy (free), wildcard DNS + cert storage, SMTP relay (Resend/Postgres-backed), Stripe fees — all <$50/mo until scale.
188: - **Non-engineering prerequisites (owner):** see §9 decisions — especially upstream resale rights.
189: 
190: ---
191: 
192: ## 8. RISKS & MITIGATIONS
193: 
194: | Risk | Severity | Mitigation |
195: |---|---|---|
196: | **Upstream resale rights** — reselling Muapi/Kie capacity under reseller brands may violate their ToS | 🔴 BLOCKER-until-checked | read muapi + Kie terms for resale/white-label clauses (decision D1); if unclear, route white-label traffic direct-to-provider or negotiate wholesale terms in writing |
197: | **Moderation liability** — end-users of resellers generate on YOUR provider accounts | 🔴 | spend ceilings + kill switch (W2), prompt-moderation hook before enqueue, per-tenant ToS links, documented takedown SLA |
198: | Margin stack (provider → you → reseller → end user) compresses pricing | 🟡 | direct-to-provider for top SKUs at volume; markup floors enforced in price-sheet editor |
199: | Per-tenant Stripe custody (Stage C) = holding reseller payment credentials | 🟡 | encrypt at rest (KMS), security review before enabling, make Stage B the default |
200: | Email deliverability per tenant | 🟡 | §4.4 validation + shared-sender fallback |
201: | Support burden (B2B SLAs) | 🟡 | sandbox mode as onboarding tool; status page (W6); design-partner tier only while solo |
202: | Fork temptation ("white-label UI ≠ main UI") | 🟡 | §2.2 rule in CI: no hard-coded brand values; tenant rendering IS main rendering |
203: 
204: ---
205: 
206: ## 9. OWNER DECISIONS REQUIRED (5)
207: 
208: | # | Decision | Recommendation |
209: |---|---|---|
210: | D1 | Verify resale/white-label rights in Muapi + Kie ToS (or negotiate wholesale) | do BEFORE selling; owner action, 1 day |
211: | D2 | Money-flow stage | A → B; build C only on paying demand |
212: | D3 | Custom domain tier-gating | Growth and above (keeps W5 off MVP critical path) |
213: | D4 | Free tier for general marketplace users | yes, watermarked + capped — it is the funnel for both credits AND white-label |
214: | D5 | Confirm sequencing: clone sprint R0–R6 → white-label W0 | yes — shared token layer forbids parallel token designs |
215: 
216: ---
217: 
218: ## 10. HANDOFF NOTES FOR THE DEVELOPMENT AGENT
219: 
220: 1. **No UI fork.** White-label tenants render through the SAME `packages/studio` components and app routes as the main brand. Any PR adding a second UI is rejected.
221: 2. **Parameterize, don't branch.** `tenants.branding` → token values at runtime; `theme.timecapsule.css` content becomes the default tenant row (migration script).
222: 3. **CI gates to add:** (a) brand-value grep gate in `packages/studio` (W1), (b) `tests/tenancy.test.mjs` isolation suite (W0), (c) markup/ledger math unit tests (W2), (d) audit-log coverage assertion for every admin mutation (W3).
223: 4. **Do not touch** provider adapter internals beyond adding the `mock` adapter; queue invariants (6) and ledger append-only property remain untouched.
224: 5. Respect the existing test discipline: rename guard (`tests/timecapsule.test.mjs`) must keep passing; new禁词 additions for white-label marketing copy follow the same exemption-list pattern.
225: 6. Every phase ends with a commit + the acceptance criteria from §5 run as a checklist in the PR description.