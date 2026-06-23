# Database

PostgreSQL, managed by Supabase. Schema lives in `supabase/migrations/` and is the source of
truth; the backend's `database.types.ts` mirrors it (in production it would be generated via
`supabase gen types typescript`).

## ER diagram

```mermaid
erDiagram
  auth_users ||--|| profiles : "1:1 (trigger)"
  profiles ||--o{ trackers : owns
  profiles ||--o{ signals : owns
  profiles ||--o{ credit_ledger : owns
  trackers ||--o{ signals : produces
  job_postings ||--o{ signals : "evaluated as"

  profiles {
    uuid id PK "= auth.users.id"
    text email
    text full_name
    plan_tier plan_tier "free | pro"
    int credits_balance
    timestamptz credits_reset_at
    text stripe_customer_id
    text stripe_subscription_id
    text subscription_status
    timestamptz welcomed_at
  }

  trackers {
    uuid id PK
    uuid user_id FK
    text name
    text product_description
    text signal_hypothesis
    text_array keywords
    text_array locations
    jsonb sources
    bool is_active
    timestamptz last_run_at
  }

  job_postings {
    uuid id PK
    job_board_provider provider
    text external_id
    text company
    text company_slug
    text title
    text location
    text description
    text url
    timestamptz posted_at
    text content_hash
  }

  signals {
    uuid id PK
    uuid user_id FK
    uuid tracker_id FK
    uuid job_posting_id FK
    text company
    text title
    bool is_match
    int confidence
    signal_category category
    text reasoning
    text likely_need
    text suggested_angle
    lead_status status
    jsonb outreach
  }

  credit_ledger {
    uuid id PK
    uuid user_id FK
    int amount "signed"
    credit_reason reason
    text reference
    int balance_after
  }
```

## Tables

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user (created by a trigger on signup). Holds plan, credit balance, and Stripe linkage. |
| `trackers` | A user's ICP + signal hypothesis + the company job boards to watch. |
| `job_postings` | Internal, deduplicated cache of ingested postings (service-role only). |
| `signals` | One AI evaluation per `(tracker, posting)`, with a denormalized posting snapshot, status, and optional outreach. Matches are the user's "leads". |
| `credit_ledger` | Append-only audit trail of every credit movement. |

## Enums

`plan_tier`, `signal_category`, `lead_status`, `job_board_provider`, `credit_reason` — native
Postgres enums that mirror the `@signalscout/shared` contracts exactly.

## Functions (SECURITY DEFINER, service-role only)

- **`debit_credits(user, amount, reason, ref)`** — atomic spend via a conditional
  `UPDATE ... WHERE credits_balance >= amount`; raises `insufficient_credits` when short, so
  concurrent debits can never overspend. Writes a ledger entry.
- **`grant_credits(...)`** — atomic top-up (plan upgrade, refunds) + ledger entry.
- **`reset_credits_if_due(user, amount)`** — resets the balance to the plan allotment once the
  30-day window elapses; idempotent under concurrency.
- **`handle_new_user()`** — trigger on `auth.users` insert that creates the profile and a
  signup-bonus ledger entry.

These functions have `EXECUTE` revoked from `public` and granted only to `service_role`.

## Row Level Security

RLS is enabled on all tables:

- `profiles` — owner can `select`/`update` their row.
- `trackers` — owner has full CRUD.
- `signals` — owner can `select`/`update`/`delete`; inserts come from the service role.
- `credit_ledger` — owner read-only (writes only via the credit functions).
- `job_postings` — no policies for end users; only the service role touches it.
