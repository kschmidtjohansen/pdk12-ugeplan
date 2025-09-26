-- Drop and recreate the function to fix the return type and allow skadeleder access
DROP FUNCTION IF EXISTS public.get_profiles_admin_detailed(boolean, text);

CREATE OR REPLACE FUNCTION public.get_profiles_admin_detailed(full_access boolean DEFAULT false, access_reason text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, name text, email text, phone text, job_title text, notes text, status employee_status, on_leave boolean, is_temporary boolean, expires_at timestamp with time zone, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone, role user_role)
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

  -- Allow both administrators and skadeledere access (FIXED: was only administrators before)
  IF current_user_role NOT IN ('administrator', 'skadeleder') THEN
    PERFORM public.log_security_event_safe(
      'unauthorized_admin_profiles_access',
      'Non-admin/skadeleder attempted to access profiles function',
      jsonb_build_object(
        'attempting_user_role', current_user_role,
        'function', 'get_profiles_admin_detailed'
      ),
      'error'
    );
    RETURN;
  END IF;

  -- Log access intent
  PERFORM public.log_security_event_safe(
    CASE WHEN full_access THEN 'admin_profiles_full_access_request' ELSE 'admin_profiles_masked_access' END,
    'Admin/Skadeleder accessed profiles list',
    jsonb_build_object(
      'accessing_user_id', current_user_id,
      'accessing_user_role', current_user_role,
      'full_access', full_access,
      'access_reason', access_reason
    ),
    CASE WHEN full_access THEN 'warning' ELSE 'info' END
  );

  IF full_access THEN
    -- Return unmasked data for justified admin flows
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
    ORDER BY p.name;
  ELSE
    -- Return masked contact details by default, but include role information (roles are not PII)
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      public.mask_email(p.email) as email,
      public.mask_phone(p.phone) as phone,
      p.job_title,
      NULL::text as notes, -- hide notes in masked view
      p.status,
      p.on_leave,
      p.is_temporary,
      p.expires_at,
      p.avatar_url,
      p.created_at,
      p.updated_at,
      COALESCE(ur.role, 'servicemedarbejder'::user_role) as role -- Include role even in masked view
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    ORDER BY p.name;
  END IF;
END;
$function$;