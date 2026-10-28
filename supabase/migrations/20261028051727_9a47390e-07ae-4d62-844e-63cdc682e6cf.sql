CREATE OR REPLACE FUNCTION public.can_review_vacations(_department_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
    OR (
      _department_id IS NOT NULL
      AND public.can_access_department_data(_department_id)
      AND COALESCE(
        (SELECT granted FROM public.user_permissions WHERE user_id = auth.uid() AND permission = 'approve_vacations'),
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator')
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.role_permissions rp ON rp.role = ur.role
          WHERE ur.user_id = auth.uid() AND rp.permission = 'approve_vacations'
        ), false
      )
    )
  );
$$;
REVOKE ALL ON FUNCTION public.can_review_vacations(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_review_vacations(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_vacation_review_permission()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Trusted server jobs keep their existing service-role behavior.
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'pending'::public.vacation_status
       OR NEW.reviewed_by IS NOT NULL OR NEW.reviewed_at IS NOT NULL THEN
      IF NOT public.can_review_vacations(NEW.department_id) THEN
        RAISE EXCEPTION 'Du har ikke tilladelse til at godkende eller afvise fridage.' USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSE
    -- Also protects own pending requests, reviewer spoofing and status resets.
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
      IF NOT public.can_review_vacations(OLD.department_id)
         OR NOT public.can_review_vacations(NEW.department_id) THEN
        RAISE EXCEPTION 'Du har ikke tilladelse til at godkende eller afvise fridage.' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_vacation_review_permission() FROM PUBLIC;
CREATE TRIGGER enforce_vacation_review_permission
BEFORE INSERT OR UPDATE ON public.vacations
FOR EACH ROW EXECUTE FUNCTION public.enforce_vacation_review_permission();