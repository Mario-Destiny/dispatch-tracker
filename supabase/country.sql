-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Stage 1 of going international: saves which country each person is in.
-- The app works even if this has not been run yet, but run it BEFORE you merge the pull request
-- so countries are saved from the first signup.

-- 1. The country, as a two-letter code in capitals (NG, GH, GB, US ...)
alter table public.profiles add column if not exists country text;

alter table public.profiles drop constraint if exists profiles_country_check;
alter table public.profiles
  add constraint profiles_country_check check (country is null or country ~ '^[A-Z]{2}$');

-- 2. Signed-in people can read and save it (same as the other profile details)
grant select (country), insert (country), update (country) on public.profiles to authenticated;

-- 3. Every account made so far was made in Nigeria's launch, so mark them as Nigeria.
--    Anyone who is not can change their phone country in Settings, which updates it.
update public.profiles set country = 'NG' where country is null;
