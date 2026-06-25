# Deployment — Google Cloud Run

Both apps deploy as containers to Cloud Run; Supabase hosts Postgres + Auth. Everything below
fits comfortably in free tiers.

## Prerequisites

- `gcloud` CLI authenticated (`gcloud auth login`) and a project with billing enabled
- A Supabase project with the schema applied (`npx supabase db push`)
- Docker running locally (or rely on the GitHub Actions deploy workflow)

```bash
export PROJECT_ID=your-project
export REGION=europe-west1
export REPO=signalscout
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  cloudscheduler.googleapis.com
gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION"
gcloud auth configure-docker "$REGION-docker.pkg.dev"
```

## 1. Deploy the backend

Build, push, and deploy the API (it must exist first so the frontend can point at it):

```bash
BACKEND_IMG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/backend:latest"
docker build -f backend/Dockerfile -t "$BACKEND_IMG" .
docker push "$BACKEND_IMG"

gcloud run deploy signalscout-api \
  --image "$BACKEND_IMG" --region "$REGION" --platform managed \
  --allow-unauthenticated --port 8080 \
  --set-env-vars "^##^NODE_ENV=production##AI_PROVIDER=gemini##SUPABASE_URL=$SUPABASE_URL##SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY##SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY##SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET##GEMINI_API_KEY=$GEMINI_API_KEY##STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY##STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET##STRIPE_PRICE_PRO_MONTHLY=$STRIPE_PRICE_PRO_MONTHLY##RESEND_API_KEY=$RESEND_API_KEY##EMAIL_FROM=$EMAIL_FROM##INTERNAL_API_SECRET=$INTERNAL_API_SECRET"
```

> The `^##^` prefix sets `##` as the delimiter so values containing commas are safe. For
> production, prefer storing secrets in **Secret Manager** and wiring them with
> `--set-secrets` instead of `--set-env-vars`.

Note the service URL it prints (e.g. `https://signalscout-api-xxxx.run.app`).

## 2. Deploy the frontend

`NEXT_PUBLIC_*` values are baked at build time, so pass the backend URL as a build arg:

```bash
FRONTEND_IMG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/frontend:latest"
docker build -f frontend/Dockerfile \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_API_URL="https://signalscout-api-xxxx.run.app" \
  -t "$FRONTEND_IMG" .
docker push "$FRONTEND_IMG"

gcloud run deploy signalscout-web \
  --image "$FRONTEND_IMG" --region "$REGION" --platform managed \
  --allow-unauthenticated --port 3000
```

## 3. Connect the two

Point the backend's CORS + redirect base at the frontend URL it just printed:

```bash
gcloud run services update signalscout-api --region "$REGION" \
  --update-env-vars "FRONTEND_URL=https://signalscout-web-xxxx.run.app,CORS_ORIGINS=https://signalscout-web-xxxx.run.app"
```

Also add the frontend URL to **Supabase → Authentication → URL Configuration** (Site URL +
redirect URLs).

## 4. Schedule the ingestion sweep

Cloud Run scales to zero, so trigger the sweep externally:

```bash
gcloud scheduler jobs create http signalscout-ingestion \
  --location "$REGION" --schedule "0 */6 * * *" \
  --uri "https://signalscout-api-xxxx.run.app/api/internal/jobs/run-ingestion" \
  --http-method POST \
  --headers "x-internal-secret=$INTERNAL_API_SECRET"
```

## 5. Stripe billing (test mode)

Billing is optional and degrades gracefully — leave the Stripe vars blank and the upgrade flow
is simply disabled. To enable it, set three vars on the API service: `STRIPE_SECRET_KEY`,
`STRIPE_PRICE_PRO_MONTHLY`, and `STRIPE_WEBHOOK_SECRET`. The backend requires **all three**
before checkout works (`billing.service.ts` throws `billing_disabled` without the price id).

Everything below is Stripe **test mode** — no real money moves. Use your `sk_test_…` key.

### a. Create the product + price

Use the dashboard (**Product catalog → Add product**, then add a recurring monthly price) or
the API directly:

```bash
SK=sk_test_…   # your test secret key

# Product
PROD=$(curl -s https://api.stripe.com/v1/products -u "$SK:" \
  --data-urlencode "name=SignalScout Pro" | jq -r .id)

# Recurring monthly price → its id is STRIPE_PRICE_PRO_MONTHLY
curl -s https://api.stripe.com/v1/prices -u "$SK:" \
  -d product="$PROD" -d unit_amount=150000 -d currency=inr \
  -d "recurring[interval]=month" | jq -r .id
```

> **India accounts must price in INR.** A Stripe account registered to an Indian *individual*
> cannot accept international (e.g. USD) payments — checkout fails with _"only registered Indian
> businesses can accept international payments."_ Use `currency=inr` with the amount in paise
> (`150000` = ₹1,500). Registered businesses can price in other currencies.

### b. Register the webhook endpoint

Subscribe to exactly the three events the API handles. The `secret` the API returns (shown only
once) is your `STRIPE_WEBHOOK_SECRET`:

```bash
curl -s https://api.stripe.com/v1/webhook_endpoints -u "$SK:" \
  --data-urlencode "url=https://signalscout-api-xxxx.run.app/api/v1/billing/webhook" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted" | jq -r .secret
```

Dashboard equivalent: **Developers → Webhooks → Add endpoint**, same URL + events, then
*reveal* the signing secret.

### c. Wire the secrets onto Cloud Run

Env-only update — no rebuild, just a new revision:

```bash
gcloud run services update signalscout-api --region "$REGION" \
  --update-env-vars "STRIPE_SECRET_KEY=sk_test_…,STRIPE_PRICE_PRO_MONTHLY=price_…,STRIPE_WEBHOOK_SECRET=whsec_…"
```

### d. Test

On the billing page click **Upgrade to Pro** and pay with test card `4242 4242 4242 4242` (any
future expiry, any CVC). Stripe redirects back to `/dashboard/billing?status=success`, fires
`checkout.session.completed`, and the webhook flips the account to Pro and grants its credits.

## Automated deploys (GitHub Actions)

`.github/workflows/deploy.yml` builds, pushes, and deploys both services on manual dispatch.
Runtime secrets are set once on the service (steps above) and preserved across image-only
deploys. Configure these repository secrets:

`GCP_SA_KEY`, `GCP_PROJECT_ID`, `GCP_REGION`, `GAR_REPO`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`.

The service account needs `roles/run.admin`, `roles/artifactregistry.writer`, and
`roles/iam.serviceAccountUser`.
