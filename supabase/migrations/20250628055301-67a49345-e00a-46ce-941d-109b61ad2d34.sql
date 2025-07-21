
-- CRITICAL FIX: Eliminate infinite recursion in user_roles policies
-- This will resolve all fetching errors and restore proper role recognition

-- Step 1: Drop ALL problematic recursive policies
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

-- Step 2: Create ONLY 2 simple, non-recursive policies
CREATE POLICY "user_roles_self_access" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_roles_service_full_access" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- Step 3: Update helper functions to be completely isolated
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

-- Step 4: Add verification function to confirm fix
CREATE OR REPLACE FUNCTION public.verify_policy_fix()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  policy_count integer := 0;
  user_roles_count integer := 0;
  test_role user_role;
BEGIN
  -- Count policies on user_roles (should be exactly 2)
  SELECT count(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'user_roles';
  
  -- Test user_roles access
  BEGIN
    SELECT count(*) INTO user_roles_count FROM public.user_roles LIMIT 5;
    result := result || jsonb_build_object('user_roles_accessible', true, 'count', user_roles_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('user_roles_accessible', false, 'error', SQLERRM);
  END;
  
  -- Test role function
  BEGIN
    SELECT public.get_current_user_role() INTO test_role;
    result := result || jsonb_build_object('role_function_works', true, 'current_role', test_role);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('role_function_works', false, 'error', SQLERRM);
  END;
  
  result := result || jsonb_build_object(
    'policy_count', policy_count,
    'fix_status', CASE WHEN policy_count = 2 THEN 'SUCCESS' ELSE 'INCOMPLETE' END,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;
