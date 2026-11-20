-- 006: Køretid (skøn) mellem dagens opgaver til Min Dag
--
-- Der bruges ingen ekstern ruteservice. Køretiden er et skøn:
--   vejafstand = luftlinje (haversine) × 1,3
--   tid        = 3 min (start og parkering) + vejafstand / fart,
--                hvor farten er 30 km/t under 5 km, 50 km/t op til 20 km og ellers 75 km/t
-- Under 300 m giver 0 min (samme sted).
--
-- Funktionerne returnerer kun skøn mellem den kaldende brugers egne opgaver på dagen, i tidsorden.
-- Det er de opgaver, hvor brugeren er tildelt eller ansvarlig, og som er publiceret eller som brugeren selv er ansvarlig for.
-- Dagens første opgave og opgaver uden koordinater får intet skøn.
-- Kolonnerne assignments.route_distance_km og route_duration_min røres ikke.
--
-- Køres manuelt på produktionen efter godkendelse. Kan køres igen (create or replace).

create or replace function public.estimate_drive(
  p_lat1 double precision, p_lng1 double precision,
  p_lat2 double precision, p_lng2 double precision
)
returns table (distance_km numeric, duration_min integer)
language sql
immutable
parallel safe
set search_path to ''
as $$
  with d as (
    select 2 * 6371 * asin(sqrt(
             power(sin(radians(p_lat2 - p_lat1) / 2), 2)
             + cos(radians(p_lat1)) * cos(radians(p_lat2)) * power(sin(radians(p_lng2 - p_lng1) / 2), 2)
           )) * 1.3 as road_km
  )
  select round(road_km::numeric, 1) as distance_km,
         case
           when road_km < 0.3 then 0
           else ceil(3 + road_km / (case when road_km < 5 then 30 when road_km < 20 then 50 else 75 end) * 60)::integer
         end as duration_min
  from d
$$;

comment on function public.estimate_drive(double precision, double precision, double precision, double precision)
  is 'Skøn over køretid og vejafstand mellem to punkter (luftlinje × 1,3 og en simpel fartmodel). Ingen ekstern tjeneste.';

create or replace function public.get_my_day_drive_estimates(p_date date default current_date)
returns table (assignment_id uuid, from_assignment_id uuid, distance_km numeric, duration_min integer)
language sql
stable
security definer
set search_path to ''
as $$
  with mine as (
    select a.id, a.from_time, a.lat, a.lng
    from public.assignments a
    where a.assignment_date = p_date
      and coalesce(a.is_demo, false) = false
      and (a.published = true or a.responsible_user_id = auth.uid())
      and (
        a.responsible_user_id = auth.uid()
        or exists (
          select 1 from public.assignments_employees ae
          where ae.assignment_id = a.id and ae.user_id = auth.uid()
        )
      )
  ),
  ordered as (
    select m.id, m.lat, m.lng,
           lag(m.id)  over w as prev_id,
           lag(m.lat) over w as prev_lat,
           lag(m.lng) over w as prev_lng
    from mine m
    window w as (order by m.from_time, m.id)
  )
  select o.id, o.prev_id, e.distance_km, e.duration_min
  from ordered o
  cross join lateral public.estimate_drive(o.prev_lat, o.prev_lng, o.lat, o.lng) e
  where auth.uid() is not null
    and o.prev_id is not null
    and o.lat is not null and o.lng is not null
    and o.prev_lat is not null and o.prev_lng is not null
$$;

comment on function public.get_my_day_drive_estimates(date)
  is 'Min Dag: skønnet køretid fra forrige til næste af den kaldende brugers egne opgaver på en dag.';

revoke all on function public.get_my_day_drive_estimates(date) from public, anon;
grant execute on function public.get_my_day_drive_estimates(date) to authenticated;

revoke all on function public.estimate_drive(double precision, double precision, double precision, double precision) from public, anon;
grant execute on function public.estimate_drive(double precision, double precision, double precision, double precision) to authenticated;
