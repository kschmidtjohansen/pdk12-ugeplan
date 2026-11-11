-- =====================================================================
-- STAGED — køres manuelt i Supabase SQL Editor. Ikke en migration. Hele filen er én transaktion.
-- =====================================================================
-- PolyPlan: 3D-scanninger (Polygon 360-rundvisninger) på /3d/index.html
-- STAGED: køres manuelt i Supabase -> SQL Editor. Ændrer ingen eksisterende tabeller, funktioner eller regler;
-- alt nyt hedder p360_*. user_roles og profiles bliver kun læst. Fortryd med 002_polygon_360_rollback.sql.
BEGIN;
-- Kør hele filen én gang i Supabase: SQL Editor -> New query -> indsæt -> Run.
-- Filen kan køres igen uden at skade data.

-- ---------- Medarbejdere og roller ----------
-- Adgangen kommer to steder fra, og den højeste rolle gælder:
--   1) jeres eksisterende roller på polyplan.dk (fx tabellen user_roles), oversat via p360_role_map
--   2) en rolle givet direkte i 3D-siden under Indstillinger -> Brugere (p360_staff)
create table if not exists public.p360_staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  role text not null default 'pending' check (role in ('pending', 'viewer', 'editor', 'admin')),
  created_at timestamptz not null default now()
);

-- Oversættelse fra sidens roller til 3D-rollerne. Ret den i 3D-siden under Indstillinger -> Brugere.
create table if not exists public.p360_role_map (
  site_role text primary key,
  role text not null check (role in ('none', 'viewer', 'editor', 'admin'))
);
insert into public.p360_role_map (site_role, role) values
  ('super_admin', 'admin'), ('administrator', 'admin'),
  ('skadeleder', 'editor'), ('fugttekniker', 'editor'),
  ('servicemedarbejder', 'viewer'), ('vikar', 'none')
on conflict (site_role) do nothing;

create or replace function public.p360_rank(r text) returns int
language sql immutable as $$
  select case r when 'admin' then 3 when 'editor' then 2 when 'viewer' then 1 when 'pending' then 0 else -1 end
$$;

-- Finder de tabeller, hvor sidens roller ligger, og laver p360_site_roles(), der læser dem.
-- Understøtter user_roles (user_id, role) og profiles (id eller user_id, role).
-- Kør "select public.p360_find_roles();" igen, hvis I senere flytter rollerne.
create or replace function public.p360_find_roles() returns text
language plpgsql security definer set search_path = public as $$
declare
  parts text[] := '{}';
  col text;
  found text := '';
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_roles' and column_name = 'role')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_roles' and column_name = 'user_id') then
    parts := array_append(parts, 'select user_id, role::text from public.user_roles');
    found := found || 'user_roles ';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'role') then
    select c.column_name into col from information_schema.columns c
     where c.table_schema = 'public' and c.table_name = 'profiles' and c.column_name in ('user_id', 'id') and c.udt_name = 'uuid'
     order by (c.column_name = 'user_id') desc limit 1;
    if col is not null then
      parts := array_append(parts, format('select %I, role::text from public.profiles where role is not null', col));
      found := found || 'profiles ';
    end if;
  end if;
  if array_length(parts, 1) is null then
    parts := array['select null::uuid, null::text where false'];
  end if;
  execute format($f$
    create or replace function public.p360_site_roles() returns table (user_id uuid, site_role text)
    language sql stable security definer set search_path = public as $b$ %s $b$
  $f$, array_to_string(parts, ' union all '));
  revoke all on function public.p360_site_roles() from public, anon, authenticated;
  return coalesce(nullif(trim(found), ''), 'ingen');
end $$;
select public.p360_find_roles();

