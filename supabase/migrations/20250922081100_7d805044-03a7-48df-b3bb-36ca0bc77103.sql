-- Fix the list_accessible_assignments_with_team function to handle car_ids array properly
CREATE OR REPLACE FUNCTION public.list_accessible_assignments_with_team()
 RETURNS TABLE(
   id uuid, 
   title text, 
   description text, 
   assignment_date date, 
   from_time time without time zone, 
   to_time time without time zone, 
   location text, 
   type assignment_type, 
   published boolean, 
   responsible_user_id uuid, 
   car_id uuid, 
   car_ids uuid[], -- Fixed: Ensure this is uuid[] not text[]
   case_number text, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone, 
   team jsonb, 
   responsible_user jsonb
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  current_user_role text;
  current_user_id uuid;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  
  -- Get user role safely
  SELECT COALESCE(ur.role::text, 'servicemedarbejder') 
  INTO current_user_role
  FROM public.user_roles ur 
  WHERE ur.user_id = current_user_id;
  
  -- Log access for security auditing
  PERFORM public.log_security_event_safe(
    'secure_assignment_access',
    format('User accessing assignments with role: %s', current_user_role),
    jsonb_build_object(
      'user_id', current_user_id,
      'user_role', current_user_role,
      'function', 'list_accessible_assignments_with_team'
    ),
    'info'
  );
  
  -- Return assignments based on role
  IF current_user_role IN ('administrator', 'skadeleder') THEN
    -- Admin/Skadeleder: see all assignments with full team data
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
      COALESCE(a.car_ids, ARRAY[]::uuid[]) as car_ids, -- Fixed: Ensure proper uuid[] type
      a.case_number,
      a.created_at,
      a.updated_at,
      -- Get team data by bypassing RLS with SECURITY DEFINER
      COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'email', p.email
          )
        )
        FROM public.assignments_employees ae 
        JOIN public.profiles p ON ae.user_id = p.id 
        WHERE ae.assignment_id = a.id),
        '[]'::jsonb
      ) as team,
      -- Get responsible user data
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
    LEFT JOIN public.profiles rp ON a.responsible_user_id = rp.id
    ORDER BY a.assignment_date DESC, a.from_time DESC;
    
  ELSE
    -- Servicemedarbejder: see only published assignments they're assigned to, plus team data for those
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
      COALESCE(a.car_ids, ARRAY[]::uuid[]) as car_ids, -- Fixed: Ensure proper uuid[] type
      a.case_number,
      a.created_at,
      a.updated_at,
      -- Get team data for assignments the user is part of
      COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'email', p.email
          )
        )
        FROM public.assignments_employees ae 
        JOIN public.profiles p ON ae.user_id = p.id 
        WHERE ae.assignment_id = a.id),
        '[]'::jsonb
      ) as team,
      -- Get responsible user data
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
    LEFT JOIN public.profiles rp ON a.responsible_user_id = rp.id
    WHERE a.published = true 
      AND EXISTS (
        SELECT 1 FROM public.assignments_employees ae 
        WHERE ae.assignment_id = a.id 
        AND ae.user_id = current_user_id
      )
    ORDER BY a.assignment_date DESC, a.from_time DESC;
    
  END IF;
END;
$function$