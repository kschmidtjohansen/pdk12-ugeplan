-- Create OneDrive settings table for admin configuration
CREATE TABLE public.onedrive_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_sharepoint_url TEXT NOT NULL,
  main_folder_path TEXT NOT NULL DEFAULT '/sites/YourSite/Shared Documents/12 Sager',
  folder_naming_pattern TEXT NOT NULL DEFAULT '{case_number}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onedrive_settings ENABLE ROW LEVEL SECURITY;

-- Only administrators can manage OneDrive settings
CREATE POLICY "Administrators can manage OneDrive settings" 
ON public.onedrive_settings 
FOR ALL
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Create trigger for updated_at
CREATE TRIGGER update_onedrive_settings_updated_at
BEFORE UPDATE ON public.onedrive_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.onedrive_settings (base_sharepoint_url, main_folder_path, folder_naming_pattern, is_active)
VALUES ('https://yourcompany.sharepoint.com', '/sites/YourSite/Shared Documents/12 Sager', '{case_number}', false);