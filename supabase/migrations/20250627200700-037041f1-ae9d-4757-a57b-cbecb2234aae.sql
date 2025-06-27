
-- CRITICAL FIX: Complete elimination of infinite recursion in user_roles policies
-- This will resolve all fetch errors by fixing the root cause

-- Step 1: Drop ALL existing policies on user_roles table (including any missed ones)
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
DROP POLICY IF EXISTS "user_roles_self_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_service_access" ON public.user_roles;

-- Step 2: Create ONLY 2 simple, non-recursive policies
-- Policy 1: Allow users to view their own role only (no recursion)
CREATE POLICY "user_roles_self_only" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Allow service role full access (for admin operations via edge functions)
CREATE POLICY "user_roles_service_full" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- Step 3: Update helper functions to be completely isolated (no recursive calls)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Direct, non-recursive query
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
  -- Direct query with safe fallback
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'servicemedarbejder'::user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(check_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Direct, isolated check
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = check_role
    LIMIT 1
  );
$$;

-- Step 4: Enhanced system health check to verify the fix
CREATE OR REPLACE FUNCTION public.verify_data_access_fix()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  user_roles_count integer := 0;
  profiles_count integer := 0;
  assignments_count integer := 0;
  cars_count integer := 0;
  policy_count integer := 0;
BEGIN
  -- Check user_roles access (this was the problem)
  BEGIN
    SELECT count(*) INTO user_roles_count FROM public.user_roles LIMIT 10;
    result := result || jsonb_build_object('user_roles_accessible', true, 'user_roles_count', user_roles_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('user_roles_accessible', false, 'user_roles_error', SQLERRM);
  END;
  
  -- Test other critical tables
  BEGIN
    SELECT count(*) INTO profiles_count FROM public.profiles LIMIT 10;
    result := result || jsonb_build_object('profiles_accessible', true, 'profiles_count', profiles_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('profiles_accessible', false, 'profiles_error', SQLERRM);
  END;
  
  BEGIN
    SELECT count(*) INTO assignments_count FROM public.assignments LIMIT 10;
    result := result || jsonb_build_object('assignments_accessible', true, 'assignments_count', assignments_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('assignments_accessible', false, 'assignments_error', SQLERRM);
  END;
  
  BEGIN
    SELECT count(*) INTO cars_count FROM public.cars LIMIT 10;
    result := result || jsonb_build_object('cars_accessible', true, 'cars_count', cars_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('cars_accessible', false, 'cars_error', SQLERRM);
  END;
  
  -- Count current policies on user_roles (should be exactly 2)
  SELECT count(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'user_roles';
  
  result := result || jsonb_build_object(
    'user_roles_policy_count', policy_count,
    'timestamp', now(),
    'user_id', auth.uid(),
    'fix_status', CASE WHEN policy_count = 2 THEN 'SUCCESS' ELSE 'NEEDS_REVIEW' END
  );
  
  RETURN result;
END;
$$;
