-- STAGED — REVIEW ONLY. Rollback for 001_backend_security.sql.
-- Restores the previous has_role_permission + user_permissions SELECT policy.
-- New functions are dropped only AFTER the old Edge Functions are redeployed
-- (the staged Edge code depends on them).
BEGIN;

CREATE OR REPLACE FUNCTION public.has_role_permission(_permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = auth.uid() AND rp.permission = _permission
  ) OR EXISTS (
    SELECT 1 FROM public.user_permissions up
    WHERE up.user_id = auth.uid() AND up.permission = _permission AND up.granted
  );
$$;
REVOKE ALL ON FUNCTION public.has_role_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role_permission(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Read own or super admin user permissions" ON public.user_permissions;
CREATE POLICY "Authenticated can read user permissions" ON public.user_permissions
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);

DROP FUNCTION IF EXISTS public.swap_or_transfer_duty(uuid, uuid);
DROP FUNCTION IF EXISTS public.apply_absence_cleanup(uuid, date, date, boolean, time, time, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.replace_user_roles(uuid, public.user_role[]);
DROP FUNCTION IF EXISTS public.security_effective_permission_for(uuid, text);
DROP FUNCTION IF EXISTS public.security_user_department_ids(uuid);

COMMIT;
