-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
-- Paystack payments for Verified plans.

-- 1. Record of every payment attempt. Nobody can write to it from the app.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  owner_id uuid not null,
  plan text not null,
  months int not null,
  amount_kobo bigint not null,
  status text not null default 'pending',   -- pending, paid, failed
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.payments enable row level security;

drop policy if exists "owner reads own payments" on public.payments;
create policy "owner reads own payments" on public.payments
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "admin reads payments" on public.payments;
create policy "admin reads payments" on public.payments
  for select to authenticated using (public.is_admin());

-- 2. The app asks for a payment. The PRICE IS SET HERE, not in the browser.
--    Keep these amounts in step with src/pricing.ts (amounts are in kobo: 100 kobo = 1 naira).
create or replace function public.create_payment(p_months int)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.business_profiles%rowtype;
  v_unit bigint;
  v_amount bigint;
  v_ref text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_months not in (1, 3, 6) then raise exception 'Choose 1, 3 or 6 months'; end if;

  select * into b from public.business_profiles where owner_id = auth.uid();
  if not found then raise exception 'Create your business page first'; end if;
  if not b.verified and b.verification_requested_at is null then
    raise exception 'Apply for verification first, then you can pay';
  end if;

  v_unit := case when b.kind = 'company' then 1000000 else 300000 end;  -- N10,000 / N3,000
  v_amount := v_unit * p_months;
  v_ref := 'VT' || replace(gen_random_uuid()::text, '-', '');

  insert into public.payments (reference, owner_id, plan, months, amount_kobo)
  values (v_ref, auth.uid(), b.kind, p_months, v_amount);

  return json_build_object(
    'reference', v_ref,
    'amount_kobo', v_amount,
    'email', coalesce(auth.jwt() ->> 'email', ''),
    'plan', b.kind,
    'months', p_months
  );
end;
$$;
revoke all on function public.create_payment(int) from public, anon;
grant execute on function public.create_payment(int) to authenticated;

-- 3. Called ONLY by the webhook (service role) after Paystack confirms real money arrived.
--    Extends paid_until the same way the admin "approve" screen does. Safe to call twice.
create or replace function public.confirm_payment(p_reference text, p_amount_kobo bigint, p_currency text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.payments%rowtype;
begin
  select * into p from public.payments where reference = p_reference for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'unknown reference');
  end if;
  if p.status = 'paid' then
    return json_build_object('ok', true, 'already', true);
  end if;
  if p_currency is distinct from 'NGN' or p_amount_kobo < p.amount_kobo then
    update public.payments
      set status = 'failed', note = 'Amount or currency mismatch: ' || coalesce(p_amount_kobo::text, '?') || ' ' || coalesce(p_currency, '?')
      where id = p.id;
    return json_build_object('ok', false, 'reason', 'amount mismatch');
  end if;

  update public.business_profiles
    set paid_until = greatest(now(), coalesce(paid_until, now())) + make_interval(months => p.months)
    where owner_id = p.owner_id;

  update public.payments set status = 'paid', paid_at = now() where id = p.id;
  return json_build_object('ok', true);
end;
$$;
revoke all on function public.confirm_payment(text, bigint, text) from public, anon, authenticated;
grant execute on function public.confirm_payment(text, bigint, text) to service_role;
