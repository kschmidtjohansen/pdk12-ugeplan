
-- 1a) Backfill assignments med NULL department_id til "12 - Fredericia"
UPDATE assignments
SET department_id = '8c542620-9156-4155-b686-564b14a4ca62'
WHERE department_id IS NULL AND is_demo = false;

-- 1b) Opdater RPC til at inkludere opgaver/vagter med NULL department_id
CREATE OR REPLACE FUNCTION public.list_accessible_assignments_with_team(
  p_department_id uuid DEFAULT NULL,
  p_sub_department_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  assignment_date date,
  from_time time,
  to_time time,
  location text,
  type public.assignment_type,
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
SET search_path = public
AS $$
DECLARE
  current_user_role text;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  SELECT COALESCE(ur.role::text, 'servicemedarbejder') 
  INTO current_user_role
  FROM public.user_roles ur 
  WHERE ur.user_id = current_user_id;
  
  PERFORM public.log_security_event_safe(
    'secure_assignment_access',
    format('User accessing assignments with role: %s, department: %s, sub_department: %s', current_user_role, p_department_id, p_sub_department_id),
    jsonb_build_object(
      'user_id', current_user_id,
      'user_role', current_user_role,
      'department_id', p_department_id,
      'sub_department_id', p_sub_department_id,
      'function', 'list_accessible_assignments_with_team'
    ),
    'info'
  );
  
  IF current_user_role IN ('administrator', 'skadeleder', 'super_admin') THEN
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
      COALESCE(
        (
          SELECT array_agg(
            CASE
              WHEN elem ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN elem::uuid
              ELSE NULL
            END
          )
          FROM unnest(a.car_ids) AS elem
        ),
        ARRAY[]::uuid[]
      ) as car_ids,
      a.case_number,
      a.created_at,
      a.updated_at,
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
    WHERE (p_department_id IS NULL OR a.department_id = p_department_id OR a.department_id IS NULL)
      AND (p_sub_department_id IS NULL OR a.sub_department_id = p_sub_department_id OR a.sub_department_id IS NULL)
    ORDER BY a.assignment_date DESC, a.from_time DESC;
    
  ELSE
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
      COALESCE(
        (
          SELECT array_agg(
            CASE
              WHEN elem ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN elem::uuid
              ELSE NULL
            END
          )
          FROM unnest(a.car_ids) AS elem
        ),
        ARRAY[]::uuid[]
      ) as car_ids,
      a.case_number,
      a.created_at,
      a.updated_at,
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
      AND (p_department_id IS NULL OR a.department_id = p_department_id OR a.department_id IS NULL)
      AND (p_sub_department_id IS NULL OR a.sub_department_id = p_sub_department_id OR a.sub_department_id IS NULL)
    ORDER BY a.assignment_date DESC, a.from_time DESC;
    
  END IF;
END;
$$;

-- 1c) Backfill duties med NULL department_id baseret på opretterens afdeling
UPDATE on_call_duties d
SET department_id = p.home_department_id
FROM profiles p
WHERE d.created_by = p.id
  AND d.department_id IS NULL
  AND d.is_demo = false;
