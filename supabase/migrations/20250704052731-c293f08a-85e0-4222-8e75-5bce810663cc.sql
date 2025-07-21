-- Fix infinite recursion in assignments_employees policy
-- Step 1: Create a security definer function to safely check assignment membership
CREATE OR REPLACE FUNCTION public.is_user_assigned_to_assignment(assignment_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments_employees 
    WHERE assignments_employees.assignment_id = is_user_assigned_to_assignment.assignment_id 
    AND assignments_employees.user_id = is_user_assigned_to_assignment.user_id
  );
$$;

-- Step 2: Update the policy to use the security definer function
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
  ) AND public.is_user_assigned_to_assignment(assignments_employees.assignment_id, auth.uid()))
);