
-- Phase 1: Emergency Database Role Correction
-- Clear all existing roles to start fresh and assign precise roles based on email addresses

-- Step 1: Clear all existing user roles
DELETE FROM public.user_roles;

-- Step 2: Assign administrator role to Kasper (current user)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'administrator'::user_role
FROM public.profiles p
WHERE p.email = 'kasper.johansen@polygongroup.com';

-- Step 3: Assign skadeleder roles to specific users by email
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'skadeleder'::user_role
FROM public.profiles p
WHERE p.email IN (
  'anders.nielsen@polygongroup.com',
  'betina.larsen@polygongroup.com', 
  'nick.hansen@polygongroup.com'
);

-- Step 4: Assign servicemedarbejder role to all remaining users
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'servicemedarbejder'::user_role
FROM public.profiles p
WHERE p.id NOT IN (
  SELECT ur.user_id 
  FROM public.user_roles ur
);

-- Step 5: Create a diagnostic function to verify role assignments
CREATE OR REPLACE FUNCTION public.verify_role_assignments()
RETURNS TABLE (
  user_name text,
  user_email text,
  assigned_role user_role,
  is_current_user boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    p.name,
    p.email,
    ur.role,
    p.id = auth.uid() as is_current_user
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  ORDER BY 
    CASE ur.role 
      WHEN 'administrator' THEN 1
      WHEN 'skadeleder' THEN 2
      WHEN 'servicemedarbejder' THEN 3
      ELSE 4
    END,
    p.name;
$$;
