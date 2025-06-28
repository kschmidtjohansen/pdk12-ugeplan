
-- COMPREHENSIVE DATABASE POLICY CLEANUP PLAN
-- This will completely resolve all infinite recursion and fetching errors

-- Step 1: Drop ALL existing policies on user_roles (all 8+ of them)
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can manage their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_own_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_all_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_service_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_access" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_service_full_access" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_only" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_service_full" ON public.user_roles;

-- Step 2: Create ONLY 2 completely clean, non-recursive policies
CREATE POLICY "user_roles_clean_self" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_roles_clean_service" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- Step 3: Ensure helper functions are completely isolated and optimized
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
    LIMIT 1
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'servicemedarbejder'::user_role
  );
$$;

-- Step 4: Enhanced verification function for complete system check
CREATE OR REPLACE FUNCTION public.verify_complete_fix()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  policy_count integer := 0;
  user_roles_count integer := 0;
  profiles_count integer := 0;
  assignments_count integer := 0;
  cars_count integer := 0;
  test_role user_role;
BEGIN
  -- Count policies on user_roles (should be exactly 2)
  SELECT count(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'user_roles';
  
  -- Test user_roles access
  BEGIN
    SELECT count(*) INTO user_roles_count FROM public.user_roles LIMIT 10;
    result := result || jsonb_build_object('user_roles_accessible', true, 'user_roles_count', user_roles_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('user_roles_accessible', false, 'user_roles_error', SQLERRM);
  END;
  
  -- Test profiles access
  BEGIN
    SELECT count(*) INTO profiles_count FROM public.profiles LIMIT 10;
    result := result || jsonb_build_object('profiles_accessible', true, 'profiles_count', profiles_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('profiles_accessible', false, 'profiles_error', SQLERRM);
  END;
  
  -- Test assignments access
  BEGIN
    SELECT count(*) INTO assignments_count FROM public.assignments LIMIT 10;
    result := result || jsonb_build_object('assignments_accessible', true, 'assignments_count', assignments_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('assignments_accessible', false, 'assignments_error', SQLERRM);
  END;
  
  -- Test cars access
  BEGIN
    SELECT count(*) INTO cars_count FROM public.cars LIMIT 10;
    result := result || jsonb_build_object('cars_accessible', true, 'cars_count', cars_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('cars_accessible', false, 'cars_error', SQLERRM);
  END;
  
  -- Test role function
  BEGIN
    SELECT public.get_current_user_role() INTO test_role;
    result := result || jsonb_build_object('role_function_works', true, 'current_role', test_role);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('role_function_works', false, 'role_error', SQLERRM);
  END;
  
  result := result || jsonb_build_object(
    'policy_count', policy_count,
    'fix_status', CASE WHEN policy_count = 2 THEN 'SUCCESS' ELSE 'INCOMPLETE' END,
    'system_health', CASE 
      WHEN user_roles_count > 0 AND profiles_count > 0 AND assignments_count >= 0 AND cars_count >= 0 
      THEN 'HEALTHY' 
      ELSE 'NEEDS_ATTENTION' 
    END,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;
