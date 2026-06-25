# SignalScout

**Turn public hiring data into qualified B2B pipeline.** SignalScout watches the job
boards of companies you care about, uses an LLM to decide which postings are genuine
buying signals for *your* product, explains why, and drafts a signal-specific outreach
email — all metered by a credit system with Stripe-powered upgrades.

It's a complete, production-shaped SaaS: typed end-to-end, authenticated, billed,
background-processed, tested, containerized, and deployable to Google Cloud Run.

---

## Highlights

- **AI with structured outputs** — Gemini evaluates each posting against a plain-English
  "signal hypothesis" and returns a schema-validated verdict (match, confidence, category,
  reasoning, likely need, suggested angle). A deterministic mock provider keeps local dev
  and CI key-free.
- **Pluggable ingestion** — Greenhouse / Lever / Ashby adapters behind one interface and a
  registry, so a new provider is a new file (Open/Closed). Uses free public job-board APIs.
- **Credits & billing** — atomic, race-safe credit debits in Postgres; monthly resets;
  Stripe Checkout + billing portal + signature-verified webhooks (test mode).
- **Background jobs** — a batched ingestion sweep runs on an in-process cron *or* via a
  secret-guarded internal endpoint (the serverless-friendly Cloud Scheduler pattern), then
  emails per-user digests.
- **Security-by-default** — global Supabase-JWT guard, full Row Level Security, secrets
  validated at boot, structured logging with redaction.

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) across the whole monorepo |
| Frontend | Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · SWR |
| Backend | NestJS 11 (DI, modules, repositories) · Express 5 |
| Database / Auth | Supabase (PostgreSQL + Auth + RLS) |
| AI | Google Gemini (`@google/genai`) with structured outputs |
| Payments | Stripe (test mode) |
| Email | Resend |
| Validation | Zod 4 (shared contracts) |
| Tooling | npm workspaces · ESLint · Prettier · Jest · Playwright |
| Delivery | Docker (multi-stage) · GitHub Actions · Google Cloud Run |

## Architecture

```mermaid
flowchart LR
  U[Browser] -->|Supabase JWT| W[Next.js frontend<br/>Cloud Run]
  W -->|Bearer token| A[NestJS API<br/>Cloud Run]
  W -->|auth only| S[(Supabase<br/>Auth + Postgres + RLS)]
  A --> S
  A -->|structured output| G[Gemini]
  A -->|checkout / webhooks| ST[Stripe]
  A -->|transactional mail| R[Resend]
  A -->|public job boards| J[Greenhouse / Lever / Ashby]
  SCH[Cloud Scheduler] -->|x-internal-secret| A
```

The frontend uses Supabase only for the auth session; **all data flows through the NestJS
API** (service-role, with RLS as defense-in-depth). See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design and trade-offs.

## Monorepo layout

```
signalscout/
├── frontend/            # Next.js app (UI, auth, dashboard)
├── backend/             # NestJS API (feature modules + platform layer)
├── packages/shared/     # Zod contracts + types shared by both apps
├── supabase/            # SQL migrations + config
├── scripts/             # seed script
├── docs/                # architecture, database, API, deploy, env
└── .github/workflows/   # CI + deploy
```

## Get started

> Prerequisites: Node 22+ and a free [Supabase](https://supabase.com) project.

```bash
npm install                                       # installs workspaces, builds shared contracts
cp backend/.env.example backend/.env              # add your Supabase keys
cp frontend/.env.local.example frontend/.env.local
npm run dev                                        # api on :8080, web on :3000
```

The API runs with `AI_PROVIDER=mock` by default — no keys required to try it. The full
walkthrough (schema, seeding, all scripts, and enabling Gemini/Stripe/Resend) lives in
**[docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)**.

## Documentation

- [Architecture & design decisions](docs/ARCHITECTURE.md)
- [Database schema & ER diagram](docs/DATABASE.md)
- [API reference](docs/API.md)
- [Local setup](docs/LOCAL_SETUP.md)
- [Deployment to Google Cloud Run](docs/DEPLOYMENT.md) — includes the [Stripe billing setup](docs/DEPLOYMENT.md#5-stripe-billing-test-mode)
- [Environment variables](docs/ENVIRONMENT.md)

## License

MIT
