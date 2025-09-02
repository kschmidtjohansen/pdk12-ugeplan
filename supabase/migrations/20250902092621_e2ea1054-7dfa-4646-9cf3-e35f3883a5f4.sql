-- Create assignment-files storage bucket for file attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-files', 'assignment-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for assignment files
CREATE POLICY "Authenticated users can view assignment files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assignment-files');

CREATE POLICY "Authenticated users can upload assignment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own uploaded assignment files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own uploaded assignment files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);