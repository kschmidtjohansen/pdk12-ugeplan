
-- Phase 1: Remove the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "user_roles_visibility_by_role" ON public.user_roles;

-- Phase 2: Create a new policy that uses the security definer function to avoid recursion
-- This policy allows users to see their own role, and admin/skadeleder to see all roles
CREATE POLICY "user_roles_safe_visibility" ON public.user_roles
FOR SELECT USING (
  -- Users can always see their own role
  user_id = auth.uid() 
  OR 
  -- Use the security definer function to safely check if current user is admin/skadeleder
  public.get_current_user_role() IN ('administrator', 'skadeleder')
);

-- Phase 3: Verify the fix by testing a simple query
-- This should now work without infinite recursion
SELECT 'Policy fix verification' as status, count(*) as user_roles_count 
FROM public.user_roles;
