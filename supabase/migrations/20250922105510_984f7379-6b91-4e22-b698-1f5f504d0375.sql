-- Create a debug function to check current auth state
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