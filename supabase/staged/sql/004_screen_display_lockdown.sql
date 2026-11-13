-- 004 Screen display lock-down. Run only after every TV/screen uses a screen link (?screen=...) from Admin → Skærme.
-- After this, the old address with only ?departmentId= shows nothing unless someone is logged in on that screen.
-- Rollback: grant execute on the three functions to anon again.
begin;
revoke execute on function public.list_screen_display_assignments(uuid, uuid, date) from public, anon;
revoke execute on function public.list_screen_display_absences(uuid, date) from public, anon;
revoke execute on function public.list_screen_display_sub_departments(uuid) from public, anon;
grant execute on function public.list_screen_display_assignments(uuid, uuid, date) to authenticated;
grant execute on function public.list_screen_display_absences(uuid, date) to authenticated;
grant execute on function public.list_screen_display_sub_departments(uuid) to authenticated;
commit;
