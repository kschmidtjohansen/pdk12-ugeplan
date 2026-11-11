-- Fjerner alt fra 002_polygon_360.sql igen. Rører ikke eksisterende PolyPlan-data.
-- OBS: sletter alle 3D-rundvisninger. Tag en eksport først, hvis de skal gemmes.
-- Billederne: tøm og slet bucket'en p360 bagefter i Supabase under Storage (Supabase tillader ikke at slette filer med SQL).
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'p360 %' loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;
drop table if exists public.p360_link_scenes, public.p360_links, public.p360_scenes, public.p360_tours, public.p360_shares,
  public.p360_locks, public.p360_views, public.p360_prefs, public.p360_depts, public.p360_config, public.p360_role_map, public.p360_staff cascade;
drop function if exists public.p360_lock(text, text, int), public.p360_bump_view(text), public.p360_join(text),
  public.p360_staff_list(), public.p360_role_map_list(), public.p360_set_role_map(text, text), public.p360_set_staff_role(uuid, text),
  public.p360_is_admin(), public.p360_can_edit(), public.p360_is_staff(), public.p360_role(), public.p360_account_ok(uuid),
  public.p360_site_roles(), public.p360_find_roles(), public.p360_rank(text) cascade;
