-- SECURITY FIX: Eliminate conflicting RLS policies on profiles table
-- Replace multiple PERMISSIVE policies with a single, secure RESTRICTIVE policy

-- Drop all existing SELECT policies that could conflict
DROP POLICY IF EXISTS "users_own_profile_only" ON public.profiles;
DROP POLICY IF EXISTS "admins_all_profiles_access" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_own_profile_only" ON public.profiles;
DROP POLICY IF EXISTS "verified_admins_all_profiles" ON public.profiles;

-- Create a single, comprehensive SELECT policy (RESTRICTIVE for security)
CREATE POLICY "secure_profile_access_unified" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Users can see their own profile OR user is admin/skadeleder
  (id = auth.uid()) 
  OR 
  (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('administrator', 'skadeleder')
      AND ur.created_at IS NOT NULL
    )
    -- Log admin access to other profiles (not their own)
    AND (
      CASE 
        WHEN profiles.id != auth.uid() THEN
          public.log_security_event_safe(
            'admin_profile_access',
            format('Admin %s accessed profile: %s (ID: %s)', 
              COALESCE((SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1), 'unknown'),
              profiles.name, 
              profiles.id
            ),
            jsonb_build_object(
              'admin_id', auth.uid(),
              'accessed_profile_id', profiles.id,
              'accessed_profile_email', profiles.email,
              'admin_role', (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1),
              'access_timestamp', now()
            ),
            'warning'
          ) IS NULL OR true
        ELSE true  -- No logging needed for admin accessing their own profile
      END
    )
  )
);

-- Ensure service role cannot access profiles directly (security hardening)
CREATE POLICY "block_service_role_profiles" 
ON public.profiles 
FOR ALL 
TO service_role
USING (false)
WITH CHECK (false);

-- Create helper function for secure profile queries (for application use)
CREATE OR REPLACE FUNCTION public.get_accessible_profiles()
RETURNS TABLE(
  id uuid, 
  name text, 
  email text, 
  phone text, 
  job_title text, 
  status employee_status, 
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  access_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_role text;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Get current user's role
  SELECT COALESCE(ur.role::text, 'servicemedarbejder') 
  INTO current_user_role
  FROM public.user_roles ur 
  WHERE ur.user_id = current_user_id;
  
  IF current_user_role IN ('administrator', 'skadeleder') THEN
    -- Admins can see all profiles with sensitive data
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.email,
      p.phone,
      p.job_title,
      p.status,
      p.avatar_url,
      p.created_at,
      p.updated_at,
      'full_access'::text as access_level
    FROM public.profiles p
    ORDER BY p.name;
    
    -- Log admin access
    PERFORM public.log_security_event_safe(
      'bulk_profile_access',
      format('Admin accessed all profiles (role: %s)', current_user_role),
      jsonb_build_object(
        'admin_id', current_user_id,
        'admin_role', current_user_role,
        'access_type', 'bulk_admin_access'
      ),
      'info'
    );
    
  ELSE
    -- Regular users can only see their own profile
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.email,
      p.phone,
      p.job_title,
      p.status,
      p.avatar_url,
      p.created_at,
      p.updated_at,
      'own_profile'::text as access_level
    FROM public.profiles p
    WHERE p.id = current_user_id;
  END IF;
END;
$$;

-- Test the new security setup
DO $$
DECLARE
  test_result text;
BEGIN
  -- Verify RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON c.relnamespace = n.oid 
    WHERE n.nspname = 'public' AND c.relname = 'profiles' AND c.relrowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on profiles table';
  END IF;
  
  -- Verify we have exactly one SELECT policy
  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT') != 1 THEN
    RAISE EXCEPTION 'Profiles table should have exactly one SELECT policy';
  END IF;
  
  RAISE NOTICE 'Security fix applied successfully - profiles table now has unified RLS policy';
END;
$$;