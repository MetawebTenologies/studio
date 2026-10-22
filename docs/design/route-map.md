# Timecapsule Reference Build — Route Map

This document establishes the disposition of every route in relation to the `muapi.ai` reference platform. In accordance with the project policy, Timecapsule reproduces visual layout and UX structures faithfully while maintaining independent code, original rewritten copy, and secure backend integration.

## Route Disposition Table

| Reference Route (Muapi) | Timecapsule Route | Strategy | Rationale & Implementation Notes |
|---|---|---|---|
| `/` (Landing/Home) | `/` & `/explore` | **CLONE** | High-fidelity clone of the model discovery hub with billboard announcement carousel, category facets, search bar, filter tags, and 2-column model grid. Copy is 100% rewritten for Timecapsule. |
| `/playground` | `/explore` | **CLONE** | Aliased to `/explore`. Direct parity with reference model directory. |
| `/playground/[slug]` | `/[slug]` | **CLONE** | Model execution and playground screen with parameter controls, aspect ratio/resolution pickers, pricing, and prompt inputs. |
| `/pricing` | `/pricing` | **CLONE** | Plan tiers, credit top-up matrix, per-model consumption rates, and pay-as-you-go credit breakdown. |
| `/cli` | `/cli` | **ADAPT** | Retains Muapi's sleek CLI documentation and terminal card layout while wiring to Timecapsule's local BFF gateway, MCP daemon, and shell tools. |
| `/studio` | `/studio` | **ADAPT** | Creative production studio (Cinema, Video, Image, LipSync). **Keeps cinema dark inside** (`#09090b` canvas) while adopting the global chrome header/footer. |
| `/dashboard` | `/dashboard` | **ADAPT** | Workspace overview, active credit quota, recent job timeline, and quick-launch studio cards. |
| `/usage` | `/usage` | **ADAPT** | Ledger and cost breakdown showing Timecapsule credits consumed vs provider runtime costs with filtering. |
| `/billing` | `/billing` | **STUB** | Clean SaaS preview showing ledger balance, credit top-up vouchers, and invoice history. |
| `/rankings` | `/rankings` | **STUB** | Leaderboard of top multimodal models by generation speed, quality score, and cost efficiency. |
| `/docs` | `/docs` | **STUB** | Developer documentation hub for the Timecapsule BFF API, CLI, and MCP servers. |
| `/blog` | `/blog` | **STUB** | Multimodal engineering changelog and release notes. |
| `/referral` | `/referral` | **STUB** | Referral rewards and developer credit program preview. |
| `/api-keys` | `/api-keys` | **STUB** | Client credential management and provider secret configuration screen. |
| `/integrations` | `/integrations` | **STUB** | Ecosystem integrations (ComfyUI, Blender, Premiere, MCP). |
| Non-core locale routes (`/zh`, `/ja`, etc.) | *N/A* | **HIDE** | Omitted from active navigation to keep single-tenant footprint lean. |

---

## Behavioral & Security Invariants
- **Frozen Backend**: `packages/timecapsule/**` and `app/api/**` remain untouched.
- **Client Auth**: Session token held server-side or via secure preview session; provider keys are never exposed in browser DOM.
- **Copyright & Branding**: Zero scraped assets or verbatim copy. No hotlinking to `cdn.muapi.ai`.
