-- Fix the get_profile_detailed function to use correct user_role type
-- The function was referencing 'user_role' but the actual enum is 'app_role'
DROP FUNCTION IF EXISTS public.get_profile_detailed(uuid);

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
  role text  -- Changed from user_role to text to avoid type issues
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_id uuid;
  current_user_role text;
  can_access boolean := false;
BEGIN
  current_user_id := auth.uid();
  
  -- Get current user's role safely
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
    COALESCE(ur.role::text, 'servicemedarbejder') as role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.id = profile_user_id;
END;
$function$;