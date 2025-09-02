-- Create storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', false);

-- Create RLS policies for assignment files bucket
CREATE POLICY "Authenticated users can view assignment files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assignment-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload assignment files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'assignment-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own assignment files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'assignment-files' AND auth.uid() = owner_id::uuid);

CREATE POLICY "Admins and skadeleder can delete assignment files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'assignment-files' AND (
  is_admin_or_skadeleder() OR auth.uid() = owner_id::uuid
));