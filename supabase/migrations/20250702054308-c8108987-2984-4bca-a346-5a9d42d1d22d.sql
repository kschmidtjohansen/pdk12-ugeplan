
-- Clean up user roles table to ensure only Kasper has administrator role
-- and remove any duplicate role entries

-- First, let's see what we have and clean up duplicates
DELETE FROM public.user_roles 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM public.user_roles 
  GROUP BY user_id, role
);

-- Remove administrator role from all users except Kasper
-- (assuming Kasper's profile has the name 'Kasper Johansen' or similar)
DELETE FROM public.user_roles 
WHERE role = 'administrator' 
AND user_id NOT IN (
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.name ILIKE '%kasper%'
);

-- Add constraint to prevent duplicate role assignments per user
ALTER TABLE public.user_roles 
ADD CONSTRAINT unique_user_role UNIQUE (user_id, role);

-- Create a view to help debug role assignments
CREATE OR REPLACE VIEW public.user_roles_debug AS
SELECT 
  p.name,
  p.email,
  ur.role,
  ur.created_at
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY p.name, ur.role;
