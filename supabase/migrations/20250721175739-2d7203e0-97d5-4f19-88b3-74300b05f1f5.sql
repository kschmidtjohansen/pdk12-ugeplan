
-- Phase 1: Fix User Department Associations
-- First, ensure all users with profiles have proper department associations

-- Add missing user_departments entries for users who have profiles but no department associations
INSERT INTO public.user_departments (user_id, department_id, is_primary)
SELECT 
  p.id as user_id,
  p.department_id,
  true as is_primary
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_departments ud 
  WHERE ud.user_id = p.id AND ud.department_id = p.department_id
);

-- Phase 2: Fix RLS Policy Recursion by creating helper functions
-- Create a function to get user's accessible department IDs without recursion
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

-- Create a function to check if user can access specific department
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

-- Phase 3: Fix Assignments RLS Policies to prevent recursion
-- Drop existing problematic policies
DROP POLICY IF EXISTS "assignment_select_policy" ON public.assignments;
DROP POLICY IF EXISTS "assignment_insert_policy" ON public.assignments;
DROP POLICY IF EXISTS "assignment_update_policy" ON public.assignments;
DROP POLICY IF EXISTS "assignment_delete_policy" ON public.assignments;

-- Create new non-recursive policies
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

-- Phase 4: Create function to validate department access for UI
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
