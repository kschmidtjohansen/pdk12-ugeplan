-- Fix: "permission denied for function is_admin_from_jwt"
-- The function is referenced in RLS policies (e.g. assignments_employees_select_policy)
-- but the `authenticated` role lacks EXECUTE, causing all writes that trigger
-- the SELECT visibility check to fail — even for Super Admins.

GRANT EXECUTE ON FUNCTION public.is_admin_from_jwt() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_uid() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_jwt() TO authenticated, anon;