# Local Setup

## Prerequisites

- **Node.js 22+** and npm 10+
- A **Supabase** project — either a free cloud project, or the local stack via the Supabase CLI
- *(optional)* a free **Gemini API key**, **Stripe** test keys, and a **Resend** key

## 1. Install

```bash
npm install
```

This installs all workspaces and builds `@signalscout/shared` (via its `prepare` script).

## 2. Provision Supabase

**Option A — cloud (simplest):** create a project at [supabase.com](https://supabase.com),
then from *Settings → API* copy the URL, anon key, service-role key, and JWT secret.

**Option B — fully local:** with the Supabase CLI installed:

```bash
npm run db:start     # spins up Postgres + Auth + Studio in Docker
```

It prints local URLs and keys to use in your env files.

## 3. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Fill in the Supabase values in both. `AI_PROVIDER` defaults to `mock`, so the app runs fully
without a Gemini key. See [ENVIRONMENT.md](ENVIRONMENT.md) for every variable.

## 4. Apply the schema

```bash
# cloud project:
npx supabase db push
# or local stack:
npm run db:reset
```

(You can also paste `supabase/migrations/*.sql` into the Supabase SQL editor in order.)

## 5. Seed demo data (optional)

```bash
npm run db:seed
```

Creates `demo@signalscout.dev` (password `demo-password-123`) with a sample tracker and three
signals so the dashboard isn't empty.

## 6. Run

```bash
npm run dev          # backend on http://localhost:8080, frontend on http://localhost:3000
```

Open http://localhost:3000, sign up (or log in as the demo user), create a tracker pointing at
a real public board (e.g. Greenhouse slug `vercel`), and hit **Run**.

## Enabling the optional integrations

- **Real AI:** set `AI_PROVIDER=gemini` and `GEMINI_API_KEY=...` in `backend/.env`.
- **Stripe (test mode):** set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO_MONTHLY`, and for webhooks
  run `stripe listen --forward-to localhost:8080/api/v1/billing/webhook` and copy the signing
  secret into `STRIPE_WEBHOOK_SECRET`. Test card: `4242 4242 4242 4242`.
- **Email:** set `RESEND_API_KEY` and `EMAIL_FROM`.

## Useful commands

```bash
npm run build         # build everything
npm run lint          # lint both apps
npm run test -w backend
npm run test:e2e -w frontend     # requires: npx playwright install chromium
docker compose up --build        # run both apps in containers (Docker Desktop running)
```
