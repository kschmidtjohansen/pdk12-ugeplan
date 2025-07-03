-- Update assignment_employee_select_policy to allow servicemedarbejder users to see all team members for assignments they're involved in
DROP POLICY IF EXISTS "assignment_employee_select_policy" ON public.assignments_employees;

CREATE POLICY "assignment_employee_select_policy" 
ON public.assignments_employees 
FOR SELECT 
USING (
  -- Current user can see their own assignment relationships
  (user_id = auth.uid()) 
  OR 
  -- Admins and skadeleder can see all
  is_admin_or_skadeleder()
  OR
  -- Servicemedarbejder users can see all team members for assignments where they are involved
  (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'servicemedarbejder'
  ) AND EXISTS (
    SELECT 1 FROM public.assignments_employees ae_check
    WHERE ae_check.assignment_id = assignments_employees.assignment_id
    AND ae_check.user_id = auth.uid()
  ))
);