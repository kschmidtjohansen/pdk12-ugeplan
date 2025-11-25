-- Drop existing function first to allow return type change
DROP FUNCTION IF EXISTS public.list_demo_assignments_with_team();

-- Recreate list_demo_assignments_with_team RPC function with correct column names
CREATE OR REPLACE FUNCTION public.list_demo_assignments_with_team()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  assignment_date date,
  from_time time,
  to_time time,
  location text,
  type text,
  case_number text,
  published boolean,
  responsible_user_id uuid,
  car_id uuid,
  car_ids uuid[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  team jsonb,
  assignment_cars jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_email text;
BEGIN
  -- Get current user email
  SELECT au.email INTO current_user_email
  FROM auth.users au
  WHERE au.id = auth.uid();
  
  -- Only allow demo user
  IF current_user_email != 'test@polygongroup.com' THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.assignment_date,
    a.from_time,
    a.to_time,
    a.location,
    a.type::text,
    a.case_number,
    a.published,
    a.responsible_user_id,
    a.car_id,
    a.car_ids,
    a.created_at,
    a.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'email', p.email
          )
        )
        FROM demo.assignments_employees ae
        JOIN demo.profiles p ON ae.user_id = p.id
        WHERE ae.assignment_id = a.id
      ),
      '[]'::jsonb
    ) as team,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'car_number', c.car_number
          )
        )
        FROM unnest(a.car_ids) AS car_id
        JOIN demo.cars c ON c.id = car_id
      ),
      '[]'::jsonb
    ) as assignment_cars
  FROM demo.assignments a
  ORDER BY a.assignment_date DESC, a.created_at DESC;
END;
$function$;

-- Create get_demo_duties_with_employee RPC function
CREATE OR REPLACE FUNCTION public.get_demo_duties_with_employee(
  start_date_param date DEFAULT NULL,
  end_date_param date DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  duty_date date,
  duty_type text,
  employee_id uuid,
  notes text,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  employee jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_email text;
BEGIN
  -- Get current user email
  SELECT au.email INTO current_user_email
  FROM auth.users au
  WHERE au.id = auth.uid();
  
  -- Only allow demo user
  IF current_user_email != 'test@polygongroup.com' THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    d.id,
    d.duty_date,
    d.duty_type::text,
    d.employee_id,
    d.notes,
    d.created_by,
    d.created_at,
    d.updated_at,
    CASE 
      WHEN d.employee_id IS NOT NULL THEN
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'email', p.email,
          'avatar_url', p.avatar_url
        )
      ELSE NULL
    END as employee
  FROM demo.on_call_duties d
  LEFT JOIN demo.profiles p ON d.employee_id = p.id
  WHERE 
    (start_date_param IS NULL OR d.duty_date >= start_date_param)
    AND (end_date_param IS NULL OR d.duty_date <= end_date_param)
  ORDER BY d.duty_date ASC;
END;
$function$;