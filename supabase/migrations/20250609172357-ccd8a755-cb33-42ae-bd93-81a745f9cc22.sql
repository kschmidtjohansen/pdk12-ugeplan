
-- Step 1: Fix the infinite recursion by redesigning RLS policies
-- First, drop the problematic policies that cause circular references

-- Drop existing problematic policies on assignments table
DROP POLICY IF EXISTS "Servicemedarbejder can view own assignments" ON public.assignments;

-- Drop any existing policies on assignments_employees that might conflict
DROP POLICY IF EXISTS "Users can view their assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "Admins can manage assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "System can manage assignment relationships" ON public.assignments_employees;

-- Step 2: Create security definer function to check assignment access without recursion
CREATE OR REPLACE FUNCTION public.can_user_access_assignment(assignment_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  -- Check if user is admin/skadeleder OR is assigned to the assignment OR is responsible user
  SELECT (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = can_user_access_assignment.user_id 
      AND role IN ('administrator', 'skadeleder')
    )
    OR EXISTS (
      SELECT 1 FROM public.assignments_employees 
      WHERE assignments_employees.assignment_id = can_user_access_assignment.assignment_id 
      AND assignments_employees.user_id = can_user_access_assignment.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.assignments
      WHERE assignments.id = can_user_access_assignment.assignment_id
      AND assignments.responsible_user_id = can_user_access_assignment.user_id
    )
  );
$function$;

-- Step 3: Enable RLS on assignments_employees table and create proper policies
ALTER TABLE public.assignments_employees ENABLE ROW LEVEL SECURITY;

-- Policy for assignments_employees - users can see their own relationships
CREATE POLICY "Users can view their own assignment relationships"
ON public.assignments_employees FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

-- Policy for assignments_employees - only admins can modify relationships
CREATE POLICY "Admins can manage assignment relationships"
ON public.assignments_employees FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- Step 4: Recreate the assignments policies using the new security definer function
CREATE POLICY "Servicemedarbejder can view accessible assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (
  public.is_admin_or_skadeleder() 
  OR public.can_user_access_assignment(id, auth.uid())
);

-- Step 5: Enable RLS on profiles table and create comprehensive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "All authenticated users can view profiles" ON public.profiles;

-- Create comprehensive policies for profiles table
CREATE POLICY "All authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Step 6: Add index for the new function to improve performance
CREATE INDEX IF NOT EXISTS idx_assignments_employees_composite 
ON public.assignments_employees (assignment_id, user_id);

-- Step 7: Update the existing can_access_assignment function to use the new logic
CREATE OR REPLACE FUNCTION public.can_access_assignment(assignment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT public.can_user_access_assignment(assignment_id, auth.uid());
$function$;
