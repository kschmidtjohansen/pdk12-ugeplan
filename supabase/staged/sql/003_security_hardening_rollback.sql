-- Rollback of 003_security_hardening.sql: restores the previous trainings policy and removes the screen links.
begin;

drop policy if exists "trainings_select_scoped" on public.trainings;
create policy "__mrg_sel_trainings_1c4eba68" on public.trainings for select to authenticated using (
  (is_demo = false)
  or (((select auth.jwt()) ->> 'email') = 'test@polygongroup.com')
  or ((user_id = (select auth.uid())) or public.is_admin_or_skadeleder())
);

drop function if exists public.list_screen_display_assignments_by_token(text, uuid, uuid, date);
drop function if exists public.list_screen_display_absences_by_token(text, uuid, date);
drop function if exists public.list_screen_display_sub_departments_by_token(text, uuid);
drop function if exists public.screen_display_token_ok(text, uuid);
drop table if exists public.screen_display_links;

alter function public.p360_rank(text) reset search_path;
grant execute on function public.verify_complete_fix() to authenticated;

commit;
