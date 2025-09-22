-- Remove overly permissive RLS policies from profiles table
-- These policies allow direct table access which poses security risks

-- Drop the emergency admin access policy that bypasses normal restrictions
DROP POLICY IF EXISTS "profiles_admin_emergency_access" ON public.profiles;

-- Drop the direct self-access policy that could expose data through direct queries
DROP POLICY IF EXISTS "profiles_own_access_only_strict" ON public.profiles;

-- Create a more restrictive policy that blocks all direct SELECT access
-- All profile access must now go through secure functions
CREATE POLICY "profiles_no_direct_access" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (false);

-- Add a comment explaining the security approach
COMMENT ON POLICY "profiles_no_direct_access" ON public.profiles IS 
'Blocks all direct SELECT access to profiles table. All profile data access must go through secure functions: get_profiles_basic(), get_profile_detailed(), or get_profiles_admin_detailed() which enforce proper access controls and logging.';

-- Ensure the secure functions are the only way to access profile data
-- This prevents hackers from bypassing security through direct table queries

-- Log this security enhancement
SELECT public.log_security_event_safe(
  'profile_security_hardened',
  'Removed permissive RLS policies and enforced secure function access only',
  jsonb_build_object(
    'removed_policies', jsonb_build_array('profiles_admin_emergency_access', 'profiles_own_access_only_strict'),
    'security_approach', 'function_only_access',
    'available_functions', jsonb_build_array('get_profiles_basic', 'get_profile_detailed', 'get_profiles_admin_detailed')
  ),
  'info'
);