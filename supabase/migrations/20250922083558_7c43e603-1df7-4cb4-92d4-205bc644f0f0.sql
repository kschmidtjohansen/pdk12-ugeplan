-- SECURITY FIX: Enhanced profiles table security to prevent unauthorized access to personal information
-- This addresses the "Employee Personal Information Could Be Stolen by Hackers" vulnerability

-- Step 1: Create a safe logging function that doesn't fail main operations
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
    NULL;
  END;
END;
$$;

-- Step 2: Create function to get basic profile information (non-sensitive fields only)
CREATE OR REPLACE FUNCTION public.get_profiles_basic()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  job_title text,
  status employee_status,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
BEGIN
  current_user_id := auth.uid();
  
  -- Get current user's role
  SELECT COALESCE(ur.role::text, 'servicemedarbejder') 
  INTO current_user_role
  FROM public.user_roles ur 
  WHERE ur.user_id = current_user_id;
  
  -- Log the access attempt
  PERFORM public.log_security_event_safe(
    'profiles_basic_access',
    'User accessed basic profile information',
    jsonb_build_object(
      'accessing_user_role', current_user_role,
      'access_type', 'basic_profiles_list'
    ),
    'info'
  );
  
  -- Return basic profile information based on role
  IF current_user_role IN ('administrator', 'skadeleder') THEN
    -- Admin/skadeleder can see basic info of all employees
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.email,
      p.job_title,
      p.status,
      p.avatar_url,
      p.created_at,
      p.updated_at
    FROM public.profiles p
    ORDER BY p.name;
    
  ELSIF current_user_role IN ('servicemedarbejder', 'vikar') THEN
    -- Service employees can see basic info of active colleagues for work purposes
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.email,
      p.job_title,
      p.status,
      p.avatar_url,
      p.created_at,
      p.updated_at
    FROM public.profiles p
    WHERE p.status = 'active'
    ORDER BY p.name;
    
  ELSE
    -- Unknown role, return empty result
    RETURN;
  END IF;
END;
$$;

-- Step 3: Create function to get detailed profile information (with sensitive fields)
CREATE OR REPLACE FUNCTION public.get_profile_detailed(profile_user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  phone text,
  job_title text,
  notes text,
  status employee_status,
  on_leave boolean,
  is_temporary boolean,
  expires_at timestamp with time zone,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
  can_access boolean := false;
BEGIN
  current_user_id := auth.uid();
  
  -- Get current user's role
  SELECT COALESCE(ur.role::text, 'servicemedarbejder') 
  INTO current_user_role
  FROM public.user_roles ur 
  WHERE ur.user_id = current_user_id;
  
  -- Check access permissions
  can_access := (
    -- Users can access their own detailed profile
    current_user_id = profile_user_id OR
    -- Only administrators can access other users' detailed profiles
    current_user_role = 'administrator'
  );
  
  IF NOT can_access THEN
    -- Log unauthorized access attempt
    PERFORM public.log_security_event_safe(
      'unauthorized_detailed_profile_access',
      format('Unauthorized attempt to access detailed profile for user %s', profile_user_id),
      jsonb_build_object(
        'attempting_user_role', current_user_role,
        'target_profile_id', profile_user_id
      ),
      'error'
    );
    RETURN;
  END IF;
  
  -- Log authorized access
  PERFORM public.log_security_event_safe(
    CASE 
      WHEN current_user_id = profile_user_id THEN 'own_detailed_profile_access'
      ELSE 'admin_detailed_profile_access'
    END,
    format('Authorized access to detailed profile for user %s', profile_user_id),
    jsonb_build_object(
      'accessing_user_role', current_user_role,
      'target_profile_id', profile_user_id,
      'is_self_access', current_user_id = profile_user_id
    ),
    CASE WHEN current_user_id = profile_user_id THEN 'info' ELSE 'warning' END
  );
  
  -- Return detailed profile information
  RETURN QUERY
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
    COALESCE(ur.role, 'servicemedarbejder'::user_role) as role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.id = profile_user_id;
END;
$$;

-- Step 4: Update existing profiles table RLS policies to be more restrictive
-- Drop existing policies
DROP POLICY IF EXISTS "profiles_admin_access_audited" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_access_only" ON public.profiles;

-- Create new, highly restrictive policies for direct table access
CREATE POLICY "profiles_own_access_only_strict" ON public.profiles
FOR SELECT TO authenticated 
USING (
  id = auth.uid() AND (
    SELECT (log_security_event_safe(
      'profile_direct_self_access',
      'User accessed own profile via direct table access',
      jsonb_build_object('profile_id', id),
      'info'
    ) IS NULL) OR true
  )
);

-- Only allow administrators to directly access other profiles (heavily logged)
CREATE POLICY "profiles_admin_emergency_access" ON public.profiles
FOR SELECT TO authenticated 
USING (
  is_admin_user() AND (
    SELECT (log_security_event_safe(
      'profile_admin_direct_access',
      'Administrator accessed profile table directly (emergency access)',
      jsonb_build_object(
        'target_profile_id', id,
        'accessing_admin', auth.uid(),
        'access_method', 'direct_table_access'
      ),
      'warning'
    ) IS NULL) OR true
  )
);

-- Step 5: Create function to validate if a user can access specific profile fields
CREATE OR REPLACE FUNCTION public.can_access_profile_field(
  target_user_id uuid, 
  field_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
  sensitive_fields text[] := ARRAY['phone', 'notes', 'is_temporary', 'expires_at'];
BEGIN
  current_user_id := auth.uid();
  
  -- Get current user's role
  SELECT COALESCE(ur.role::text, 'servicemedarbejder') 
  INTO current_user_role
  FROM public.user_roles ur 
  WHERE ur.user_id = current_user_id;
  
  -- Always allow access to own profile
  IF current_user_id = target_user_id THEN
    RETURN true;
  END IF;
  
  -- For sensitive fields, only allow admin access
  IF field_name = ANY(sensitive_fields) THEN
    RETURN current_user_role = 'administrator';
  END IF;
  
  -- For non-sensitive fields, allow admin/skadeleder access
  RETURN current_user_role IN ('administrator', 'skadeleder');
END;
$$;

-- Step 6: Create index for better performance on role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Step 7: Grant permissions on the new functions
GRANT EXECUTE ON FUNCTION public.get_profiles_basic() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_detailed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_profile_field(uuid, text) TO authenticated;

-- Step 8: Add security documentation
COMMENT ON FUNCTION public.get_profiles_basic() IS 'Secure function to get basic profile information with role-based access control';
COMMENT ON FUNCTION public.get_profile_detailed(uuid) IS 'Secure function to get detailed profile information with strict access control and logging';
COMMENT ON FUNCTION public.can_access_profile_field(uuid, text) IS 'Function to validate field-level access permissions for profile data';
COMMENT ON FUNCTION public.log_security_event_safe(text, text, jsonb, text) IS 'Safe logging function that does not fail main operations if logging fails';