-- Kun aktive (eller orlov) medarbejdere, ikke demo-konti og ikke udløbne vikarkonti. IT-Support (super_admin) altid.
create or replace function public.p360_account_ok(p_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_uid is not null and (
    exists (select 1 from public.user_roles r where r.user_id = p_uid and r.role::text = 'super_admin')
    or exists (select 1 from public.profiles p where p.id = p_uid
               and coalesce(p.is_demo, false) = false
               and p.status::text in ('active', 'on_leave')
               and (p.expires_at is null or p.expires_at > now())))
$$;

create or replace function public.p360_role() returns text
language sql stable security definer set search_path = public as $$
  select case when not public.p360_account_ok(auth.uid()) then null else
    case max(public.p360_rank(r)) when 3 then 'admin' when 2 then 'editor' when 1 then 'viewer' when 0 then 'pending' end end
  from (
    select role as r from public.p360_staff where user_id = auth.uid()
    union all
    select m.role from public.p360_site_roles() s join public.p360_role_map m on m.site_role = s.site_role where s.user_id = auth.uid()
  ) x
$$;
create or replace function public.p360_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.p360_role() in ('viewer', 'editor', 'admin'), false)
$$;
create or replace function public.p360_can_edit() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.p360_role() in ('editor', 'admin'), false)
$$;
create or replace function public.p360_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.p360_role() = 'admin', false)
$$;

-- Første login: registrér personen. Har ingen endnu adgang som administrator (hverken via sidens
-- roller eller direkte), bliver den første administrator. Alle andre uden rolle venter på godkendelse.
create or replace function public.p360_join(p_name text default null) returns text
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  if auth.uid() is null then return null; end if;
  lock table public.p360_staff in share row exclusive mode;
  if not exists (select 1 from public.p360_staff where user_id = auth.uid()) then
    r := case when exists (select 1 from public.p360_staff where role = 'admin')
                or exists (select 1 from public.p360_site_roles() s join public.p360_role_map m on m.site_role = s.site_role where m.role = 'admin')
              then 'pending' else 'admin' end;
    insert into public.p360_staff (user_id, email, name, role)
    values (auth.uid(), auth.jwt() ->> 'email', nullif(trim(p_name), ''), r);
  end if;
  return public.p360_role();
end $$;

