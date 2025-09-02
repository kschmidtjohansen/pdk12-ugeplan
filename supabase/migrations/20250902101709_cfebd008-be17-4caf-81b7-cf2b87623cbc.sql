-- Create case folder mappings table for custom OneDrive folder management
CREATE TABLE public.case_folder_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  custom_folder_name TEXT NOT NULL,
  folder_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.case_folder_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for case folder mappings
CREATE POLICY "Admin and skadeleder can manage case folder mappings"
ON public.case_folder_mappings
FOR ALL
TO authenticated
USING (is_admin_or_skadeleder())
WITH CHECK (is_admin_or_skadeleder());

CREATE POLICY "All authenticated users can view case folder mappings"
ON public.case_folder_mappings
FOR SELECT
TO authenticated
USING (true);

-- Create index for efficient case number lookups
CREATE INDEX idx_case_folder_mappings_case_number ON public.case_folder_mappings(case_number);

-- Create trigger for updated_at
CREATE TRIGGER update_case_folder_mappings_updated_at
BEFORE UPDATE ON public.case_folder_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();