
-- Add unique constraint for department_id + setting_key (needed for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'department_settings_department_id_setting_key_key'
  ) THEN
    ALTER TABLE public.department_settings 
      ADD CONSTRAINT department_settings_department_id_setting_key_key 
      UNIQUE (department_id, setting_key);
  END IF;
END $$;
