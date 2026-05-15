
-- Wrapper in public schema to call demo.cleanup_session_data via PostgREST
CREATE OR REPLACE FUNCTION public.cleanup_session_data(baseline_timestamp timestamptz)
RETURNS TABLE(deleted_assignments integer, deleted_notifications integer, deleted_vacations integer, deleted_warehouse integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY SELECT * FROM demo.cleanup_session_data(baseline_timestamp);
END;
$$;

-- Harden search_path on the 5 flagged functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = auth.uid();
  RETURN COALESCE(v_role, 'servicemedarbejder'::public.user_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('administrator', 'super_admin')
  );
END;
$$;

ALTER FUNCTION public.cleanup_demo_data_ttl() SET search_path = '';
ALTER FUNCTION public.reset_demo_data() SET search_path = '';
ALTER FUNCTION public.list_accessible_assignments_with_team(uuid, uuid) SET search_path = '';
