-- Create a debug version of get_profiles_basic to bypass auth issues temporarily
-- This will help us identify if the issue is with auth or data

CREATE OR REPLACE FUNCTION public.get_profiles_basic_debug()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  job_title text,
  status employee_status,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  on_leave boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Return all profiles without auth checks for debugging
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
    COALESCE(p.on_leave, false) as on_leave
  FROM public.profiles p
  ORDER BY p.name;
END;
$function$

-- Also create a function to check current auth state
CREATE OR REPLACE FUNCTION public.debug_auth_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result jsonb;
BEGIN
  result := jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'user_roles_count', (SELECT COUNT(*) FROM public.user_roles),
    'profiles_count', (SELECT COUNT(*) FROM public.profiles),
    'current_user_role', (
      SELECT COALESCE(ur.role::text, 'no_role') 
      FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );
  
  RETURN result;
END;
$function$