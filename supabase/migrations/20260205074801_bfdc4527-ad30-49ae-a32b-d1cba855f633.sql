-- Create assignment_messages table for messenger functionality
CREATE TABLE public.assignment_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignment_files table for file management
CREATE TABLE public.assignment_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  folder_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_assignment_messages_assignment_id ON public.assignment_messages(assignment_id);
CREATE INDEX idx_assignment_messages_created_at ON public.assignment_messages(created_at);
CREATE INDEX idx_assignment_files_assignment_id ON public.assignment_files(assignment_id);
CREATE INDEX idx_assignment_files_folder_name ON public.assignment_files(folder_name);

-- Enable RLS on both tables
ALTER TABLE public.assignment_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_messages
-- All authenticated users can read messages on assignments they have access to
CREATE POLICY "Users can read assignment messages"
ON public.assignment_messages
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- All authenticated users can create messages
CREATE POLICY "Users can create assignment messages"
ON public.assignment_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.assignment_messages
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for assignment_files
-- All authenticated users can read files
CREATE POLICY "Users can read assignment files"
ON public.assignment_files
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- All authenticated users can upload files
CREATE POLICY "Users can upload assignment files"
ON public.assignment_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own files, or admins/skadeledere can delete any
CREATE POLICY "Users can delete assignment files"
ON public.assignment_files
FOR DELETE
USING (
  auth.uid() = user_id 
  OR public.is_admin_or_skadeleder()
);

-- Create storage bucket for assignment files if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-files',
  'assignment-files',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for assignment-files bucket
CREATE POLICY "Authenticated users can read assignment files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'assignment-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload assignment files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'assignment-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own assignment files or admins can delete any"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'assignment-files' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin_or_skadeleder()
  )
);