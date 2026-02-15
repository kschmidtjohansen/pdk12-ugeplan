
-- Drop functions with changed return types
DROP FUNCTION IF EXISTS public.list_demo_assignments_with_team();

-- 6. list_demo_assignments_with_team
CREATE FUNCTION public.list_demo_assignments_with_team()
RETURNS TABLE(
  id uuid, title text, description text, assignment_date date,
  from_time text, to_time text, location text, type text,
  case_number text, published boolean, responsible_user_id uuid,
  car_id uuid, car_ids uuid[], created_at timestamptz, updated_at timestamptz,
  team jsonb, assignment_cars jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_user_email text;
BEGIN
  SELECT au.email INTO current_user_email FROM auth.users au WHERE au.id = auth.uid();
  IF current_user_email != 'test@polygongroup.com' THEN RETURN; END IF;
  RETURN QUERY
  SELECT a.id, a.title, a.description, a.assignment_date, a.from_time, a.to_time,
    a.location, a.type::text, a.case_number, a.published, a.responsible_user_id,
    a.car_id, a.car_ids, a.created_at, a.updated_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'email', p.email))
       FROM public.assignments_employees ae
       JOIN public.profiles p ON ae.user_id = p.id
       WHERE ae.assignment_id = a.id AND ae.is_demo = true),
      '[]'::jsonb
    ) as team,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'car_number', c.car_number))
       FROM unnest(a.car_ids) AS cid
       JOIN public.cars c ON c.id = cid),
      '[]'::jsonb
    ) as assignment_cars
  FROM public.assignments a WHERE a.is_demo = true
  ORDER BY a.assignment_date DESC, a.created_at DESC;
END;
$$;
