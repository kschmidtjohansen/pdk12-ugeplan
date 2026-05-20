CREATE OR REPLACE FUNCTION public.get_department_absences(p_department_id uuid, p_date date)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH dept_users AS (
    SELECT ua.user_id AS uid
    FROM public.user_access ua
    WHERE ua.department_id = p_department_id
    UNION
    SELECT p.id AS uid
    FROM public.profiles p
    WHERE p.home_department_id = p_department_id
  ),
  absent_ids AS (
    SELECT v.user_id AS uid
    FROM public.vacations v
    WHERE v.status = 'approved'
      AND v.start_date <= p_date
      AND v.end_date   >= p_date
      AND v.user_id IN (SELECT uid FROM dept_users)
    UNION
    SELECT p.id AS uid
    FROM public.profiles p
    WHERE p.id IN (SELECT uid FROM dept_users)
      AND (p.status = 'on_leave' OR p.on_leave = true)
  )
  SELECT p.id, p.name
  FROM public.profiles p
  WHERE p.id IN (SELECT uid FROM absent_ids)
    AND COALESCE(p.status::text, '') <> 'terminated'
    AND COALESCE(p.is_visible_in_planning, true) = true
  ORDER BY p.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_department_absences(uuid, date) TO authenticated, anon;