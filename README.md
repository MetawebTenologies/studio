# Timecapsule Studio — From imagination to motion

Timecapsule Studio is a cinematic AI workspace for turning ideas into images, motion, and creative workflows with a secure managed Backend-For-Frontend (BFF) boundary, durable PostgreSQL transactional queue, and tenant-isolated Row Level Security.

Based on the MIT-licensed Open-Higgsfield-AI project. Reimplemented with a production-grade multi-tenant backend, double-entry credit ledger, and fail-closed provider seams.

---

## Features

- **Multimodal Generation Studios (`/studio`)**: Dedicated creative suites for Cinema (cameras, lenses, apertures, film stocks), Video generation (T2V, I2V), Image creation (T2I, I2I), and LipSync audio sync with persistent upload history and multi-reference consistency badges.
- **Dynamic Model Playground (`/[slug]`)**: Interactive playground dynamically driven by unified model capabilities schemas (aspect ratios, resolutions, qualities, durations) with auto-generated cURL, Python, and Node.js SDK code snippets.
- **White-Label & Multi-Tenancy**: Full tenant isolation via PostgreSQL Row Level Security (RLS) with session GUC scoping (`app.current_tenant_id`), custom subdomain routing, and sanitized branding configuration endpoints (`/api/v1/tenant/config`).
- **Security & Integrity Guarantees**:
  - **Fail-Closed Role Hardening**: Hardened `timecapsule_system_role` and `timecapsule_tenant_role` preventing fail-open access, GUC escalation, or membership escapes.
  - **Double-Entry Credit Ledger**: Append-only transactional accounting (`credit_ledger`, `credit_reservations`) with settlement math and refund protection.
  - **Lease-Fenced Queue Workers**: Durable background execution with monotonic fencing tokens and crash recovery (`reconciling_submission`).
  - **Server-Side File Validation**: Strict MIME and magic-number byte signature inspection rejecting spoofed or malicious uploads.
  - **Fail-Closed Model Pinning**: Zero silent substitutions or fallback drift.
- **Real-Time Job Streaming**: Server-Sent Events (SSE) with PostgreSQL-backed monotonic event sequence replays (`Last-Event-ID`).
- **Desktop Application Shell**: Cross-platform desktop distribution built on Electron (`electron/`).

---

## Architecture

The Timecapsule workspace is organized as a modular monorepo:

- **Next.js Platform Shell (`app/`)**: Thin App Router platform shell providing navigation, Dashboard, Explore catalog, Usage reporting, CLI gateway, and API routes under `/api/v1/*`.
- **Core Orchestrator (`packages/timecapsule`)**: Durable PostgreSQL jobs store, double-entry credit ledger, fenced background worker, canonical fingerprinting, and provider adapters (`Muapi`, `Kie`).
- **Studio Component Library (`packages/studio`)**: Shared, modular UI studio shells (CinemaStudio, VideoStudio, ImageStudio, LipSyncStudio).

```
timecapsule-studio/
├── app/                       # Next.js App Router (shell, pages & /api/v1 BFF)
│   ├── api/v1/                # Managed API routes (session, generations, assets, uploads)
│   ├── dashboard/             # Workspace dashboard and metrics
│   ├── explore/               # Model discovery catalog
│   └── studio/                # Interactive generation studio
├── packages/
│   ├── timecapsule/           # Core engine: DB, queue, worker, ledger, adapters
│   └── studio/                # Shared creative studio component library
├── components/                # Platform shell UI components
├── electron/                  # Desktop application shell
└── tests/                     # Automated regression test suite
```

---

## Prerequisites

- **Node.js**: v22+ (`.nvmrc` provided)
- **npm**: v10+
- **Docker & Docker Compose**: For local PostgreSQL database

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/MetawebTenologies/studio.git
cd studio
```

### 2. Install dependencies & build studio assets

```bash
npm install
npm run setup
```

### 3. Start PostgreSQL database

```bash
docker compose up -d
```

### 4. Run database migrations and seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Configure environment variables

Copy the example environment file and configure your keys:

```bash
cp .env.example .env
```

Set your provider credentials:

```bash
MUAPI_API_KEY=your_muapi_api_key_here
KIE_API_KEY=your_kie_api_key_here
```

### 6. Start the development server & worker

In your primary terminal, start the Next.js platform server:

```bash
npm run dev
```

In a separate terminal, start the durable background worker:

```bash
npm run worker
```

Open [http://localhost:3000](http://localhost:3000) (or configured port) in your browser.

---

## Testing & Quality Assurance

Run the comprehensive test suite verifying auth containment, queue durability, fencing invariants, and provider contracts:

```bash
npm test
```

Production build verification:

```bash
npm run build
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
