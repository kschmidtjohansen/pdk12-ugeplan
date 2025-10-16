-- Convert is_cleaned from BOOLEAN to TEXT with proper values
-- First, add a temporary column
ALTER TABLE public.warehouse_items ADD COLUMN is_cleaned_new TEXT;

-- Migrate existing data: true -> 'ja', false -> 'nej'
UPDATE public.warehouse_items 
SET is_cleaned_new = CASE 
  WHEN is_cleaned = true THEN 'ja'
  WHEN is_cleaned = false THEN 'nej'
  ELSE 'nej'
END;

-- Drop old column and rename new one
ALTER TABLE public.warehouse_items DROP COLUMN is_cleaned;
ALTER TABLE public.warehouse_items RENAME COLUMN is_cleaned_new TO is_cleaned;

-- Set NOT NULL and default
ALTER TABLE public.warehouse_items 
  ALTER COLUMN is_cleaned SET NOT NULL,
  ALTER COLUMN is_cleaned SET DEFAULT 'nej';

-- Add CHECK constraint for valid values
ALTER TABLE public.warehouse_items 
  ADD CONSTRAINT is_cleaned_values 
  CHECK (is_cleaned IN ('ja', 'nej', 'ikke_noedvendigt'));

-- Create index on case_number for warehouse indicators
CREATE INDEX IF NOT EXISTS idx_warehouse_items_case_number 
ON public.warehouse_items(case_number) 
WHERE case_number IS NOT NULL;