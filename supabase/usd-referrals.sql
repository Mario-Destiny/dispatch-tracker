-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
-- Run it AFTER paystack.sql. USD monthly/yearly plans, 30 free days, and referrals.
-- The old naira payment function keeps working, so running this does not change the live checkout.

-- 1. Each payment remembers its currency. For USD rows, amount_kobo holds CENTS.
alter table public.payments add column if not exists currency text not null default 'NGN';

-- 2. Referral codes and who referred whom. No policies: only the functions below can use them.
create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique
);
create table if not exists public.referrals (
  referred_id uuid primary key references auth.users(id) on delete cascade,
  referrer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  first_paid_at timestamptz,   -- the referred business's first confirmed payment
  rewarded_at timestamptz      -- when the referrer got 30 free days (empty if over the yearly limit)
);
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

-- 3. First 30 days free: given once, the first time a business is verified.
alter table public.business_profiles add column if not exists free_trial_used_at timestamptz;
-- Businesses verified before this update keep what they have and do not get a second free period.
update public.business_profiles set free_trial_used_at = now() where verified and free_trial_used_at is null;

create or replace function public.grant_free_trial()
returns trigger
language plpgsql
as $$
begin
  if new.verified and new.free_trial_used_at is null then
    if new.founding_until is null or new.founding_until < now() + interval '30 days' then
      new.founding_until := now() + interval '30 days';
    end if;
    new.free_trial_used_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists business_free_trial on public.business_profiles;
create trigger business_free_trial before insert or update on public.business_profiles
  for each row execute function public.grant_free_trial();

-- 4. A new business enters the code of the business that referred it.
create or replace function public.claim_referral(p_code text)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_me uuid := auth.uid();
  v_referrer uuid;
begin
  if v_me is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from public.business_profiles where owner_id = v_me) then
    return json_build_object('ok', false, 'reason', 'Create your business page first.');
  end if;
  if exists (select 1 from public.referrals where referred_id = v_me) then
    return json_build_object('ok', false, 'reason', 'A referral code is already saved on your account.');
  end if;
  if exists (select 1 from public.payments where owner_id = v_me and status = 'paid') then
    return json_build_object('ok', false, 'reason', 'Referral codes are only for your first payment.');
  end if;

  select c.user_id into v_referrer
    from public.referral_codes c
    join public.business_profiles b on b.owner_id = c.user_id
    where c.code = upper(trim(coalesce(p_code, '')));
  if v_referrer is null then
    return json_build_object('ok', false, 'reason', 'That referral code was not found.');
  end if;

  -- No self-referrals: same account, same phone, same email inbox, or referring each other.
  if v_referrer = v_me
     or exists (select 1 from public.referrals where referred_id = v_referrer and referrer_id = v_me)
     or exists (
       select 1 from public.profiles a join public.profiles b on
         length(regexp_replace(coalesce(a.phone, ''), '\D', '', 'g')) >= 7
         and right(regexp_replace(a.phone, '\D', '', 'g'), 10) = right(regexp_replace(coalesce(b.phone, ''), '\D', '', 'g'), 10)
       where a.id = v_me and b.id = v_referrer)
     or exists (
       select 1 from auth.users a join auth.users b on
         regexp_replace(lower(a.email), '\+[^@]*@', '@') = regexp_replace(lower(b.email), '\+[^@]*@', '@')
       where a.id = v_me and b.id = v_referrer)
  then
    return json_build_object('ok', false, 'reason', 'You cannot use this referral code.');
  end if;

  insert into public.referrals (referred_id, referrer_id) values (v_me, v_referrer)
  on conflict (referred_id) do nothing;
  return json_build_object('ok', true);
end;
$$;
revoke all on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;

-- 5. What the app shows: my code, my rewards, and whether my discount applies.
create or replace function public.referral_summary()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_code text;
  v_paid boolean;
  v_referred boolean;
begin
  if v_me is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from public.business_profiles where owner_id = v_me) then return null; end if;

  insert into public.referral_codes (user_id, code)
  values (v_me, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)))
  on conflict (user_id) do nothing;
  select code into v_code from public.referral_codes where user_id = v_me;

  v_paid := exists (select 1 from public.payments where owner_id = v_me and status = 'paid');
  v_referred := exists (select 1 from public.referrals where referred_id = v_me);

  return json_build_object(
    'code', v_code,
    'can_enter_code', not v_paid and not v_referred,
    'discount', v_referred and not v_paid,
    'rewards_this_year', (select count(*) from public.referrals
       where referrer_id = v_me and rewarded_at > now() - interval '1 year')
  );
