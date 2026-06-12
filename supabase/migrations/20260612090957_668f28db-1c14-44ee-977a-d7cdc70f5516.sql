
CREATE OR REPLACE FUNCTION public.list_cross_subdept_busy_resources(
  p_department_id uuid,
  p_date_from date,
  p_date_to date,
  p_exclude_sub_department_id uuid DEFAULT NULL
)
RETURNS TABLE(
  assignment_date date,
  from_time time without time zone,
  to_time time without time zone,
  employee_ids uuid[],
  car_ids uuid[],
  sub_department_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_role text;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  SELECT COALESCE(ur.role::text, 'servicemedarbejder')
  INTO current_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = current_user_id
  LIMIT 1;

  IF p_department_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    a.assignment_date,
    a.from_time,
    a.to_time,
    COALESCE(
      (SELECT array_agg(ae.user_id)
       FROM public.assignments_employees ae
       WHERE ae.assignment_id = a.id
         AND COALESCE(ae.is_demo, false) = false),
      ARRAY[]::uuid[]
    ) AS employee_ids,
    COALESCE(
      (SELECT array_agg(
         CASE WHEN elem ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN elem::uuid ELSE NULL END)
       FROM unnest(a.car_ids) AS elem),
      ARRAY[]::uuid[]
    ) AS car_ids,
    a.sub_department_id
  FROM public.assignments a
  WHERE COALESCE(a.is_demo, false) = false
    AND a.department_id = p_department_id
    AND a.assignment_date BETWEEN p_date_from AND p_date_to
    AND a.sub_department_id IS DISTINCT FROM p_exclude_sub_department_id
    AND (
      current_user_role IN ('administrator', 'skadeleder', 'super_admin')
      OR a.published = true
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.list_cross_subdept_busy_resources(uuid, date, date, uuid) TO authenticated;
