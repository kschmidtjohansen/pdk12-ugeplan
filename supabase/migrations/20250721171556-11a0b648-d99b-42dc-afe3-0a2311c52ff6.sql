-- Phase 3: Department-Aware RLS Policies (Security)

-- Helper function to get current user's accessible department IDs
CREATE OR REPLACE FUNCTION public.get_user_accessible_departments(user_uuid uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ARRAY(
    SELECT department_id 
    FROM public.user_departments 
    WHERE user_id = user_uuid
  );
$$;

-- Helper function to check if user can access specific department
CREATE OR REPLACE FUNCTION public.can_access_department(dept_id uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments
    WHERE user_id = user_uuid AND department_id = dept_id
  );
$$;

-- 1. UPDATE PROFILES RLS POLICIES
DROP POLICY IF EXISTS "profile_admin_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profile_admin_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profile_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profile_update_policy" ON public.profiles;

CREATE POLICY "profiles_select_department_aware" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Users can see profiles from their accessible departments
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
);

CREATE POLICY "profiles_insert_admin_only" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  -- Only admins can create profiles, and only in departments they have access to
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.user_departments ud ON ur.user_id = ud.user_id AND ur.department_id = ud.department_id
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrator'
    AND ud.department_id = department_id
  )
);

CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
FOR UPDATE TO authenticated
USING (
  -- Users can update themselves OR admins can update profiles in their departments
  id = auth.uid() 
  OR (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.user_departments ud ON ur.user_id = ud.user_id AND ur.department_id = ud.department_id
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'administrator'
      AND ud.department_id = department_id
    )
  )
)
WITH CHECK (
  id = auth.uid() 
  OR (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.user_departments ud ON ur.user_id = ud.user_id AND ur.department_id = ud.department_id
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'administrator'
      AND ud.department_id = department_id
    )
  )
);

CREATE POLICY "profiles_delete_admin_only" ON public.profiles
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.user_departments ud ON ur.user_id = ud.user_id AND ur.department_id = ud.department_id
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrator'
    AND ud.department_id = department_id
  )
);

-- 2. UPDATE ASSIGNMENTS RLS POLICIES
DROP POLICY IF EXISTS "assignment_delete_policy" ON public.assignments;
DROP POLICY IF EXISTS "assignment_insert_policy" ON public.assignments;
DROP POLICY IF EXISTS "assignment_select_policy" ON public.assignments;
DROP POLICY IF EXISTS "assignment_update_policy" ON public.assignments;

CREATE POLICY "assignments_select_department_aware" ON public.assignments
FOR SELECT TO authenticated
USING (
  -- Users can see assignments from their accessible departments
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND (
    -- Admin/skadeleder can see all in their departments
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = assignments.department_id
    )
    -- Or user is assigned to the assignment
    OR EXISTS (
      SELECT 1 FROM public.assignments_employees ae
      WHERE ae.assignment_id = assignments.id 
      AND ae.user_id = auth.uid()
    )
    -- Or user is responsible for the assignment
    OR responsible_user_id = auth.uid()
    -- Or servicemedarbejder can see published assignments in their department
    OR (
      published = true 
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role = 'servicemedarbejder'
        AND ur.department_id = assignments.department_id
      )
    )
  )
);

CREATE POLICY "assignments_insert_admin_skadeleder" ON public.assignments
FOR INSERT TO authenticated
WITH CHECK (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
    AND ur.department_id = assignments.department_id
  )
);

CREATE POLICY "assignments_update_admin_skadeleder_responsible" ON public.assignments
FOR UPDATE TO authenticated
USING (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = assignments.department_id
    )
    OR responsible_user_id = auth.uid()
  )
)
WITH CHECK (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = assignments.department_id
    )
    OR responsible_user_id = auth.uid()
  )
);

CREATE POLICY "assignments_delete_admin_skadeleder" ON public.assignments
FOR DELETE TO authenticated
USING (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
    AND ur.department_id = assignments.department_id
  )
);

-- 3. UPDATE CARS RLS POLICIES
DROP POLICY IF EXISTS "car_delete_policy" ON public.cars;
DROP POLICY IF EXISTS "car_insert_policy" ON public.cars;
DROP POLICY IF EXISTS "car_select_policy" ON public.cars;
DROP POLICY IF EXISTS "car_update_policy" ON public.cars;

CREATE POLICY "cars_select_department_aware" ON public.cars
FOR SELECT TO authenticated
USING (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
);

CREATE POLICY "cars_insert_admin_skadeleder" ON public.cars
FOR INSERT TO authenticated
WITH CHECK (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
    AND ur.department_id = cars.department_id
  )
);

CREATE POLICY "cars_update_admin_skadeleder" ON public.cars
FOR UPDATE TO authenticated
USING (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
    AND ur.department_id = cars.department_id
  )
)
WITH CHECK (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
    AND ur.department_id = cars.department_id
  )
);

CREATE POLICY "cars_delete_admin_skadeleder" ON public.cars
FOR DELETE TO authenticated
USING (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
    AND ur.department_id = cars.department_id
  )
);

