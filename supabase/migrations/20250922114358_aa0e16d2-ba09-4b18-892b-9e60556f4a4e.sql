-- Fix profiles table security issue: Replace blocking SELECT policy with proper access control

-- Drop the overly restrictive SELECT policy that blocks all access
DROP POLICY IF EXISTS "profiles_secure_function_access_only" ON public.profiles;

-- Create proper RLS policies for SELECT access
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Administrators and skadeleder can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Log this critical security fix
SELECT public.log_security_event_safe(
  'security_policy_fix',
  'Fixed profiles table SELECT policies - replaced blocking policy with proper access control',
  jsonb_build_object(
    'table', 'profiles',
    'action', 'replaced_blocking_select_policy',
    'new_policies', jsonb_build_array(
      'Users can view their own profile',
      'Administrators and skadeleder can view all profiles'
    )
  ),
  'info'
);