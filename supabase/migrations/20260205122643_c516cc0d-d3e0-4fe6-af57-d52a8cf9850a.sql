-- Add comment column to assignment_files for image comments
ALTER TABLE public.assignment_files 
ADD COLUMN comment TEXT NULL;

-- Add RLS policy for updating comments
CREATE POLICY "Users can update their own file comments" 
ON public.assignment_files 
FOR UPDATE 
USING (auth.uid() = user_id OR is_admin_or_skadeleder())
WITH CHECK (auth.uid() = user_id OR is_admin_or_skadeleder());