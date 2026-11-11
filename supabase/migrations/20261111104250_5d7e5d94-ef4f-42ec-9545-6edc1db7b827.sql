-- 1) Only planners may change the published flag
CREATE OR REPLACE FUNCTION public.enforce_assignment_publish_permission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.published IS DISTINCT FROM OLD.published
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin_or_skadeleder()
     AND NOT (public.has_role_permission('plan_assignments') AND public.can_access_department_data(NEW.department_id))
  THEN
    RAISE EXCEPTION 'Du har ikke tilladelse til at publicere opgaver.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_assignment_publish_permission() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_assignment_publish_permission ON public.assignments;
CREATE TRIGGER enforce_assignment_publish_permission
BEFORE UPDATE OF published ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.enforce_assignment_publish_permission();

-- 2) Vacation cleanup only for admins / service role
CREATE OR REPLACE FUNCTION public.delete_old_rejected_vacations()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  rejected_deleted_count INTEGER := 0;
  expired_deleted_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_super_admin(auth.uid())
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator') THEN
    RAISE EXCEPTION 'Ikke tilladt' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.vacations WHERE status = 'rejected' AND updated_at < (NOW() - INTERVAL '14 days');
  GET DIAGNOSTICS rejected_deleted_count = ROW_COUNT;
  DELETE FROM public.vacations WHERE status = 'approved' AND end_date < CURRENT_DATE;
  GET DIAGNOSTICS expired_deleted_count = ROW_COUNT;

  PERFORM public.log_security_event_safe(
    'vacation_cleanup_combined',
    format('Deleted %s old rejected requests and %s expired approved requests', rejected_deleted_count, expired_deleted_count),
    jsonb_build_object('rejected_deleted_count', rejected_deleted_count, 'expired_deleted_count', expired_deleted_count, 'cleanup_type', 'automated'),
    'info');
END;
$function$;

-- 3) Department helpers: callers may only query themselves (super_admin / service exempt)
CREATE OR REPLACE FUNCTION public.get_user_department_ids(_user_id uuid DEFAULT auth.uid())
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE(array_agg(DISTINCT department_id), ARRAY[]::UUID[])
  FROM public.user_access
  WHERE user_id = _user_id
    AND (auth.uid() IS NULL OR _user_id = auth.uid() OR is_super_admin(auth.uid()));
$function$;

CREATE OR REPLACE FUNCTION public.can_access_department_data(_dept_id uuid, _sub_dept_id uuid DEFAULT NULL::uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT (auth.uid() IS NULL OR _user_id = auth.uid() OR is_super_admin(auth.uid()))
  AND (
    is_super_admin(_user_id)
    OR (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'administrator')
      AND _dept_id = ANY(get_user_department_ids(_user_id))
    )
    OR EXISTS (
      SELECT 1 FROM public.user_access
      WHERE user_id = _user_id AND department_id = _dept_id
        AND (_sub_dept_id IS NULL OR sub_department_id IS NULL OR sub_department_id = _sub_dept_id)
    )
  );
$function$;

-- 4) role_permissions: read only rows for own roles (super admins see all)
DROP POLICY IF EXISTS "Authenticated can read role permissions" ON public.role_permissions;
CREATE POLICY "Users read permissions for own roles" ON public.role_permissions
FOR SELECT TO authenticated
USING (
  public.is_super_admin((SELECT auth.uid()))
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = role_permissions.role)
);