end;
$$;
revoke all on function public.referral_summary() from public, anon;
grant execute on function public.referral_summary() to authenticated;

-- 6. USD payment request. The PRICE IS SET HERE. Keep in step with src/pricing.ts (amounts in cents).
create or replace function public.create_usd_payment(p_period text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.business_profiles%rowtype;
  v_months int;
  v_amount bigint;
  v_ref text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_period is null or p_period not in ('monthly', 'yearly') then raise exception 'Choose monthly or yearly'; end if;

  select * into b from public.business_profiles where owner_id = auth.uid();
  if not found then raise exception 'Create your business page first'; end if;
  if not b.verified and b.verification_requested_at is null then
    raise exception 'Apply for verification first, then you can pay';
  end if;

  v_months := case when p_period = 'yearly' then 12 else 1 end;
  v_amount := case when b.kind = 'company' then 2000 else 500 end;     -- $20 / $5 a month
  if p_period = 'yearly' then
    v_amount := v_amount * 10;                                          -- 2 months free
  elsif exists (select 1 from public.referrals where referred_id = auth.uid())
    and not exists (select 1 from public.payments where owner_id = auth.uid() and status = 'paid') then
    v_amount := v_amount * 80 / 100;                                    -- 20% off first payment
  end if;
  v_ref := 'VT' || replace(gen_random_uuid()::text, '-', '');

  insert into public.payments (reference, owner_id, plan, months, amount_kobo, currency)
  values (v_ref, auth.uid(), b.kind, v_months, v_amount, 'USD');

  return json_build_object('reference', v_ref, 'amount_minor', v_amount,
    'email', coalesce(auth.jwt() ->> 'email', ''), 'plan', b.kind, 'months', v_months);
end;
$$;
revoke all on function public.create_usd_payment(text) from public, anon;
grant execute on function public.create_usd_payment(text) to authenticated;

-- 7. Replaces the webhook's confirm function: checks the payment's own currency, never wastes
--    free days still left, and rewards the referrer after a first payment (max 6 a year).
create or replace function public.confirm_payment(p_reference text, p_amount_kobo bigint, p_currency text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.payments%rowtype;
  r public.referrals%rowtype;
begin
  select * into p from public.payments where reference = p_reference for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'unknown reference');
  end if;
  if p.status = 'paid' then
    return json_build_object('ok', true, 'already', true);
  end if;
  if p_currency is distinct from p.currency or p_amount_kobo is null or p_amount_kobo < p.amount_kobo then
    update public.payments
      set status = 'failed', note = 'Amount or currency mismatch: ' || coalesce(p_amount_kobo::text, '?') || ' ' || coalesce(p_currency, '?')
      where id = p.id;
    return json_build_object('ok', false, 'reason', 'amount mismatch');
  end if;

  update public.business_profiles
    set paid_until = greatest(now(), paid_until, founding_until) + make_interval(months => p.months)
    where owner_id = p.owner_id;

  update public.payments set status = 'paid', paid_at = now() where id = p.id;

  select * into r from public.referrals where referred_id = p.owner_id and first_paid_at is null for update;
  if found then
    update public.referrals set first_paid_at = now() where referred_id = r.referred_id;
    -- Lock the referrer so two payments at once cannot pass the yearly limit.
    perform 1 from public.business_profiles where owner_id = r.referrer_id for update;
    if found and (select count(*) from public.referrals
        where referrer_id = r.referrer_id and rewarded_at > now() - interval '1 year') < 6 then
      update public.business_profiles
        set paid_until = greatest(now(), paid_until, founding_until) + interval '30 days'
        where owner_id = r.referrer_id;
      update public.referrals set rewarded_at = now() where referred_id = r.referred_id;
    end if;
  end if;

  return json_build_object('ok', true);
end;
$$;
revoke all on function public.confirm_payment(text, bigint, text) from public, anon, authenticated;
grant execute on function public.confirm_payment(text, bigint, text) to service_role;
