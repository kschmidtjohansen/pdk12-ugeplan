REVOKE EXECUTE ON FUNCTION public.cleanup_log_retention() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.list_department_absent_user_ids(uuid, date) FROM anon;