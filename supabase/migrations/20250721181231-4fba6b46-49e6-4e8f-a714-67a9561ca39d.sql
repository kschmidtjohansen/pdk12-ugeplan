-- Step 1: Ensure superadmin enum value exists
DO $$
BEGIN
  -- Check if superadmin already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'superadmin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'superadmin';
  END IF;
END
$$;

-- Step 2: Add missing AFD12 department associations
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

-- Step 3: Update Kasper to superadmin
UPDATE public.user_roles 
SET role = 'superadmin'::user_role
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com');

-- Step 4: Create helper functions
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