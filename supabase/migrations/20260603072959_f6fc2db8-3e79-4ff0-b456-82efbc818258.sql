
-- ============================================================
-- Security hardening migration
-- ============================================================

-- 1. Drop overly-permissive {public} SELECT policies
DROP POLICY IF EXISTS "Users can view all cars" ON public.cars;
DROP POLICY IF EXISTS "Users can view all warehouse items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;

-- Revoke anon SELECT (defence in depth)
REVOKE SELECT ON public.cars FROM anon;
REVOKE SELECT ON public.warehouse_items FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;

-- 2. Tighten storage INSERT for assignment-files (members only)
DROP POLICY IF EXISTS "Storage insert: assignment files or avatars" ON storage.objects;

CREATE POLICY "Storage insert assignment-files (members only)"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files'
  AND (
    public.is_admin_or_skadeleder()
    OR EXISTS (
      SELECT 1 FROM public.assignments_employees ae
      WHERE ae.user_id = auth.uid()
        AND ae.assignment_id::text = (storage.foldername(name))[1]
    )
    OR EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.responsible_user_id = auth.uid()
        AND a.id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Storage insert avatars (own folder)"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Super admin access to assignments
CREATE OR REPLACE FUNCTION public.can_view_assignment_optimized(assignment_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = can_view_assignment_optimized.user_id
        AND role IN ('super_admin', 'administrator', 'skadeleder')
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.assignments_employees
      WHERE assignments_employees.assignment_id = can_view_assignment_optimized.assignment_id
        AND assignments_employees.user_id = can_view_assignment_optimized.user_id
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.assignments
      WHERE assignments.id = can_view_assignment_optimized.assignment_id
        AND assignments.responsible_user_id = can_view_assignment_optimized.user_id
      LIMIT 1
    )
  );
$function$;

-- 4. Remove logging side-effect from RLS USING clause on profiles
DROP POLICY IF EXISTS secure_profile_access_unified ON public.profiles;

CREATE POLICY secure_profile_access_unified
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrator','skadeleder','super_admin']::public.user_role[])
  )
);

-- 5. Lock down SECURITY DEFINER helpers: revoke from PUBLIC/anon, grant to authenticated + service_role
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon',
                   fn.nspname, fn.proname, fn.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role',
                   fn.nspname, fn.proname, fn.args);
  END LOOP;
END$$;

-- log_security_event_safe should not be callable by regular users
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'log_security_event_safe'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.log_security_event_safe(%s) FROM authenticated', fn.args);
  END LOOP;
END$$;
