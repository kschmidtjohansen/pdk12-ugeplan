
DROP FUNCTION IF EXISTS public.list_screen_display_assignments(uuid, uuid, date);

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
  team jsonb, responsible_user jsonb, cars jsonb
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
  WITH parsed AS (
    SELECT a.*,
      COALESCE(
        (SELECT array_agg(
            CASE WHEN elem ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                 THEN elem::uuid ELSE NULL END)
         FROM unnest(a.car_ids) AS elem),
        ARRAY[]::uuid[]
      ) AS parsed_car_ids
    FROM public.assignments a
    WHERE COALESCE(a.is_demo, false) = false
      AND a.published = true
      AND a.department_id = p_department_id
      AND (p_sub_department_id IS NULL OR a.sub_department_id = p_sub_department_id OR a.sub_department_id IS NULL)
      AND (p_date IS NULL OR a.assignment_date = p_date)
  )
  SELECT
    p.id, p.title, p.description, p.assignment_date, p.from_time, p.to_time,
    p.location, p.type, p.published, p.responsible_user_id, p.car_id,
    p.parsed_car_ids AS car_ids,
    p.case_number, p.created_at, p.updated_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', pr.id, 'name', pr.name))
       FROM public.assignments_employees ae
       JOIN public.profiles pr ON ae.user_id = pr.id
       WHERE ae.assignment_id = p.id
         AND COALESCE(ae.is_demo, false) = false
         AND COALESCE(pr.is_demo, false) = false),
      '[]'::jsonb
    ) AS team,
    CASE WHEN rp.id IS NOT NULL THEN
      jsonb_build_object('id', rp.id, 'name', rp.name)
    ELSE NULL END AS responsible_user,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) ORDER BY c.name)
       FROM public.cars c
       WHERE c.id = ANY(
         CASE
           WHEN array_length(p.parsed_car_ids, 1) > 0 THEN p.parsed_car_ids
           WHEN p.car_id IS NOT NULL THEN ARRAY[p.car_id]
           ELSE ARRAY[]::uuid[]
         END
       )),
      '[]'::jsonb
    ) AS cars
  FROM parsed p
  LEFT JOIN public.profiles rp ON p.responsible_user_id = rp.id AND COALESCE(rp.is_demo, false) = false
  ORDER BY p.assignment_date DESC, p.from_time DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_screen_display_assignments(uuid, uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_screen_display_assignments(uuid, uuid, date) TO anon, authenticated;
