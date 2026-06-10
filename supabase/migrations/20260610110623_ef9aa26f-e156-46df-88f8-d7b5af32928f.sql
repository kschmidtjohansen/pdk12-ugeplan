
-- 1. Published assignments for screen-display
CREATE OR REPLACE FUNCTION public.list_screen_display_assignments(
  p_department_id uuid,
  p_sub_department_id uuid DEFAULT NULL,
  p_date date DEFAULT NULL
)
RETURNS TABLE(
  id uuid, title text, description text, assignment_date date,
  from_time time without time zone, to_time time without time zone,
  location text, type public.assignment_type, published boolean,
  responsible_user_id uuid, car_id uuid, car_ids uuid[],
  case_number text, created_at timestamptz, updated_at timestamptz,
  team jsonb, responsible_user jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_department_id IS NULL THEN
    RETURN;
  END IF;

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
      (SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name))
       FROM public.assignments_employees ae
       JOIN public.profiles p ON ae.user_id = p.id
       WHERE ae.assignment_id = a.id
         AND COALESCE(ae.is_demo, false) = false
         AND COALESCE(p.is_demo, false) = false),
      '[]'::jsonb
    ) AS team,
    CASE WHEN rp.id IS NOT NULL THEN
      jsonb_build_object('id', rp.id, 'name', rp.name)
    ELSE NULL END AS responsible_user
  FROM public.assignments a
  LEFT JOIN public.profiles rp ON a.responsible_user_id = rp.id AND COALESCE(rp.is_demo, false) = false
  WHERE COALESCE(a.is_demo, false) = false
    AND a.published = true
    AND a.department_id = p_department_id
    AND (p_sub_department_id IS NULL OR a.sub_department_id = p_sub_department_id OR a.sub_department_id IS NULL)
    AND (p_date IS NULL OR a.assignment_date = p_date)
  ORDER BY a.assignment_date DESC, a.from_time DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_screen_display_assignments(uuid, uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_screen_display_assignments(uuid, uuid, date) TO anon, authenticated;

-- 2. Absences for screen-display
CREATE OR REPLACE FUNCTION public.list_screen_display_absences(
  p_department_id uuid,
  p_date date
)
RETURNS TABLE(id uuid, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_department_id IS NULL OR p_date IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT p.id, p.name
  FROM public.vacations v
  JOIN public.profiles p ON p.id = v.user_id
  WHERE v.status = 'approved'
    AND COALESCE(v.is_demo, false) = false
    AND COALESCE(p.is_demo, false) = false
    AND p.home_department_id = p_department_id
    AND p_date BETWEEN v.start_date AND v.end_date
  ORDER BY p.name;
END;
$$;

REVOKE ALL ON FUNCTION public.list_screen_display_absences(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_screen_display_absences(uuid, date) TO anon, authenticated;

-- 3. Sub-departments for rotation
CREATE OR REPLACE FUNCTION public.list_screen_display_sub_departments(
  p_department_id uuid
)
RETURNS TABLE(id uuid, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_department_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT s.id, s.name
  FROM public.sub_departments s
  WHERE s.department_id = p_department_id
  ORDER BY s.name;
END;
$$;

REVOKE ALL ON FUNCTION public.list_screen_display_sub_departments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_screen_display_sub_departments(uuid) TO anon, authenticated;
