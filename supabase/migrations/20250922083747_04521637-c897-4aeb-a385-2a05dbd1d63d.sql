-- Add admin-specific function to get all profiles with sensitive data for UserManagement component
-- This addresses the TypeScript errors in the admin interface

CREATE OR REPLACE FUNCTION public.get_profiles_admin_detailed()
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
  
  -- Only administrators can access this function
  IF current_user_role != 'administrator' THEN
    -- Log unauthorized access attempt
    PERFORM public.log_security_event_safe(
      'unauthorized_admin_profiles_access',
      'Non-administrator attempted to access admin profiles function',
      jsonb_build_object(
        'attempting_user_role', current_user_role,
        'function', 'get_profiles_admin_detailed'
      ),
      'error'
    );
    RETURN;
  END IF;
  
  -- Log authorized admin access
  PERFORM public.log_security_event_safe(
    'admin_profiles_detailed_access',
    'Administrator accessed detailed profiles list',
    jsonb_build_object(
      'accessing_admin_id', current_user_id,
      'function', 'get_profiles_admin_detailed'
    ),
    'info'
  );
  
  -- Return all profile information for administrators
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
    p.updated_at
  FROM public.profiles p
  ORDER BY p.name;
END;
$$;

-- Grant permission on the new admin function
GRANT EXECUTE ON FUNCTION public.get_profiles_admin_detailed() TO authenticated;

-- Add documentation
COMMENT ON FUNCTION public.get_profiles_admin_detailed() IS 'Admin-only function to get detailed profile information including sensitive fields';