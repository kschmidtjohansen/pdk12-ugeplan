-- Create secure function to fetch assignments with team data for current user
CREATE OR REPLACE FUNCTION public.list_accessible_assignments_with_team()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  assignment_date date,
  from_time time,
  to_time time,
  location text,
  type assignment_type,
  published boolean,
  responsible_user_id uuid,
  car_id uuid,
  car_ids uuid[],
  case_number text,
  created_at timestamptz,
  updated_at timestamptz,
  team jsonb,
  responsible_user jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.assignment_date,
    a.from_time,
    a.to_time,
    a.location,
    a.type,
    a.published,
    a.responsible_user_id,
    a.car_id,
    a.car_ids,
    a.case_number,
    a.created_at,
    a.updated_at,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'email', p.email
        )
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'::jsonb
    ) as team,
    CASE 
      WHEN rp.id IS NOT NULL THEN 
        jsonb_build_object(
          'id', rp.id,
          'name', rp.name,
          'email', rp.email
        )
      ELSE NULL
    END as responsible_user
  FROM public.assignments a
  LEFT JOIN public.assignments_employees ae ON a.id = ae.assignment_id
  LEFT JOIN public.profiles p ON ae.user_id = p.id
  LEFT JOIN public.profiles rp ON a.responsible_user_id = rp.id
  WHERE public.can_view_assignment_optimized(a.id, auth.uid())
  GROUP BY a.id, a.title, a.description, a.assignment_date, a.from_time, a.to_time, 
           a.location, a.type, a.published, a.responsible_user_id, a.car_id, a.car_ids, 
           a.case_number, a.created_at, a.updated_at, rp.id, rp.name, rp.email
  ORDER BY a.assignment_date DESC, a.from_time DESC;
END;
$$;