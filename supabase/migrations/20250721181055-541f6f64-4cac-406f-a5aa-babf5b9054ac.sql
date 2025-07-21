
-- Phase 1: Fix Enum and Add Superadmin Role
-- First, we need to properly add superadmin to the user_role enum
-- Since we can't directly add to enum if it might already exist, we'll use a safer approach

DO $$
BEGIN
  -- Check if superadmin already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'superadmin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'superadmin';
  END IF;
END
$$;

-- Phase 2: Fix All AFD12 User Department Associations
-- Add user_departments entries for all AFD12 users who are missing them
INSERT INTO public.user_departments (user_id, department_id, is_primary)
SELECT 
  p.id as user_id,
  d.id as department_id,
  true as is_primary
FROM public.profiles p
CROSS JOIN public.departments d
WHERE p.department_id = d.id 
  AND d.code = 'AFD12'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_departments ud 
    WHERE ud.user_id = p.id AND ud.department_id = d.id
  );

-- Ensure AFD12 is marked as primary department for all AFD12 users
UPDATE public.user_departments 
SET is_primary = true 
WHERE department_id = (SELECT id FROM public.departments WHERE code = 'AFD12')
  AND user_id IN (
    SELECT id FROM public.profiles 
    WHERE department_id = (SELECT id FROM public.departments WHERE code = 'AFD12')
  );

-- Phase 3: Assign Superadmin Role to Kasper
-- Remove any existing roles for Kasper and assign superadmin
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com');

-- Add superadmin role for Kasper (superadmin doesn't need department_id as it's cross-department)
INSERT INTO public.user_roles (user_id, role, department_id)
SELECT 
  p.id as user_id,
  'superadmin'::user_role as role,
  p.department_id as department_id
FROM public.profiles p
WHERE p.email = 'kasper.johansen@polygongroup.com';

-- Phase 4: Create Helper Functions for Superadmin
-- Create function to check if user is superadmin
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

-- Create function to check if user has admin privileges (admin, skadeleder, or superadmin)
CREATE OR REPLACE FUNCTION public.has_admin_privileges(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid 
    AND role IN ('administrator', 'skadeleder', 'superadmin')
  );
$$;

-- Phase 5: Fix Assignment Policies (Remove Recursion)
-- Drop all existing assignment policies
DROP POLICY IF EXISTS "assignments_select_department_aware" ON public.assignments;
DROP POLICY IF EXISTS "assignments_insert_admin_skadeleder" ON public.assignments;
DROP POLICY IF EXISTS "assignments_update_admin_skadeleder_responsible" ON public.assignments;
DROP POLICY IF EXISTS "assignments_delete_admin_skadeleder" ON public.assignments;

-- Create new non-recursive assignment policies with superadmin support
CREATE POLICY "assignments_select_all" ON public.assignments
FOR SELECT TO authenticated
USING (
  -- Superadmin can see everything
  public.is_superadmin(auth.uid())
  OR (
    -- Department-based access for non-superadmins
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND (
      -- Admin/skadeleder can see all in their departments
      public.has_admin_privileges(auth.uid())
      -- Or user is assigned to the assignment
      OR EXISTS (
        SELECT 1 FROM public.assignments_employees ae
        WHERE ae.assignment_id = assignments.id 
        AND ae.user_id = auth.uid()
      )
      -- Or user is responsible for the assignment
      OR responsible_user_id = auth.uid()
      -- Or published assignment for servicemedarbejder
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

CREATE POLICY "assignments_insert_admin" ON public.assignments
FOR INSERT TO authenticated
WITH CHECK (
  -- Superadmin can insert anywhere
  public.is_superadmin(auth.uid())
  OR (
    -- Department-based access for non-superadmins
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND public.has_admin_privileges(auth.uid())
  )
);

CREATE POLICY "assignments_update_admin_responsible" ON public.assignments
FOR UPDATE TO authenticated
USING (
  -- Superadmin can update anything
  public.is_superadmin(auth.uid())
  OR (
    -- Department-based access for non-superadmins
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND (
      public.has_admin_privileges(auth.uid())
      OR responsible_user_id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Superadmin can update anything
  public.is_superadmin(auth.uid())
  OR (
    -- Department-based access for non-superadmins
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND (
      public.has_admin_privileges(auth.uid())
      OR responsible_user_id = auth.uid()
    )
  )
);

CREATE POLICY "assignments_delete_admin" ON public.assignments
FOR DELETE TO authenticated
USING (
  -- Superadmin can delete anything
  public.is_superadmin(auth.uid())
  OR (
    -- Department-based access for non-superadmins
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND public.has_admin_privileges(auth.uid())
  )
);

-- Phase 6: Update Cars Policies for Superadmin
DROP POLICY IF EXISTS "cars_select_department_aware" ON public.cars;
DROP POLICY IF EXISTS "cars_insert_admin_skadeleder" ON public.cars;
DROP POLICY IF EXISTS "cars_update_admin_skadeleder" ON public.cars;
DROP POLICY IF EXISTS "cars_delete_admin_skadeleder" ON public.cars;

CREATE POLICY "cars_select_all" ON public.cars
FOR SELECT TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR department_id = ANY(public.get_user_accessible_departments(auth.uid()))
);

CREATE POLICY "cars_insert_admin" ON public.cars
FOR INSERT TO authenticated
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND public.has_admin_privileges(auth.uid())
  )
);

CREATE POLICY "cars_update_admin" ON public.cars
FOR UPDATE TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND public.has_admin_privileges(auth.uid())
  )
)
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND public.has_admin_privileges(auth.uid())
  )
);

