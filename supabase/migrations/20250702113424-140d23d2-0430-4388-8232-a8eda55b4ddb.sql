
-- Fix user role visibility issue by updating RLS policy
-- Drop the overly restrictive policy that only allows users to see their own roles
DROP POLICY IF EXISTS "user_roles_clean_self" ON public.user_roles;

-- Create new policy that allows admin and skadeleder to see all roles
-- while servicemedarbejder can only see their own role
CREATE POLICY "user_roles_visibility_by_role" ON public.user_roles
FOR SELECT USING (
  -- Users can always see their own role
  user_id = auth.uid() 
  OR 
  -- Admin and skadeleder can see all roles
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
  )
);
