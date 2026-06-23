-- Monthly credit reset: sets a user's balance to their plan allotment once their
-- 30-day window elapses. Atomic + idempotent — concurrent calls reset at most once.
create or replace function reset_credits_if_due(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update profiles
    set credits_balance = p_amount, credits_reset_at = now()
    where id = p_user_id and credits_reset_at <= now() - interval '30 days'
    returning credits_balance into v_balance;

  if found then
    insert into credit_ledger (user_id, amount, reason, balance_after)
    values (p_user_id, p_amount, 'monthly_grant', p_amount);
    return v_balance;
  end if;

  select credits_balance into v_balance from profiles where id = p_user_id;
  return v_balance;
end;
$$;

revoke all on function reset_credits_if_due(uuid, integer) from public;
grant execute on function reset_credits_if_due(uuid, integer) to service_role;
