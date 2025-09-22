-- Fix employee leave status display by including on_leave field in get_profiles_basic function

-- Update get_profiles_basic function to include on_leave field since it's needed for availability display
CREATE OR REPLACE FUNCTION public.get_profiles_basic()
 RETURNS TABLE(id uuid, name text, email text, job_title text, status employee_status, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone, on_leave boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    'User accessed basic profile information including leave status',
    jsonb_build_object(
      'accessing_user_role', current_user_role,
      'access_type', 'basic_profiles_list_with_leave_status'
    ),
    'info'
  );
  
  -- Return basic profile information based on role
  IF current_user_role IN ('administrator', 'skadeleder') THEN
    -- Admin/skadeleder can see basic info of all employees including leave status
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.email,
      p.job_title,
      p.status,
      p.avatar_url,
      p.created_at,
      p.updated_at,
      p.on_leave  -- Now included for proper availability display
    FROM public.profiles p
    ORDER BY p.name;
    
  ELSIF current_user_role IN ('servicemedarbejder', 'vikar') THEN
    -- Service employees can see basic info of active colleagues including leave status for work coordination
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.email,
      p.job_title,
      p.status,
      p.avatar_url,
      p.created_at,
      p.updated_at,
      p.on_leave  -- Needed for availability display in planner/dashboard
    FROM public.profiles p
    WHERE p.status = 'active'
    ORDER BY p.name;
    
  ELSE
    -- Unknown role, return empty result
    RETURN;
  END IF;
END;
$function$