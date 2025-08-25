-- CRITICAL SECURITY FIXES: Address data exposure vulnerabilities
-- Phase 1: Drop unsafe public views and fix overly permissive policies

-- 1. Drop unsafe public views that expose data without proper RLS protection
DROP VIEW IF EXISTS public.cars_public CASCADE;
DROP VIEW IF EXISTS public.profiles_public CASCADE; 
DROP VIEW IF EXISTS public.user_roles_with_names CASCADE;

-- 2. Fix the overly permissive profiles table policy
-- Current policy allows public access (USING true) which is a major security risk
DROP POLICY IF EXISTS "profile_select_policy" ON public.profiles;

-- Create secure, role-based profile access policies
CREATE POLICY "users_can_view_own_profile" ON public.profiles
FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "admins_can_view_all_profiles" ON public.profiles
FOR SELECT 
TO authenticated  
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- 3. Create a secure function for profile data with proper access control
CREATE OR REPLACE FUNCTION public.get_profile_with_role(profile_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  job_title text,
  status employee_status,
  avatar_url text,
  role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user can access this profile
  IF profile_id != auth.uid() AND NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  ) THEN
    -- Return empty result for unauthorized access
    RETURN;
  END IF;
  
  RETURN QUERY 
  SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    p.job_title,
    p.status,
    p.avatar_url,
    COALESCE(ur.role, 'servicemedarbejder'::user_role) as role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.id = profile_id;
END;
$$;

-- 4. Add enhanced security logging function
CREATE OR REPLACE FUNCTION public.log_data_access_attempt(
  table_name text,
  access_type text,
  record_id uuid DEFAULT NULL,
  success boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only log failed access attempts and admin actions to prevent log spam
  IF NOT success OR (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'administrator'
    )
  ) THEN
    PERFORM public.log_security_event_safe(
      'data_access_attempt',
      format('%s %s on %s', access_type, CASE WHEN success THEN 'succeeded' ELSE 'failed' END, table_name),
      jsonb_build_object(
        'table', table_name,
        'access_type', access_type,
        'record_id', record_id,
        'success', success,
        'user_id', auth.uid(),
        'timestamp', now()
      ),
      CASE WHEN success THEN 'info' ELSE 'warning' END
    );
  END IF;
END;
$$;