
-- Drop the existing policy that only allows authenticated users
DROP POLICY "Everyone can view departments" ON public.departments;

-- Create new policy that allows both authenticated and unauthenticated users to view active departments
CREATE POLICY "Everyone can view active departments" 
ON public.departments 
FOR SELECT 
USING (is_active = true);
