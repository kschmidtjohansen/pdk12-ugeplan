CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role::text
    WHEN 'super_admin' THEN 1 WHEN 'administrator' THEN 2 WHEN 'skadeleder' THEN 3
    WHEN 'fugttekniker' THEN 4 WHEN 'servicemedarbejder' THEN 5 WHEN 'vikar' THEN 6 ELSE 7 END
  LIMIT 1;
  RETURN COALESCE(v_role, 'servicemedarbejder'::public.user_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_accessible_assignments_with_team(p_department_id uuid DEFAULT NULL::uuid, p_sub_department_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, title text, description text, assignment_date date, from_time time without time zone, to_time time without time zone, location text, type assignment_type, published boolean, responsible_user_id uuid, car_id uuid, car_ids uuid[], case_number text, created_at timestamp with time zone, updated_at timestamp with time zone, team jsonb, responsible_user jsonb, sub_department_id uuid, lat double precision, lng double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
  is_leader boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id
      AND ur.role::text IN ('administrator', 'skadeleder', 'super_admin')
  ) INTO is_leader;

  RETURN QUERY
  SELECT
    a.id, a.title, a.description, a.assignment_date, a.from_time, a.to_time,
    a.location, a.type, a.published, a.responsible_user_id, a.car_id,
    COALESCE(
      (SELECT array_agg(
          CASE WHEN elem ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
               THEN elem::uuid ELSE NULL END)
       FROM unnest(a.car_ids) AS elem),
      ARRAY[]::uuid[]
    ) AS car_ids,
    a.case_number, a.created_at, a.updated_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'email', p.email))
       FROM public.assignments_employees ae
       JOIN public.profiles p ON ae.user_id = p.id
       WHERE ae.assignment_id = a.id
         AND COALESCE(ae.is_demo, false) = false
         AND COALESCE(p.is_demo, false) = false),
      '[]'::jsonb
    ) AS team,
    CASE WHEN rp.id IS NOT NULL THEN
      jsonb_build_object('id', rp.id, 'name', rp.name, 'email', rp.email)
    ELSE NULL END AS responsible_user,
    a.sub_department_id,
    a.lat,
    a.lng
  FROM public.assignments a
  LEFT JOIN public.profiles rp ON a.responsible_user_id = rp.id AND COALESCE(rp.is_demo, false) = false
  WHERE COALESCE(a.is_demo, false) = false
    AND (is_leader OR a.published = true OR a.responsible_user_id = current_user_id)
    AND (p_department_id IS NULL OR a.department_id = p_department_id)
    AND (
      (p_sub_department_id IS NULL AND a.sub_department_id IS NULL)
      OR (p_sub_department_id IS NOT NULL AND a.sub_department_id = p_sub_department_id)
    )
  ORDER BY a.assignment_date DESC, a.from_time DESC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.list_accessible_assignments_with_team(uuid, uuid) TO authenticated, service_role;