CREATE POLICY "cars_delete_admin" ON public.cars
FOR DELETE TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND public.has_admin_privileges(auth.uid())
  )
);

-- Phase 7: Update Profiles Policies for Superadmin
DROP POLICY IF EXISTS "profiles_select_department_aware" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;

CREATE POLICY "profiles_select_all" ON public.profiles
FOR SELECT TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR department_id = ANY(public.get_user_accessible_departments(auth.uid()))
);

CREATE POLICY "profiles_insert_admin" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND public.has_admin_privileges(auth.uid())
  )
);

CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND public.has_admin_privileges(auth.uid())
  )
)
WITH CHECK (
  id = auth.uid()
  OR public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND public.has_admin_privileges(auth.uid())
  )
);

CREATE POLICY "profiles_delete_admin" ON public.profiles
FOR DELETE TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND public.has_admin_privileges(auth.uid())
  )
);

-- Phase 8: Update Vacations Policies for Superadmin
DROP POLICY IF EXISTS "vacations_select_department_aware" ON public.vacations;
DROP POLICY IF EXISTS "vacations_insert_own_department" ON public.vacations;
DROP POLICY IF EXISTS "vacations_update_own_or_admin" ON public.vacations;
DROP POLICY IF EXISTS "vacations_delete_own_pending_or_admin" ON public.vacations;

CREATE POLICY "vacations_select_all" ON public.vacations
FOR SELECT TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND (
      user_id = auth.uid()
      OR public.has_admin_privileges(auth.uid())
    )
  )
);

CREATE POLICY "vacations_insert_own_or_admin" ON public.vacations
FOR INSERT TO authenticated
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND (
      user_id = auth.uid()
      OR public.has_admin_privileges(auth.uid())
    )
  )
);

CREATE POLICY "vacations_update_own_or_admin" ON public.vacations
FOR UPDATE TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND (
      (user_id = auth.uid() AND status = 'pending')
      OR public.has_admin_privileges(auth.uid())
    )
  )
)
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND (
      (user_id = auth.uid() AND status = 'pending')
      OR public.has_admin_privileges(auth.uid())
    )
  )
);

CREATE POLICY "vacations_delete_own_or_admin" ON public.vacations
FOR DELETE TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (
    department_id = ANY(public.get_user_accessible_departments(auth.uid()))
    AND (
      (user_id = auth.uid() AND status = 'pending')
      OR public.has_admin_privileges(auth.uid())
    )
  )
);

-- Phase 9: System Validation Function
CREATE OR REPLACE FUNCTION public.validate_comprehensive_fix()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb := '{}';
  kasper_id uuid;
  afd12_dept_id uuid;
  kasper_departments text[];
  kasper_roles text[];
  afd12_users_with_dept_access integer;
  total_afd12_users integer;
BEGIN
  -- Get IDs
  SELECT id INTO kasper_id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com';
  SELECT id INTO afd12_dept_id FROM public.departments WHERE code = 'AFD12';
  
  -- Check Kasper's department access
  SELECT ARRAY(
    SELECT d.code 
    FROM public.user_departments ud 
    JOIN public.departments d ON ud.department_id = d.id
    WHERE ud.user_id = kasper_id
  ) INTO kasper_departments;
  
  -- Check Kasper's roles
  SELECT ARRAY(
    SELECT ur.role::text 
    FROM public.user_roles ur 
    WHERE ur.user_id = kasper_id
  ) INTO kasper_roles;
  
  -- Count AFD12 users with department access
  SELECT COUNT(*) INTO afd12_users_with_dept_access
  FROM public.user_departments ud
  WHERE ud.department_id = afd12_dept_id;
  
  -- Count total AFD12 users
  SELECT COUNT(*) INTO total_afd12_users
  FROM public.profiles p
  WHERE p.department_id = afd12_dept_id;
  
  result := jsonb_build_object(
    'kasper_id', kasper_id,
    'kasper_departments', kasper_departments,
    'kasper_roles', kasper_roles,
    'kasper_is_superadmin', public.is_superadmin(kasper_id),
    'kasper_has_admin_privileges', public.has_admin_privileges(kasper_id),
    'afd12_users_with_dept_access', afd12_users_with_dept_access,
    'total_afd12_users', total_afd12_users,
    'afd12_access_complete', afd12_users_with_dept_access = total_afd12_users,
    'superadmin_enum_exists', EXISTS(
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'superadmin' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ),
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;
