# Timecapsule — AI Cinema, Video & Image Studio

Timecapsule is a self-hostable multimodal generative studio for AI cinema, video, image, and lip-sync creation. Users bring their own provider keys, with native server-side adapters for Muapi and Kie built in.

Based on the MIT-licensed Open-Higgsfield-AI project.

---

## Features

- **Multimodal Generation Studios**: Specialized studios for Cinema (lens, camera angle, lighting, film stocks), Video generation (T2V, I2V), Image creation (T2I, I2I), and LipSync audio sync.
- **BFF Architecture**: Secure Backend-For-Frontend boundary (`/api/v1/*`) ensuring provider API keys never touch the client browser.
- **Durable PostgreSQL Queue & Accounting**: Transactional credit reservation, lease claims, fencing tokens, ambiguous-submission reconciliation, and idempotency protection.
- **Provider Adapters**: First-class support for Muapi and Kie generation backends with zero silent model substitutions.
- **Real-Time Job Streaming**: SSE event replays with PostgreSQL-backed monotonic event sequencing.

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
