-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Powers live rider location on the tracking page and the vendor dashboard.
-- It is safe to run more than once.

-- 1. One row per delivery: the rider's latest position. No history is kept.
create table if not exists public.rider_locations (
  delivery_id uuid primary key references public.deliveries(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy real,
  updated_at timestamptz not null default now()
);

-- Nobody reads or writes this table directly. Only the functions below can.
alter table public.rider_locations enable row level security;

-- 2. The assigned rider sends their position (only while the delivery is in transit)
create or replace function public.share_location(
  p_delivery uuid, p_lat double precision, p_lng double precision, p_accuracy real default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then
    return false;
  end if;
  if not exists (
    select 1 from public.deliveries d
    where d.id = p_delivery and d.rider_id = auth.uid() and d.status = 'in_transit'
  ) then
    return false;
  end if;
  insert into public.rider_locations (delivery_id, rider_id, lat, lng, accuracy, updated_at)
  values (p_delivery, auth.uid(), p_lat, p_lng, p_accuracy, now())
  on conflict (delivery_id) do update
    set lat = excluded.lat, lng = excluded.lng, accuracy = excluded.accuracy,
        rider_id = excluded.rider_id, updated_at = now();
  return true;
end;
$$;

-- 3. The location is wiped as soon as the delivery stops being "in transit"
create or replace function public.clear_rider_location()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.rider_locations where delivery_id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_clear_rider_location on public.deliveries;
create trigger trg_clear_rider_location
  after update of status on public.deliveries
  for each row
  when (new.status is distinct from old.status and new.status <> 'in_transit')
  execute function public.clear_rider_location();

-- 4. Customer: look up the rider by tracking code (only while in transit, and only if fresh)
create or replace function public.track_location(p_code text)
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'lat', l.lat,
    'lng', l.lng,
    'accuracy', l.accuracy,
    'updated_at', l.updated_at,
    'dropoff_lat', d.dropoff_lat,
    'dropoff_lng', d.dropoff_lng
  )
  from public.deliveries d
  join public.rider_locations l on l.delivery_id = d.id
  where d.tracking_code = upper(trim(p_code))
    and d.status = 'in_transit'
    and l.updated_at > now() - interval '10 minutes'
  limit 1;
$$;

-- 5. Vendor or company: locations for their own deliveries that are in transit
create or replace function public.my_delivery_locations()
returns table (delivery_id uuid, lat double precision, lng double precision, accuracy real, updated_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select l.delivery_id, l.lat, l.lng, l.accuracy, l.updated_at
  from public.deliveries d
  join public.rider_locations l on l.delivery_id = d.id
  where d.vendor_id = auth.uid()
    and d.status = 'in_transit'
    and l.updated_at > now() - interval '10 minutes';
$$;

revoke all on function public.share_location(uuid, double precision, double precision, real) from public, anon;
grant execute on function public.share_location(uuid, double precision, double precision, real) to authenticated;

revoke all on function public.track_location(text) from public;
grant execute on function public.track_location(text) to anon, authenticated;

revoke all on function public.my_delivery_locations() from public, anon;
grant execute on function public.my_delivery_locations() to authenticated;
