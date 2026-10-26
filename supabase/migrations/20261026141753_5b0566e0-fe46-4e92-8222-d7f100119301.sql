CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = uid
  ORDER BY CASE role::text
    WHEN 'super_admin' THEN 1 WHEN 'administrator' THEN 2 WHEN 'skadeleder' THEN 3
    WHEN 'fugttekniker' THEN 4 WHEN 'servicemedarbejder' THEN 5 WHEN 'vikar' THEN 6 ELSE 7 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = user_uuid
  ORDER BY CASE role::text
    WHEN 'super_admin' THEN 1 WHEN 'administrator' THEN 2 WHEN 'skadeleder' THEN 3
    WHEN 'fugttekniker' THEN 4 WHEN 'servicemedarbejder' THEN 5 WHEN 'vikar' THEN 6 ELSE 7 END
  LIMIT 1;
$$;