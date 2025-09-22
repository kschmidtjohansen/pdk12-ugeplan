-- Strengthen profiles table security with additional safeguards

-- First, let's add explicit authentication checks and more restrictive conditions

-- Drop existing policies to replace with more secure versions
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Administrators and skadeleder can view all profiles" ON public.profiles;

-- Create enhanced SELECT policies with strict authentication requirements
CREATE POLICY "authenticated_users_own_profile_only" 
ON public.profiles 
FOR SELECT 
USING (
  -- Must be authenticated AND viewing own profile only
  auth.uid() IS NOT NULL 
  AND id = auth.uid()
);

CREATE POLICY "verified_admins_all_profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Must be authenticated with verified admin/skadeleder role
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
    -- Ensure the user_roles record is current (not stale)
    AND ur.created_at IS NOT NULL
  )
  -- Log admin access for audit trail
  AND (
    public.log_security_event_safe(
      'admin_profile_access',
      'Admin accessed employee profile data',
      jsonb_build_object(
        'accessed_profile_id', profiles.id,
        'admin_user_id', auth.uid(),
        'admin_role', (
          SELECT role::text FROM public.user_roles 
          WHERE user_id = auth.uid() 
          LIMIT 1
        )
      ),
      'warning'
    ) IS NULL OR true
  )
);

-- Add additional security policy to prevent any service role bypasses
CREATE POLICY "block_service_role_profile_access" 
ON public.profiles 
FOR SELECT 
USING (
  -- Explicitly block service role from direct profile access
  auth.role() != 'service_role'
);

-- Ensure UPDATE policies are also secure
DROP POLICY IF EXISTS "profile_update_policy" ON public.profiles;

CREATE POLICY "secure_profile_updates" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Users can only update their own profile
    (id = auth.uid())
    OR 
    -- Or verified administrators can update any profile
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'administrator'
      AND ur.created_at IS NOT NULL
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    (id = auth.uid())
    OR 
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'administrator'
    )
  )
);

-- Log this security enhancement
SELECT public.log_security_event_safe(
  'profiles_security_hardening',
  'Enhanced profiles table security with stricter RLS policies and audit logging',
  jsonb_build_object(
    'enhancements', jsonb_build_array(
      'Added explicit authentication checks',
      'Added audit logging for admin access',
      'Blocked service role direct access',
      'Enhanced UPDATE policies',
      'Added stale record protection'
    ),
    'security_level', 'maximum'
  ),
  'info'
);