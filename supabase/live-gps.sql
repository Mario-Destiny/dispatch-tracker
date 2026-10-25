-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Live rider location for deliveries that are "in_transit".
-- Safe to run more than once.

-- 1. One row per delivery holding the rider's latest position
create table if not exists public.rider_locations (
  delivery_id uuid primary key references public.deliveries(id) on delete cascade,
  rider_id uuid not null,
  lat double precision not null,
  lng double precision not null,
  accuracy real,
  heading real,
  updated_at timestamptz not null default now()
);

alter table public.rider_locations enable row level security;

-- Only the rider who owns the delivery, and the vendor/company that created it, can read rows.
-- Nobody can write directly: writes go through update_my_location() below.
drop policy if exists "rider reads own location" on public.rider_locations;
create policy "rider reads own location" on public.rider_locations
  for select to authenticated
  using (rider_id = auth.uid());

drop policy if exists "owner reads delivery location" on public.rider_locations;
create policy "owner reads delivery location" on public.rider_locations
  for select to authenticated
  using (exists (
    select 1 from public.deliveries d
    where d.id = rider_locations.delivery_id and d.vendor_id = auth.uid()
  ));

-- 2. Rider sends their position. Only works for their own delivery that is in transit.
create or replace function public.update_my_location(
  p_delivery_id uuid, p_lat double precision, p_lng double precision,
  p_accuracy real default null, p_heading real default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then
    raise exception 'Invalid position';
  end if;
  if not exists (
    select 1 from public.deliveries
    where id = p_delivery_id and rider_id = auth.uid() and status = 'in_transit'
  ) then
    raise exception 'Delivery is not in transit for this rider';
  end if;
  insert into public.rider_locations as rl (delivery_id, rider_id, lat, lng, accuracy, heading, updated_at)
  values (p_delivery_id, auth.uid(), p_lat, p_lng, p_accuracy, p_heading, now())
  on conflict (delivery_id) do update
    set lat = excluded.lat, lng = excluded.lng, accuracy = excluded.accuracy,
        heading = excluded.heading, updated_at = now(), rider_id = excluded.rider_id;
end;
$$;
revoke all on function public.update_my_location(uuid, double precision, double precision, real, real) from public, anon;
grant execute on function public.update_my_location(uuid, double precision, double precision, real, real) to authenticated;

-- 3. Customer (no login) asks for the rider position using the tracking code.
--    Returns something only while the delivery is in transit and the position is fresh (10 min).
create or replace function public.track_location(p_code text)
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'rider_lat', rl.lat,
    'rider_lng', rl.lng,
    'updated_at', rl.updated_at,
    'dropoff_lat', d.dropoff_lat,
    'dropoff_lng', d.dropoff_lng
  )
  from public.deliveries d
  left join public.rider_locations rl
    on rl.delivery_id = d.id and rl.updated_at > now() - interval '10 minutes'
  where d.tracking_code = upper(trim(p_code)) and d.status = 'in_transit'
  limit 1;
$$;
revoke all on function public.track_location(text) from public;
grant execute on function public.track_location(text) to anon, authenticated;

-- 4. Privacy: delete the saved position as soon as the delivery leaves "in_transit"
create or replace function public.clear_location_when_done()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from 'in_transit' then
    delete from public.rider_locations where delivery_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clear_location on public.deliveries;
create trigger trg_clear_location
  after update of status on public.deliveries
  for each row execute function public.clear_location_when_done();
