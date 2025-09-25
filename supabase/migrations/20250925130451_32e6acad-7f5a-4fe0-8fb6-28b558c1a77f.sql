-- Add helper masking functions
CREATE OR REPLACE FUNCTION public.mask_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO ''
AS $$
DECLARE
  name_part text;
  domain_part text;
BEGIN
  IF p_email IS NULL OR position('@' in p_email) = 0 THEN
    RETURN NULL;
  END IF;
  name_part := split_part(p_email, '@', 1);
  domain_part := split_part(p_email, '@', 2);
  IF length(name_part) <= 2 THEN
    RETURN left(name_part, 1) || '***@' || domain_part;
  END IF;
  RETURN left(name_part, 1) || repeat('*', greatest(length(name_part) - 2, 1)) || right(name_part, 1) || '@' || domain_part;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO ''
AS $$
DECLARE
  digits text;
  last2 text;
BEGIN
  IF p_phone IS NULL OR length(p_phone) = 0 THEN
    RETURN NULL;
  END IF;
  digits := regexp_replace(p_phone, '\D', '', 'g');
  IF length(digits) <= 2 THEN
    RETURN repeat('*', length(digits));
  END IF;
  last2 := right(digits, 2);
  RETURN repeat('*', length(digits) - 2) || last2;
END;
$$;

-- Update admin profiles function to support masking by default
CREATE OR REPLACE FUNCTION public.get_profiles_admin_detailed(full_access boolean DEFAULT false, access_reason text DEFAULT NULL)
RETURNS TABLE(id uuid, name text, email text, phone text, job_title text, notes text, status employee_status, on_leave boolean, is_temporary boolean, expires_at timestamp with time zone, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone)
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

  -- Log access intent
  PERFORM public.log_security_event_safe(
    CASE WHEN full_access THEN 'admin_profiles_full_access_request' ELSE 'admin_profiles_masked_access' END,
    'Administrator accessed profiles list',
    jsonb_build_object(
      'accessing_admin_id', current_user_id,
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
      p.updated_at
    FROM public.profiles p
    ORDER BY p.name;
  ELSE
    -- Return masked contact details by default
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
      p.updated_at
    FROM public.profiles p
    ORDER BY p.name;
  END IF;
END;
$$;