-- Brugerlisten til administratoren: alle, der har været på 3D-siden, og alle med en sidens rolle.
create or replace function public.p360_staff_list() returns table (user_id uuid, email text, name text, role text, site_roles text, site_level text, effective text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  with sr as (
    select s.user_id, string_agg(distinct s.site_role, ', ') as site_roles,
           max(public.p360_rank(m.role)) as lvl
    from public.p360_site_roles() s left join public.p360_role_map m on m.site_role = s.site_role
    group by s.user_id
  ), ids as (
    select p.user_id from public.p360_staff p
    union
    select sr.user_id from sr where sr.lvl >= 1
  )
  select i.user_id, coalesce(p.email, u.email::text), p.name, coalesce(p.role, 'pending'), sr.site_roles,
         case sr.lvl when 3 then 'admin' when 2 then 'editor' when 1 then 'viewer' end,
         case greatest(public.p360_rank(coalesce(p.role, 'pending')), coalesce(sr.lvl, -1)) when 3 then 'admin' when 2 then 'editor' when 1 then 'viewer' else 'pending' end,
         coalesce(p.created_at, u.created_at)
  from ids i
  left join public.p360_staff p on p.user_id = i.user_id
  left join sr on sr.user_id = i.user_id
  left join auth.users u on u.id = i.user_id
  where public.p360_is_admin() and public.p360_account_ok(i.user_id)
  order by 8
$$;

-- Sidens roller og hvad de giver i 3D-siden (kun administrator).
create or replace function public.p360_role_map_list() returns table (site_role text, role text, users bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(s.site_role, m.site_role), coalesce(m.role, 'none'), count(s.user_id)
  from (select site_role, user_id from public.p360_site_roles()) s
  full join public.p360_role_map m on m.site_role = s.site_role
  where public.p360_is_admin()
  group by 1, 2 order by 1
$$;
create or replace function public.p360_set_role_map(p_site_role text, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.p360_is_admin() then raise exception 'kun administrator'; end if;
  if p_role not in ('none', 'viewer', 'editor', 'admin') then raise exception 'ukendt rolle'; end if;
  insert into public.p360_role_map (site_role, role) values (p_site_role, p_role)
  on conflict (site_role) do update set role = excluded.role;
end $$;
-- Giv en bruger en rolle direkte (også en, der endnu ikke har været på 3D-siden).
create or replace function public.p360_set_staff_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.p360_is_admin() then raise exception 'kun administrator'; end if;
  if p_role not in ('pending', 'viewer', 'editor', 'admin') then raise exception 'ukendt rolle'; end if;
  insert into public.p360_staff (user_id, email, role)
  values (p_user, (select email from auth.users where id = p_user), p_role)
  on conflict (user_id) do update set role = excluded.role;
end $$;

alter table public.p360_role_map enable row level security;

-- ---------- Data ----------
create table if not exists public.p360_config (id int primary key default 1 check (id = 1), doc jsonb not null default '{}');
create table if not exists public.p360_depts (id text primary key, doc jsonb not null);
create table if not exists public.p360_tours (
  id text primary key,
  doc jsonb not null,
  dept text generated always as (doc ->> 'dept') stored,
  status text generated always as (doc ->> 'status') stored,
  arch boolean generated always as (coalesce((doc ->> 'arch')::boolean, false)) stored,
  updated_at bigint generated always as (coalesce((doc ->> 'updatedAt')::bigint, 0)) stored
);
create index if not exists p360_tours_list on public.p360_tours (arch, dept, status, updated_at desc);
create table if not exists public.p360_scenes (
  tour_id text not null references public.p360_tours (id) on delete cascade,
  id text not null,
  doc jsonb not null,
  primary key (tour_id, id)
);
create table if not exists public.p360_shares (
  id text primary key,
  doc jsonb not null,
  at bigint generated always as (coalesce((doc ->> 'at')::bigint, 0)) stored
);
create index if not exists p360_shares_at on public.p360_shares (at desc);
-- Links til forsikringen: en kopi af rundvisningen under et token, der ikke kan gættes.
create table if not exists public.p360_links (
  token text primary key check (token ~ '^[a-z0-9]{12,40}$'),
  tour_id text not null,
  doc jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.p360_link_scenes (
  token text not null references public.p360_links (token) on delete cascade,
  id text not null,
  doc jsonb not null,
  primary key (token, id)
);
create table if not exists public.p360_locks (tour_id text primary key, holder text not null, by_user uuid, until timestamptz not null);
create table if not exists public.p360_views (tour_id text not null, user_id uuid not null, n int not null default 0, at timestamptz not null default now(), primary key (tour_id, user_id));
create table if not exists public.p360_prefs (user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade, doc jsonb not null default '{}');

-- ---------- Adgangsregler (Row Level Security) ----------
alter table public.p360_staff enable row level security;
alter table public.p360_config enable row level security;
alter table public.p360_depts enable row level security;
alter table public.p360_tours enable row level security;
alter table public.p360_scenes enable row level security;
alter table public.p360_shares enable row level security;
alter table public.p360_links enable row level security;
alter table public.p360_link_scenes enable row level security;
alter table public.p360_locks enable row level security;
alter table public.p360_views enable row level security;
alter table public.p360_prefs enable row level security;

-- fjern gamle udgaver af reglerne, så filen kan køres igen
do $$
declare r record;
begin
  for r in select policyname, schemaname, tablename from pg_policies where policyname like 'p360 %' loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

create policy "p360 staff see staff" on public.p360_staff for select to authenticated using ((select public.p360_is_staff()) or user_id = auth.uid());
create policy "p360 admin edits staff" on public.p360_staff for update to authenticated using ((select public.p360_is_admin())) with check ((select public.p360_is_admin()));
create policy "p360 admin removes staff" on public.p360_staff for delete to authenticated using ((select public.p360_is_admin()) and user_id <> auth.uid());

create policy "p360 read config" on public.p360_config for select to authenticated using ((select public.p360_is_staff()));
create policy "p360 admin writes config" on public.p360_config for all to authenticated using ((select public.p360_is_admin())) with check ((select public.p360_is_admin()));
create policy "p360 read depts" on public.p360_depts for select to authenticated using ((select public.p360_is_staff()));
create policy "p360 admin writes depts" on public.p360_depts for all to authenticated using ((select public.p360_is_admin())) with check ((select public.p360_is_admin()));

create policy "p360 read tours" on public.p360_tours for select to authenticated using ((select public.p360_is_staff()));
create policy "p360 edit tours" on public.p360_tours for all to authenticated using ((select public.p360_can_edit())) with check ((select public.p360_can_edit()));
create policy "p360 read scenes" on public.p360_scenes for select to authenticated using ((select public.p360_is_staff()));
create policy "p360 edit scenes" on public.p360_scenes for all to authenticated using ((select public.p360_can_edit())) with check ((select public.p360_can_edit()));
create policy "p360 read shares" on public.p360_shares for select to authenticated using ((select public.p360_is_staff()));
create policy "p360 add shares" on public.p360_shares for insert to authenticated with check ((select public.p360_can_edit()));
create policy "p360 read links" on public.p360_links for select to authenticated using ((select public.p360_is_staff()));
create policy "p360 edit links" on public.p360_links for all to authenticated using ((select public.p360_can_edit())) with check ((select public.p360_can_edit()));
create policy "p360 read link scenes" on public.p360_link_scenes for select to authenticated using ((select public.p360_is_staff()));
create policy "p360 edit link scenes" on public.p360_link_scenes for all to authenticated using ((select public.p360_can_edit())) with check ((select public.p360_can_edit()));
create policy "p360 read views" on public.p360_views for select to authenticated using ((select public.p360_is_staff()));
create policy "p360 edit views" on public.p360_views for delete to authenticated using ((select public.p360_can_edit()));
create policy "p360 own prefs" on public.p360_prefs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- p360_locks har ingen regler: den bruges kun gennem p360_lock().

-- ---------- Funktioner ----------
-- Kun én redigerer ad gangen: lås, der udløber af sig selv.
create or replace function public.p360_lock(p_tour text, p_holder text, p_ttl_ms int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.p360_locks;
begin
  if not public.p360_can_edit() then return jsonb_build_object('ok', true); end if;
  select * into r from public.p360_locks where tour_id = p_tour for update;
  if found and r.until > now() and r.holder <> p_holder then
    return jsonb_build_object('ok', false, 'by', r.by_user);
  end if;
  insert into public.p360_locks (tour_id, holder, by_user, until)
  values (p_tour, p_holder, auth.uid(), now() + make_interval(secs => greatest(1, least(p_ttl_ms, 600000)) / 1000.0))
  on conflict (tour_id) do update set holder = excluded.holder, by_user = excluded.by_user, until = excluded.until;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.p360_bump_view(p_tour text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.p360_is_staff() then return; end if;
  insert into public.p360_views (tour_id, user_id, n, at) values (p_tour, auth.uid(), 1, now())
  on conflict (tour_id, user_id) do update set n = public.p360_views.n + 1, at = now();
end $$;

revoke all on function public.p360_account_ok(uuid) from public, anon, authenticated;
revoke all on function public.p360_join(text), public.p360_lock(text, text, int), public.p360_bump_view(text), public.p360_staff_list(), public.p360_role_map_list(), public.p360_set_role_map(text, text), public.p360_set_staff_role(uuid, text), public.p360_find_roles() from public, anon;
grant execute on function public.p360_join(text), public.p360_lock(text, text, int), public.p360_bump_view(text), public.p360_staff_list(), public.p360_role_map_list(), public.p360_set_role_map(text, text), public.p360_set_staff_role(uuid, text) to authenticated;
revoke all on function public.p360_find_roles() from authenticated;
revoke all on function public.p360_role(), public.p360_is_staff(), public.p360_can_edit(), public.p360_is_admin() from public, anon;
grant execute on function public.p360_role(), public.p360_is_staff(), public.p360_can_edit(), public.p360_is_admin() to authenticated;

-- ---------- Billedlager ----------
-- Privat: billederne kan kun hentes af medarbejdere eller via et tidsbegrænset link fra p360-link.
insert into storage.buckets (id, name, public) values ('p360', 'p360', false) on conflict (id) do update set public = false;
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'p360 %' loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;
create policy "p360 staff read images" on storage.objects for select to authenticated using (bucket_id = 'p360' and (select public.p360_is_staff()));
create policy "p360 editors add images" on storage.objects for insert to authenticated with check (bucket_id = 'p360' and (select public.p360_can_edit()));
create policy "p360 editors change images" on storage.objects for update to authenticated using (bucket_id = 'p360' and (select public.p360_can_edit()));
create policy "p360 editors delete images" on storage.objects for delete to authenticated using (bucket_id = 'p360' and (select public.p360_can_edit()));

COMMIT;
