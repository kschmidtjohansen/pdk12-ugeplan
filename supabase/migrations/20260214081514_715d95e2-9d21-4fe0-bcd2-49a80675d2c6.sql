
-- 1. Fix user_roles RLS for super_admin
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (SELECT get_current_user_role()) = ANY (
    ARRAY['super_admin'::user_role, 'administrator'::user_role, 'skadeleder'::user_role]
  )
  OR (SELECT auth.role()) = 'service_role'::text
);

-- 2. Add sub_department_id to cars
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS sub_department_id uuid REFERENCES public.sub_departments(id) ON DELETE SET NULL;

-- 3. Add sub_department_id to warehouse_items
ALTER TABLE public.warehouse_items
ADD COLUMN IF NOT EXISTS sub_department_id uuid REFERENCES public.sub_departments(id) ON DELETE SET NULL;

-- 4. Update RPC to accept and filter on p_sub_department_id
CREATE OR REPLACE FUNCTION public.list_accessible_assignments_with_team(
  p_department_id uuid DEFAULT NULL::uuid,
  p_sub_department_id uuid DEFAULT NULL::uuid
)
 RETURNS TABLE(id uuid, title text, description text, assignment_date date, from_time time without time zone, to_time time without time zone, location text, type assignment_type, published boolean, responsible_user_id uuid, car_id uuid, car_ids uuid[], case_number text, created_at timestamp with time zone, updated_at timestamp with time zone, team jsonb, responsible_user jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    WHERE (p_department_id IS NULL OR a.department_id = p_department_id)
      AND (p_sub_department_id IS NULL OR a.sub_department_id = p_sub_department_id)
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
      AND (p_department_id IS NULL OR a.department_id = p_department_id)
      AND (p_sub_department_id IS NULL OR a.sub_department_id = p_sub_department_id)
    ORDER BY a.assignment_date DESC, a.from_time DESC;
    
  END IF;
END;
$function$;
