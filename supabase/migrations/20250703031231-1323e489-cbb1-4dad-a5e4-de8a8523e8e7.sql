-- Update assignment SELECT policy to allow servicemedarbejder users to see ALL assignments
DROP POLICY IF EXISTS "assignment_select_policy" ON public.assignments;

CREATE POLICY "assignment_select_policy" 
ON public.assignments 
FOR SELECT 
USING (
  -- Admins and skadeleder can see all assignments
  is_admin_or_skadeleder() 
  OR 
  -- Users assigned to the assignment can see it
  can_user_access_assignment(id, auth.uid())
  OR
  -- Servicemedarbejder users can see ALL assignments (not just published)
  (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'servicemedarbejder'
  ))
);