-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Lets riders say which areas (LGAs) they work in, so vendors can find riders who cover their area.
-- It is safe to run more than once.

-- 1. Where a rider's areas are saved. Each area looks like 'lagos:ikeja' (state, then LGA).
alter table public.profiles add column if not exists work_areas text[] not null default '{}';
create index if not exists profiles_work_areas_idx on public.profiles using gin (work_areas);

-- Riders read their own areas. They can NOT write this column directly; only the function below can.
grant select (work_areas) on public.profiles to authenticated;

-- 2. How many areas and states a rider may cover. Starter limit for everyone for now.
--    Later this is where trusted riders (ticked) get a wider limit.
create or replace function public.rider_area_limits(p_rider uuid, out max_areas int, out max_states int)
language sql
stable
as $$
  select 10, 2;
$$;

revoke all on function public.rider_area_limits(uuid) from public, anon, authenticated;

-- 3. A rider saves their own areas. The limits are checked here, on the server.
create or replace function public.set_my_work_areas(p_areas text[])
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  clean text[];
  lim record;
  state_count int;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  if not exists (select 1 from public.profiles where id = uid and role = 'rider') then
    raise exception 'Only riders can set work areas';
  end if;

  -- Tidy the list: lower case, no duplicates, only the 'state:area' shape
  select coalesce(array_agg(a order by a), '{}') into clean
  from (
    select distinct lower(trim(x)) as a
    from unnest(coalesce(p_areas, '{}')) as x
  ) t
  where a ~ '^[a-z0-9-]{2,40}:[a-z0-9-]{2,60}$';

  if coalesce(array_length(clean, 1), 0) < 1 then
    raise exception 'Choose at least one area where you work';
  end if;

  select * into lim from public.rider_area_limits(uid);

  if array_length(clean, 1) > lim.max_areas then
    raise exception 'You can cover up to % areas', lim.max_areas;
  end if;

  select count(distinct split_part(a, ':', 1)) into state_count from unnest(clean) as a;
  if state_count > lim.max_states then
    raise exception 'You can cover up to % states', lim.max_states;
  end if;

  update public.profiles set work_areas = clean where id = uid;
  return clean;
end;
$$;

revoke all on function public.set_my_work_areas(text[]) from public, anon;
grant execute on function public.set_my_work_areas(text[]) to authenticated;
