# Environment Variables

## Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development` \| `test` \| `production` |
| `PORT` | no | `8080` | HTTP port (Cloud Run injects this) |
| `LOG_LEVEL` | no | `info` | pino level |
| `FRONTEND_URL` | no | `http://localhost:3000` | Used for email links + redirect bases |
| `CORS_ORIGINS` | no | `http://localhost:3000` | Comma-separated allowed origins |
| `SUPABASE_URL` | **yes** | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | **yes** | — | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** | — | Service-role key (server-only) |
| `SUPABASE_JWT_SECRET` | **yes** | — | JWT secret |
| `AI_PROVIDER` | no | `mock` | `mock` (no key) or `gemini` |
| `GEMINI_API_KEY` | if `gemini` | — | Google AI Studio key |
| `GEMINI_MODEL` | no | `gemini-2.5-flash` | Model id |
| `STRIPE_SECRET_KEY` | no | — | Enables billing when set |
| `STRIPE_WEBHOOK_SECRET` | no | — | Webhook signature secret |
| `STRIPE_PRICE_PRO_MONTHLY` | no | — | Stripe Price id for the Pro plan |
| `RESEND_API_KEY` | no | — | Enables email when set |
| `EMAIL_FROM` | no | — | From address, e.g. `SignalScout <hi@yourdomain>` |
| `INTERNAL_API_SECRET` | no | — | Shared secret for the internal job trigger |
| `INGESTION_ENABLED` | no | `false` | Run the in-process cron sweep |
| `INGESTION_CRON` | no | `0 */6 * * *` | Cron expression for the sweep |
| `INGESTION_BATCH_SIZE` | no | `10` | Trackers processed per batch |

Optional integrations degrade gracefully: with Stripe/Resend keys absent, those features are
disabled (no crashes), so the core product runs on Supabase alone.

## Frontend (`frontend/.env.local`)

These are **public** and inlined at build time.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **yes** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **yes** | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | **yes** | Backend base URL (e.g. `http://localhost:8080`) |

## Seed script

`npm run db:seed` reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `backend/.env`
(or `backend/.env.local`).
