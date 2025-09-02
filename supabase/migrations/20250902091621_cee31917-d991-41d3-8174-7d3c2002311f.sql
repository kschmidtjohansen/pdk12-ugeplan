-- Phase 1: Database & Storage Foundation
-- Add attachment_files column to assignments table
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS attachment_files JSONB DEFAULT '[]'::jsonb;

-- Create assignment-files storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-files', 'assignment-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for assignment files bucket
CREATE POLICY "Authenticated users can view assignment files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assignment-files');

CREATE POLICY "Admin and Skadeleder can upload assignment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files' AND
  (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  )
);

CREATE POLICY "Admin and Skadeleder can update assignment files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  )
);

CREATE POLICY "Admin and Skadeleder can delete assignment files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  )
);

-- Create updated_at trigger for assignments table if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS handle_assignment_updated_at ON public.assignments;
CREATE TRIGGER handle_assignment_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_assignment_updated_at();