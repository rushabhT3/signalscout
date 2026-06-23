-- SignalScout — initial schema
-- Tables: profiles, trackers, job_postings, signals, credit_ledger
-- Plus: enums, updated_at triggers, new-user bootstrap, atomic credit RPCs, RLS.

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums (mirror the @signalscout/shared contracts)
-- ─────────────────────────────────────────────────────────────────────────────
create type plan_tier as enum ('free', 'pro');

create type signal_category as enum (
  'hiring_surge',
  'first_role_of_type',
  'leadership_hire',
  'team_expansion',
  'tech_adoption',
  'geographic_expansion',
  'not_a_match'
);

create type lead_status as enum ('new', 'saved', 'contacted', 'archived');

create type job_board_provider as enum ('greenhouse', 'lever', 'ashby');

create type credit_reason as enum (
  'signal_evaluation',
  'outreach_draft',
  'monthly_grant',
  'plan_upgrade',
  'signup_bonus',
  'manual_adjustment'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Shared trigger: maintain updated_at
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  plan_tier plan_tier not null default 'free',
  credits_balance integer not null default 50 check (credits_balance >= 0),
  credits_reset_at timestamptz not null default now(),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- trackers (a user's ICP + signal hypothesis + target company boards)
-- ─────────────────────────────────────────────────────────────────────────────
create table trackers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  product_description text not null,
  signal_hypothesis text not null,
  keywords text[] not null default '{}',
  locations text[] not null default '{}',
  sources jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trackers_user_id_idx on trackers (user_id);
create index trackers_active_idx on trackers (is_active) where is_active;

create trigger trackers_set_updated_at
  before update on trackers
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- job_postings (internal ingestion + dedup cache; service-role only)
-- ─────────────────────────────────────────────────────────────────────────────
create table job_postings (
  id uuid primary key default gen_random_uuid(),
  provider job_board_provider not null,
  external_id text not null,
  company text not null,
  company_slug text not null,
  title text not null,
  location text,
  description text not null,
  url text not null,
  posted_at timestamptz,
  content_hash text not null,
  first_seen_at timestamptz not null default now(),
  unique (provider, external_id)
);

create index job_postings_slug_idx on job_postings (provider, company_slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- signals (one AI evaluation per tracker × posting; snapshot denormalized so
-- user-scoped reads never touch the shared job_postings table)
-- ─────────────────────────────────────────────────────────────────────────────
create table signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  tracker_id uuid not null references trackers (id) on delete cascade,
  job_posting_id uuid not null references job_postings (id) on delete cascade,
  company text not null,
  title text not null,
  location text,
  url text not null,
  posted_at timestamptz,
  is_match boolean not null,
  confidence integer not null check (confidence between 0 and 100),
  category signal_category not null,
  reasoning text not null,
  likely_need text not null,
  suggested_angle text not null,
  model text not null default 'mock',
  status lead_status not null default 'new',
  outreach jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tracker_id, job_posting_id)
);

create index signals_user_match_idx on signals (user_id, is_match, confidence desc);
create index signals_tracker_idx on signals (tracker_id);

create trigger signals_set_updated_at
  before update on signals
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- credit_ledger (append-only audit trail of every credit movement)
-- ─────────────────────────────────────────────────────────────────────────────
create table credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  amount integer not null, -- positive = grant, negative = debit
  reason credit_reason not null,
  reference text,
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create index credit_ledger_user_idx on credit_ledger (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- New-user bootstrap: create a profile + signup-bonus ledger entry
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  insert into public.credit_ledger (user_id, amount, reason, balance_after)
  values (new.id, 50, 'signup_bonus', 50);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Atomic credit operations (race-safe; service-role only)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function debit_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason credit_reason,
  p_reference text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'debit amount must be positive';
  end if;

  -- Conditional update is the lock: it only succeeds when the balance suffices,
  -- so concurrent debits can never drive the balance negative.
  update profiles
    set credits_balance = credits_balance - p_amount
    where id = p_user_id and credits_balance >= p_amount
    returning credits_balance into v_balance;

  if not found then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  insert into credit_ledger (user_id, amount, reason, reference, balance_after)
  values (p_user_id, -p_amount, p_reason, p_reference, v_balance);

  return v_balance;
end;
$$;

create or replace function grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason credit_reason,
  p_reference text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'grant amount must be positive';
  end if;

  update profiles
    set credits_balance = credits_balance + p_amount
    where id = p_user_id
    returning credits_balance into v_balance;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  insert into credit_ledger (user_id, amount, reason, reference, balance_after)
  values (p_user_id, p_amount, p_reason, p_reference, v_balance);

  return v_balance;
end;
$$;

-- The credit RPCs are SECURITY DEFINER, so they must NOT be callable by end
-- users — only the backend (service role) may move credits.
revoke all on function debit_credits(uuid, integer, credit_reason, text) from public;
revoke all on function grant_credits(uuid, integer, credit_reason, text) from public;
grant execute on function debit_credits(uuid, integer, credit_reason, text) to service_role;
grant execute on function grant_credits(uuid, integer, credit_reason, text) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table trackers enable row level security;
alter table job_postings enable row level security;
alter table signals enable row level security;
alter table credit_ledger enable row level security;

-- profiles: owner may read and update their own row (created by trigger)
create policy profiles_select_own on profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_update_own on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- trackers: owner full CRUD
create policy trackers_select_own on trackers
  for select to authenticated using (user_id = auth.uid());
create policy trackers_insert_own on trackers
  for insert to authenticated with check (user_id = auth.uid());
create policy trackers_update_own on trackers
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy trackers_delete_own on trackers
  for delete to authenticated using (user_id = auth.uid());

-- signals: owner reads + updates status/outreach; inserts come from the worker
-- (service role), which bypasses RLS.
create policy signals_select_own on signals
  for select to authenticated using (user_id = auth.uid());
create policy signals_update_own on signals
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy signals_delete_own on signals
  for delete to authenticated using (user_id = auth.uid());

-- credit_ledger: owner read-only (writes only via SECURITY DEFINER RPCs)
create policy credit_ledger_select_own on credit_ledger
  for select to authenticated using (user_id = auth.uid());

-- job_postings: no policies for authenticated → only the service role can touch it.

-- ─────────────────────────────────────────────────────────────────────────────
-- Table privileges (RLS still gates rows; this gates the operations)
-- ─────────────────────────────────────────────────────────────────────────────
grant select, update on profiles to authenticated;
grant select, insert, update, delete on trackers to authenticated;
grant select, update, delete on signals to authenticated;
grant select on credit_ledger to authenticated;
grant all on all tables in schema public to service_role;
