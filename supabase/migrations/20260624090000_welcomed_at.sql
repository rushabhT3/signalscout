-- Tracks whether the one-time welcome email has been sent, so the claim is idempotent.
alter table profiles add column welcomed_at timestamptz;
