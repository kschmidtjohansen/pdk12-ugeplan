REVOKE ALL ON FUNCTION public.can_review_vacations(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_vacation_review_permission() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_review_vacations(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_vacation_review_permission() TO service_role;