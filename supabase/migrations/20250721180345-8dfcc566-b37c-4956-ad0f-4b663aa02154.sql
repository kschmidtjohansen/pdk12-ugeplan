
-- Phase 1: Fix Data Inconsistency and Create Super Admin Role
-- First, add the superadmin role to the user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- Phase 2: Fix User Department Associations
-- Ensure Kasper has proper access to AFD12 department
INSERT INTO public.user_departments (user_id, department_id, is_primary)
SELECT 
  p.id as user_id,
  d.id as department_id,
  true as is_primary
FROM public.profiles p
CROSS JOIN public.departments d
WHERE p.email = 'kasper.johansen@polygongroup.com' 
  AND d.code = 'AFD12'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_departments ud 
    WHERE ud.user_id = p.id AND ud.department_id = d.id
  );

-- Set AFD12 as primary department for Kasper
UPDATE public.user_departments 
SET is_primary = false 
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com');

UPDATE public.user_departments 
SET is_primary = true 
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com')
  AND department_id = (SELECT id FROM public.departments WHERE code = 'AFD12');

-- Phase 3: Assign Super Admin Role
-- Give Kasper superadmin role for AFD12 (primary department)
INSERT INTO public.user_roles (user_id, role, department_id)
SELECT 
  p.id as user_id,
  'superadmin'::user_role as role,
  d.id as department_id
FROM public.profiles p
CROSS JOIN public.departments d
WHERE p.email = 'kasper.johansen@polygongroup.com' 
  AND d.code = 'AFD12'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.id AND ur.role = 'superadmin' AND ur.department_id = d.id
  );

-- Phase 4: Update RLS Policies to Support Super Admin
-- Drop and recreate assignments policies with superadmin support
DROP POLICY IF EXISTS "assignments_select_department_aware" ON public.assignments;
DROP POLICY IF EXISTS "assignments_insert_admin_skadeleder" ON public.assignments;
DROP POLICY IF EXISTS "assignments_update_admin_skadeleder_responsible" ON public.assignments;
DROP POLICY IF EXISTS "assignments_delete_admin_skadeleder" ON public.assignments;

-- New assignments SELECT policy with superadmin access
CREATE POLICY "assignments_select_department_aware" ON public.assignments
FOR SELECT TO authenticated
USING (
  -- Superadmin can see all assignments across all departments
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'superadmin'
  )
  OR (
    -- Regular department-based access
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
  )
);

-- New assignments INSERT policy with superadmin access
CREATE POLICY "assignments_insert_admin_skadeleder" ON public.assignments
FOR INSERT TO authenticated
WITH CHECK (
  -- Superadmin can insert assignments in any department
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'superadmin'
  )
  OR (
    -- Regular department-based access
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = assignments.department_id
    )
  )
);

-- New assignments UPDATE policy with superadmin access
CREATE POLICY "assignments_update_admin_skadeleder_responsible" ON public.assignments
FOR UPDATE TO authenticated
USING (
  -- Superadmin can update any assignment
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'superadmin'
  )
  OR (
    -- Regular department-based access
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
)
WITH CHECK (
  -- Superadmin can update any assignment
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'superadmin'
  )
  OR (
    -- Regular department-based access
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
);

-- New assignments DELETE policy with superadmin access
CREATE POLICY "assignments_delete_admin_skadeleder" ON public.assignments
FOR DELETE TO authenticated
USING (
  -- Superadmin can delete any assignment
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'superadmin'
  )
  OR (
    -- Regular department-based access
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = assignments.department_id
    )
  )
);

-- Phase 5: Update other critical table policies for superadmin access
-- Update cars policies
DROP POLICY IF EXISTS "cars_select_department_aware" ON public.cars;
DROP POLICY IF EXISTS "cars_insert_admin_skadeleder" ON public.cars;
DROP POLICY IF EXISTS "cars_update_admin_skadeleder" ON public.cars;
DROP POLICY IF EXISTS "cars_delete_admin_skadeleder" ON public.cars;

CREATE POLICY "cars_select_department_aware" ON public.cars
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
  OR department_id = ANY(public.get_user_accessible_departments(auth.uid()))
);

CREATE POLICY "cars_insert_admin_skadeleder" ON public.cars
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = cars.department_id
    )
  )
);

CREATE POLICY "cars_update_admin_skadeleder" ON public.cars
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = cars.department_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = cars.department_id
    )
  )
);

CREATE POLICY "cars_delete_admin_skadeleder" ON public.cars
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.department_id = cars.department_id
    )
  )
);

-- Phase 6: Create helper function to check for superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'superadmin'
  );
$$;

-- Phase 7: Create comprehensive system health check
CREATE OR REPLACE FUNCTION public.validate_multi_department_fix()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb := '{}';
  kasper_departments text[];
  kasper_roles text[];
  test_dept_id uuid;
  afd12_dept_id uuid;
BEGIN
  -- Get department IDs
  SELECT id INTO test_dept_id FROM public.departments WHERE code = 'TEST';
  SELECT id INTO afd12_dept_id FROM public.departments WHERE code = 'AFD12';
  
  -- Check Kasper's department access
  SELECT ARRAY(
    SELECT d.code 
    FROM public.user_departments ud 
    JOIN public.departments d ON ud.department_id = d.id
    WHERE ud.user_id = (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com')
  ) INTO kasper_departments;
  
  -- Check Kasper's roles
  SELECT ARRAY(
    SELECT ur.role::text 
    FROM public.user_roles ur 
    WHERE ur.user_id = (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com')
  ) INTO kasper_roles;
  
  result := jsonb_build_object(
    'kasper_departments', kasper_departments,
    'kasper_roles', kasper_roles,
    'superadmin_function_works', public.is_superadmin((SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com')),
    'afd12_accessible', public.can_access_department(afd12_dept_id, (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com')),
    'test_accessible', public.can_access_department(test_dept_id, (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com')),
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;
