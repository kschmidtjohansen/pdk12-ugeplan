CREATE OR REPLACE FUNCTION public.swap_duty_employees(p_duty1_id uuid, p_duty2_id uuid, p_employee1_id uuid, p_employee2_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  d1 uuid; d2 uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT department_id INTO d1 FROM public.on_call_duties WHERE id = p_duty1_id;
  SELECT department_id INTO d2 FROM public.on_call_duties WHERE id = p_duty2_id;
  IF NOT FOUND OR d1 IS NULL OR d2 IS NULL THEN
    RAISE EXCEPTION 'Duty not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT (public.is_super_admin(auth.uid())
          OR (public.can_manage_duty_department(d1) AND public.can_manage_duty_department(d2))) THEN
    RAISE EXCEPTION 'Not allowed to swap these duties' USING ERRCODE = '42501';
  END IF;

  UPDATE public.on_call_duties SET employee_id = p_employee1_id, updated_at = now() WHERE id = p_duty1_id;
  UPDATE public.on_call_duties SET employee_id = p_employee2_id, updated_at = now() WHERE id = p_duty2_id;
END;
$function$;

-- Unused by the app and returns absences for any department: no client access.
REVOKE EXECUTE ON FUNCTION public.get_department_absences(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_department_absences(uuid, date) TO service_role;