-- 4. UPDATE NOTIFICATIONS RLS POLICIES
DROP POLICY IF EXISTS "notification_delete_policy" ON public.notifications;
DROP POLICY IF EXISTS "notification_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notification_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notification_update_policy" ON public.notifications;

CREATE POLICY "notifications_select_own_department" ON public.notifications
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  AND department_id = ANY(public.get_user_accessible_departments(auth.uid()))
);

CREATE POLICY "notifications_insert_admin_or_system" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND department_id = ANY(public.get_user_accessible_departments(auth.uid())))
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
    AND ur.department_id = notifications.department_id
  )
);

CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() 
  AND department_id = ANY(public.get_user_accessible_departments(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid() 
  AND department_id = ANY(public.get_user_accessible_departments(auth.uid()))
);

CREATE POLICY "notifications_delete_own" ON public.notifications
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() 
  AND department_id = ANY(public.get_user_accessible_departments(auth.uid()))
);

-- 5. UPDATE VACATIONS RLS POLICIES
DROP POLICY IF EXISTS "vacation_delete_policy" ON public.vacations;
DROP POLICY IF EXISTS "vacation_insert_policy" ON public.vacations;
DROP POLICY IF EXISTS "vacation_select_policy" ON public.vacations;
DROP POLICY IF EXISTS "vacation_update_policy" ON public.vacations;

CREATE POLICY "vacations_select_department_aware" ON public.vacations
FOR SELECT TO authenticated
USING (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = vacations.department_id
    )
  )
);

CREATE POLICY "vacations_insert_own_department" ON public.vacations
FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND department_id = ANY(public.get_user_accessible_departments(auth.uid())))
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
    AND ur.department_id = vacations.department_id
  )
);

CREATE POLICY "vacations_update_own_or_admin" ON public.vacations
FOR UPDATE TO authenticated
USING (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND (
    (user_id = auth.uid() AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = vacations.department_id
    )
  )
)
WITH CHECK (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND (
    (user_id = auth.uid() AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = vacations.department_id
    )
  )
);

CREATE POLICY "vacations_delete_own_pending_or_admin" ON public.vacations
FOR DELETE TO authenticated
USING (
  department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  AND (
    (user_id = auth.uid() AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = vacations.department_id
    )
  )
);

-- 6. UPDATE USER_ROLES RLS POLICIES
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_service_role_delete_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_service_role_insert_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_service_role_update_policy" ON public.user_roles;

CREATE POLICY "user_roles_select_department_aware" ON public.user_roles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR department_id = ANY(public.get_user_accessible_departments(auth.uid()))
  OR auth.role() = 'service_role'
);

CREATE POLICY "user_roles_service_role_all" ON public.user_roles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 7. UPDATE ASSIGNMENTS_EMPLOYEES RLS POLICIES  
DROP POLICY IF EXISTS "assignments_employees_delete_policy" ON public.assignments_employees;
DROP POLICY IF EXISTS "assignments_employees_insert_policy" ON public.assignments_employees;
DROP POLICY IF EXISTS "assignments_employees_select_policy" ON public.assignments_employees;
DROP POLICY IF EXISTS "assignments_employees_update_policy" ON public.assignments_employees;

CREATE POLICY "assignments_employees_select_department_aware" ON public.assignments_employees
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_id 
    AND a.department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('administrator', 'skadeleder', 'servicemedarbejder')
        AND ur.department_id = a.department_id
      )
    )
  )
);

CREATE POLICY "assignments_employees_insert_admin_skadeleder" ON public.assignments_employees
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.user_roles ur ON ur.department_id = a.department_id
    WHERE a.id = assignment_id 
    AND ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
  )
);

CREATE POLICY "assignments_employees_update_admin_skadeleder" ON public.assignments_employees
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.user_roles ur ON ur.department_id = a.department_id
    WHERE a.id = assignment_id 
    AND ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.user_roles ur ON ur.department_id = a.department_id
    WHERE a.id = assignment_id 
    AND ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
  )
);

CREATE POLICY "assignments_employees_delete_admin_skadeleder" ON public.assignments_employees
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.user_roles ur ON ur.department_id = a.department_id
    WHERE a.id = assignment_id 
    AND ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
  )
);

-- 8. Create function to validate department access for UI
CREATE OR REPLACE FUNCTION public.validate_user_department_access(dept_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  dept_id uuid;
  has_access boolean := false;
  user_uuid uuid;
BEGIN
  user_uuid := auth.uid();
  
  -- Get department ID from code
  SELECT id INTO dept_id FROM public.departments WHERE code = dept_code AND is_active = true;
  
  IF dept_id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'department_not_found',
      'message', 'Department not found or inactive'
    );
  END IF;
  
  -- Check if user has access
  SELECT public.can_access_department(dept_id, user_uuid) INTO has_access;
  
  IF has_access THEN
    RETURN jsonb_build_object(
      'valid', true,
      'department_id', dept_id,
      'department_name', (SELECT name FROM public.departments WHERE id = dept_id)
    );
  ELSE
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'access_denied',
      'message', 'You do not have access to this department'
    );
  END IF;
END;
$$;