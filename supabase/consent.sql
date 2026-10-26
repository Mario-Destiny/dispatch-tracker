-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Records who agreed to the Terms and Privacy Policy, which version, and when.
-- It is safe to run more than once.

-- 1. One row per person per version of the Terms they agreed to.
create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  method text not null check (method in ('email_signup', 'social_signup')),
  accepted_at timestamptz not null default now(),
  unique (user_id, terms_version)
);

-- Nobody reads or writes this table directly from the app. Only the function below can write.
-- You can read it any time in Supabase: Table Editor > user_consents.
alter table public.user_consents enable row level security;

-- 2. A signed-in person records their own agreement (the person cannot pick someone else's id).
create or replace function public.record_consent(p_version text, p_method text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  if p_version is null or length(trim(p_version)) = 0 or length(p_version) > 60 then
    return false;
  end if;
  if p_method not in ('email_signup', 'social_signup') then
    return false;
  end if;

  insert into public.user_consents (user_id, terms_version, method)
  values (auth.uid(), trim(p_version), p_method)
  on conflict (user_id, terms_version) do nothing;

  return true;
end;
$$;

revoke all on function public.record_consent(text, text) from public, anon;
grant execute on function public.record_consent(text, text) to authenticated;
