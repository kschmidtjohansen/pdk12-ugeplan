
-- Drop both old and new policy names to ensure clean state
DROP POLICY IF EXISTS "Users can view own access" ON public.user_access;
DROP POLICY IF EXISTS "Users can view department access" ON public.user_access;

CREATE POLICY "Users can view department access"
ON public.user_access
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_super_admin()
  OR department_id = ANY(get_user_department_ids())
);
