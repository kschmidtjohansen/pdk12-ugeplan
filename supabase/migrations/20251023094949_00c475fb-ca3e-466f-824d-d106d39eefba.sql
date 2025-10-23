-- Create RPC to get demo profiles (employees)
CREATE OR REPLACE FUNCTION public.get_demo_profiles_admin_detailed(full_access boolean DEFAULT false)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  phone text,
  job_title text,
  notes text,
  status employee_status,
  on_leave boolean,
  is_temporary boolean,
  expires_at timestamptz,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
  
  -- Return demo profiles with optional masking
  IF full_access THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.email,
      p.phone,
      p.job_title,
      p.notes,
      p.status,
      p.on_leave,
      p.is_temporary,
      p.expires_at,
      p.avatar_url,
      p.created_at,
      p.updated_at,
      COALESCE(ur.role, 'servicemedarbejder'::user_role) as role
    FROM demo.profiles p
    LEFT JOIN demo.user_roles ur ON p.id = ur.user_id
    ORDER BY p.name;
  ELSE
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      public.mask_email(p.email) as email,
      public.mask_phone(p.phone) as phone,
      p.job_title,
      NULL::text as notes,
      p.status,
      p.on_leave,
      p.is_temporary,
      p.expires_at,
      p.avatar_url,
      p.created_at,
      p.updated_at,
      COALESCE(ur.role, 'servicemedarbejder'::user_role) as role
    FROM demo.profiles p
    LEFT JOIN demo.user_roles ur ON p.id = ur.user_id
    ORDER BY p.name;
  END IF;
END;
$$;

-- Create RPC to get demo cars
CREATE OR REPLACE FUNCTION public.get_demo_cars_with_security()
RETURNS TABLE(
  id uuid,
  name text,
  car_number text,
  number_plate text,
  has_trailer_hitch boolean,
  is_available boolean,
  show_in_planner boolean,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  fuel_card_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_email text;
  can_view_fuel boolean;
BEGIN
  -- Get current user email
  SELECT au.email INTO current_user_email
  FROM auth.users au
  WHERE au.id = auth.uid();
  
  -- Only allow demo user
  IF current_user_email != 'test@polygongroup.com' THEN
    RETURN;
  END IF;
  
  -- Check if user can view fuel codes
  SELECT public.can_view_fuel_codes() INTO can_view_fuel;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.car_number,
    c.number_plate,
    c.has_trailer_hitch,
    c.is_available,
    c.show_in_planner,
    c.notes,
    c.created_at,
    c.updated_at,
    CASE 
      WHEN can_view_fuel THEN c.fuel_card_code
      ELSE '***RESTRICTED***'::text
    END as fuel_card_code
  FROM demo.cars c
  ORDER BY c.name;
END;
$$;

-- Create RPC to get demo vacations
CREATE OR REPLACE FUNCTION public.get_demo_vacations()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  start_date date,
  end_date date,
  status vacation_status,
  created_at timestamptz,
  updated_at timestamptz,
  start_time time,
  end_time time,
  is_same_day boolean,
  reason text,
  request_type text,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    v.id,
    v.user_id,
    v.start_date,
    v.end_date,
    v.status,
    v.created_at,
    v.updated_at,
    v.start_time,
    v.end_time,
    v.is_same_day,
    v.reason,
    v.request_type,
    v.notes
  FROM demo.vacations v
  ORDER BY v.created_at DESC;
END;
$$;

-- Create RPC to get demo warehouse items
CREATE OR REPLACE FUNCTION public.get_demo_warehouse_items()
RETURNS TABLE(
  id uuid,
  address text,
  quantity integer,
  case_number text,
  notes text,
  hall text,
  is_cleaned text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    w.id,
    w.address,
    w.quantity,
    w.case_number,
    w.notes,
    w.hall,
    w.is_cleaned,
    w.created_by,
    w.created_at,
    w.updated_at
  FROM demo.warehouse_items w
  ORDER BY w.created_at DESC;
END;
$$;

-- Create RPC to get demo assignments with team
CREATE OR REPLACE FUNCTION public.list_demo_assignments_with_team()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  date date,
  status text,
  case_number text,
  client_name text,
  location text,
  contact_person text,
  special_instructions text,
  published boolean,
  responsible_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  team jsonb,
  assignment_cars jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    a.date,
    a.status,
    a.case_number,
    a.client_name,
    a.location,
    a.contact_person,
    a.special_instructions,
    a.published,
    a.responsible_user_id,
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
        FROM demo.assignments_cars ac
        JOIN demo.cars c ON ac.car_id = c.id
        WHERE ac.assignment_id = a.id
      ),
      '[]'::jsonb
    ) as assignment_cars
  FROM demo.assignments a
  ORDER BY a.date DESC, a.created_at DESC;
END;
$$;