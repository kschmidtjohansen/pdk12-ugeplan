
-- Phase 1: Complete fix for user_roles RLS policies to eliminate infinite recursion
-- This addresses the core issue causing all the fetch failures

-- First, completely drop all existing policies on user_roles table
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

-- Create completely isolated, non-recursive policies
-- Allow users to view their own role only
CREATE POLICY "user_roles_self_select" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Allow service role full access (for admin operations)
CREATE POLICY "user_roles_service_access" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- For admin operations, we'll use service role calls instead of user-level policies
-- This completely eliminates the recursion issue

-- Update helper functions to be completely isolated and non-recursive
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Direct query without any policy checks to avoid recursion
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
  -- Direct query with fallback to avoid recursion
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'servicemedarbejder'::user_role
  );
$$;

-- Add a function to safely check user permissions without recursion
CREATE OR REPLACE FUNCTION public.user_has_role(check_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = check_role
    LIMIT 1
  );
$$;

-- Add a system health check function
CREATE OR REPLACE FUNCTION public.check_data_access_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  profiles_count integer := 0;
  assignments_count integer := 0;
  cars_count integer := 0;
  vacations_count integer := 0;
BEGIN
  -- Test access to each critical table
  
  BEGIN
    SELECT count(*) INTO profiles_count FROM public.profiles LIMIT 100;
    result := result || jsonb_build_object('profiles_accessible', true, 'profiles_count', profiles_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('profiles_accessible', false, 'profiles_error', SQLERRM);
  END;
  
  BEGIN
    SELECT count(*) INTO assignments_count FROM public.assignments LIMIT 100;
    result := result || jsonb_build_object('assignments_accessible', true, 'assignments_count', assignments_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('assignments_accessible', false, 'assignments_error', SQLERRM);
  END;
  
  BEGIN
    SELECT count(*) INTO cars_count FROM public.cars LIMIT 100;
    result := result || jsonb_build_object('cars_accessible', true, 'cars_count', cars_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('cars_accessible', false, 'cars_error', SQLERRM);
  END;
  
  BEGIN
    SELECT count(*) INTO vacations_count FROM public.vacations LIMIT 100;
    result := result || jsonb_build_object('vacations_accessible', true, 'vacations_count', vacations_count);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('vacations_accessible', false, 'vacations_error', SQLERRM);
  END;
  
  result := result || jsonb_build_object('timestamp', now(), 'user_id', auth.uid());
  
  RETURN result;
END;
$$;
