# API Reference

- **Base URL:** `{API_URL}/api/v1`
- **Auth:** `Authorization: Bearer <supabase-access-token>` on all routes except health and
  the public webhook/internal endpoints.
- **Interactive docs:** Swagger UI at `{API_URL}/docs` (OpenAPI JSON at `/docs-json`) in
  non-production environments.

## Response envelope

Success:

```json
{ "ok": true, "data": { /* payload */ } }
```

Failure:

```json
{ "ok": false, "error": { "code": "insufficient_credits", "message": "…", "details": [] } }
```

Common error codes: `unauthorized`, `forbidden`, `not_found`, `validation_error`,
`insufficient_credits`, `tracker_limit_reached`, `billing_disabled`, `internal_error`.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness probe (unversioned, public) |
| `GET` | `/ready` | Readiness probe — checks Supabase connectivity |
| `GET` | `/me` | Current user's profile |
| `PATCH` | `/me` | Update profile (`fullName`) |
| `POST` | `/me/welcome` | Send the one-time welcome email (idempotent) |
| `GET` | `/credits` | Credit account (balance, plan, allotment, next reset) |
| `GET` | `/credits/ledger` | Recent credit movements |
| `GET` | `/trackers` | List the user's trackers |
| `POST` | `/trackers` | Create a tracker (plan-limited) |
| `GET` | `/trackers/:id` | Get a tracker |
| `PATCH` | `/trackers/:id` | Update a tracker |
| `DELETE` | `/trackers/:id` | Delete a tracker (cascades its signals) |
| `POST` | `/trackers/:id/run` | Ingest + evaluate new postings (spends credits) |
| `GET` | `/signals` | List signals — `?matchesOnly&status&trackerId&limit&offset` |
| `GET` | `/signals/:id` | Get a signal |
| `PATCH` | `/signals/:id` | Update pipeline status |
| `POST` | `/signals/:id/outreach` | Draft AI outreach (spends credits) |
| `POST` | `/billing/checkout` | Create a Stripe Checkout session (→ `{ url }`) |
| `POST` | `/billing/portal` | Create a Stripe billing-portal session |
| `POST` | `/billing/webhook` | Stripe webhook (public, signature-verified, raw body) |

Internal (unversioned, guarded by `x-internal-secret`):

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/internal/jobs/run-ingestion` | Run the ingestion sweep across active trackers |

## Credit costs

| Operation | Cost |
|---|---|
| Signal evaluation (per posting during a run) | 1 |
| Outreach draft | 2 |

Free plan: 50 credits/month, 2 trackers. Pro: 1,000 credits/month, 25 trackers.
