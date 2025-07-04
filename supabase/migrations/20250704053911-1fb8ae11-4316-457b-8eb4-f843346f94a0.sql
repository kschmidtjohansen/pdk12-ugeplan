-- Simplify assignment_employee_select_policy to fix servicemedarbejder filtering
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
  -- Servicemedarbejder users can see ALL assignment-employee relationships (not just their own)
  (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'servicemedarbejder'
  ))
);