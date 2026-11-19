-- 005 Statistik på delte 3D-links: hvornår et link er åbnet, hvor længe, hvor mange rum og på hvilken skærmtype.
-- Vi gemmer ikke IP-adresse, browser eller hvem der kiggede. Rækkerne skrives kun af edge-funktionen p360-link
-- (service role); medarbejdere kan læse dem, redaktører kan slette dem. Slettes et link, forsvinder statistikken med det.
-- Kør før den nye p360-link deployes. Funktionen virker også uden tabellen (den springer bare tællingen over).
-- Rollback: 005_p360_link_stats_rollback.sql
begin;
create table if not exists public.p360_link_views (
  id uuid primary key default gen_random_uuid(),
  token text not null references public.p360_links (token) on delete cascade,
  opened_at timestamptz not null default now(),
  seen_at timestamptz not null default now(),
  seconds int not null default 0 check (seconds between 0 and 14400),
  rooms int not null default 1 check (rooms between 0 and 500),
  device text not null default 'computer' check (device in ('computer', 'tablet', 'phone'))
);
create index if not exists p360_link_views_token on public.p360_link_views (token, opened_at desc);
alter table public.p360_link_views enable row level security;
drop policy if exists "p360 read link views" on public.p360_link_views;
drop policy if exists "p360 delete link views" on public.p360_link_views;
create policy "p360 read link views" on public.p360_link_views for select to authenticated using ((select public.p360_is_staff()));
create policy "p360 delete link views" on public.p360_link_views for delete to authenticated using ((select public.p360_can_edit()));
revoke all on table public.p360_link_views from public, anon;
grant select, delete on table public.p360_link_views to authenticated;
commit;
