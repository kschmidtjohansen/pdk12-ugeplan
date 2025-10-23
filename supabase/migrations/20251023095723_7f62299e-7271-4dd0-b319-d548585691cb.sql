-- Fix get_demo_profiles_admin_detailed to return role as text instead of enum
DROP FUNCTION IF EXISTS public.get_demo_profiles_admin_detailed(boolean);

CREATE OR REPLACE FUNCTION public.get_demo_profiles_admin_detailed(full_access boolean DEFAULT false)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  job_title text,
  notes text,
  status employee_status,
  on_leave boolean,
  is_temporary boolean,
  expires_at timestamptz,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_email text;
BEGIN
  -- Get current user email
  SELECT au.email INTO current_user_email
  FROM auth.users au
  WHERE au.id = auth.uid();
  
  -- Only allow demo user
  IF current_user_email != 'test@polygongroup.com' THEN
    RETURN;
  END IF;
  
  -- Return demo profiles with optional masking
  IF full_access THEN
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
    FROM demo.profiles p
    LEFT JOIN demo.user_roles ur ON p.id = ur.user_id
    ORDER BY p.name;
  ELSE
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      public.mask_email(p.email) as email,
      public.mask_phone(p.phone) as phone,
      p.job_title,
      NULL::text as notes,
      p.status,
      p.on_leave,
      p.is_temporary,
      p.expires_at,
      p.avatar_url,
      p.created_at,
      p.updated_at,
      COALESCE(ur.role::text, 'servicemedarbejder') as role
    FROM demo.profiles p
    LEFT JOIN demo.user_roles ur ON p.id = ur.user_id
    ORDER BY p.name;
  END IF;
END;
$$;