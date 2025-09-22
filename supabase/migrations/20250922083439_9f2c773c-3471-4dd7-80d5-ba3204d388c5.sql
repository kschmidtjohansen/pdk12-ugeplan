-- SECURITY FIX: Enhance profiles table security to prevent unauthorized access to personal information
-- This addresses the "Employee Personal Information Could Be Stolen by Hackers" vulnerability

-- Step 1: Create a secure view for basic profile information (non-sensitive)
CREATE OR REPLACE VIEW public.profiles_basic AS
SELECT 
  id,
  name,
  email,
  job_title,
  status,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

-- Step 2: Create a secure view for detailed profile information (for admins only)
CREATE OR REPLACE VIEW public.profiles_detailed AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.phone,
  p.job_title,
  p.notes,
  p.status,
  p.on_leave,
  p.is_temporary,
  p.expires_at,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id;

-- Step 3: Enable RLS on the new views
ALTER VIEW public.profiles_basic SET (security_invoker = true);
ALTER VIEW public.profiles_detailed SET (security_invoker = true);

-- Step 4: Create secure function to check if user can access detailed profile info
CREATE OR REPLACE FUNCTION public.can_access_detailed_profile(profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
BEGIN
  current_user_id := auth.uid();
  
  -- Users can always access their own detailed profile
  IF current_user_id = profile_user_id THEN
    RETURN true;
  END IF;
  
  -- Get current user's role
  SELECT COALESCE(ur.role::text, 'servicemedarbejder') 
  INTO current_user_role
  FROM public.user_roles ur 
  WHERE ur.user_id = current_user_id;
  
  -- Only administrators can access other users' detailed profiles
  IF current_user_role = 'administrator' THEN
    -- Log admin access to detailed profile information
    PERFORM public.log_security_event_safe(
      'admin_detailed_profile_access',
      format('Administrator accessed detailed profile for user %s', profile_user_id),
      jsonb_build_object(
        'accessing_admin_id', current_user_id,
        'target_profile_id', profile_user_id,
        'access_type', 'detailed_profile_view'
      ),
      'warning'
    );
    RETURN true;
  END IF;
  
  -- Log unauthorized access attempts
  PERFORM public.log_security_event_safe(
    'unauthorized_detailed_profile_access_attempt',
    format('Unauthorized attempt to access detailed profile for user %s', profile_user_id),
    jsonb_build_object(
      'attempting_user_id', current_user_id,
      'attempting_user_role', current_user_role,
      'target_profile_id', profile_user_id
    ),
    'error'
  );
  
  RETURN false;
END;
$$;

-- Step 5: Create RLS policies for the basic view (more permissive for basic info)
DROP POLICY IF EXISTS "Basic profile info access" ON public.profiles_basic;
CREATE POLICY "Basic profile info access" ON public.profiles_basic
FOR SELECT TO authenticated 
USING (
  -- Users can see basic info of colleagues (for assignment purposes)
  -- but not sensitive personal details
  auth.uid() IS NOT NULL AND (
    -- Own profile
    id = auth.uid() OR
    -- Admin/skadeleder can see basic info of all employees
    is_admin_or_skadeleder() OR
    -- Service employees can see basic info of colleagues for work purposes
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('servicemedarbejder', 'vikar')
    )
  )
);

-- Step 6: Create RLS policies for the detailed view (highly restrictive)
DROP POLICY IF EXISTS "Detailed profile info access" ON public.profiles_detailed;
CREATE POLICY "Detailed profile info access" ON public.profiles_detailed
FOR SELECT TO authenticated 
USING (
  can_access_detailed_profile(id)
);

-- Step 7: Create a function to safely log profile access attempts
CREATE OR REPLACE FUNCTION public.log_security_event_safe(
  event_type text,
  event_message text,
  event_details jsonb DEFAULT NULL,
  severity text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert security event log with error handling
  BEGIN
    INSERT INTO public.logs (event_type, message, details)
    VALUES (
      event_type,
      event_message,
      jsonb_build_object(
        'user_id', auth.uid(),
        'timestamp', now(),
        'severity', severity,
        'details', COALESCE(event_details, '{}')
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- If logging fails, don't block the main operation
    -- but try to log to a backup location or system
    NULL;
  END;
END;
$$;

-- Step 8: Update existing profiles table RLS policies to be more restrictive
-- Drop existing policies
DROP POLICY IF EXISTS "profiles_admin_access_audited" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_access_only" ON public.profiles;

-- Create new, more restrictive policies for direct table access
CREATE POLICY "profiles_own_access_strict" ON public.profiles
FOR SELECT TO authenticated 
USING (
  id = auth.uid() AND (
    SELECT (log_security_event_safe(
      'profile_self_access',
      'User accessed own profile directly',
      jsonb_build_object('profile_id', id),
      'info'
    ) IS NULL) OR true
  )
);

CREATE POLICY "profiles_admin_minimal_access" ON public.profiles
FOR SELECT TO authenticated 
USING (
  is_admin_user() AND (
    SELECT (log_security_event_safe(
      'profile_admin_direct_access',
      'Administrator accessed profile table directly',
      jsonb_build_object(
        'target_profile_id', id,
        'accessing_admin', auth.uid()
      ),
      'warning'
    ) IS NULL) OR true
  )
);

-- Step 9: Grant appropriate permissions on the new views
GRANT SELECT ON public.profiles_basic TO authenticated;
GRANT SELECT ON public.profiles_detailed TO authenticated;

-- Step 10: Create index for better performance on role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- Step 11: Add comments for documentation
COMMENT ON VIEW public.profiles_basic IS 'Secure view exposing only basic profile information for general access';
COMMENT ON VIEW public.profiles_detailed IS 'Secure view exposing detailed profile information only to authorized users';
COMMENT ON FUNCTION public.can_access_detailed_profile(uuid) IS 'Security function to determine if user can access detailed profile information';
COMMENT ON FUNCTION public.log_security_event_safe(text, text, jsonb, text) IS 'Safe logging function that does not fail main operations if logging fails';