-- Add case number and OneDrive folder tracking to assignments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS case_number TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS onedrive_folder_id TEXT;

-- Create case-OneDrive mapping table
CREATE TABLE IF NOT EXISTS case_onedrive_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  folder_id TEXT NOT NULL,
  folder_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE case_onedrive_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for case_onedrive_mappings
CREATE POLICY "Admin and skadeleder can manage OneDrive mappings"
ON case_onedrive_mappings
FOR ALL
TO authenticated
USING (is_admin_or_skadeleder())
WITH CHECK (is_admin_or_skadeleder());

CREATE POLICY "All authenticated users can view OneDrive mappings"
ON case_onedrive_mappings
FOR SELECT
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_case_onedrive_mappings_updated_at
BEFORE UPDATE ON case_onedrive_mappings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();