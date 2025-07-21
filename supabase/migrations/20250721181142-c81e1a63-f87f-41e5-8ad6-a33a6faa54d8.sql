-- Critical Fix: Add missing AFD12 department associations and fix Kasper's role
-- First, add the missing user_departments entries for AFD12 users
INSERT INTO public.user_departments (user_id, department_id, is_primary)
SELECT 
  p.id as user_id,
  p.department_id,
  true as is_primary
FROM public.profiles p
WHERE p.department_id = (SELECT id FROM public.departments WHERE code = 'AFD12')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_departments ud 
    WHERE ud.user_id = p.id AND ud.department_id = p.department_id
  );

-- Update Kasper to be superadmin instead of administrator
UPDATE public.user_roles 
SET role = 'superadmin'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com');

-- Recreate the helper functions that failed to create
CREATE OR REPLACE FUNCTION public.is_superadmin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_admin_privileges(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid 
    AND role IN ('administrator', 'skadeleder', 'superadmin')
  );
$$;