-- Allow unauthenticated users to view departments (needed for login page department selector)
CREATE POLICY "Anyone can view departments"
ON public.departments
FOR SELECT
USING (true);