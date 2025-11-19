-- Make employee_id nullable to support external/manual name entries
ALTER TABLE on_call_duties 
ALTER COLUMN employee_id DROP NOT NULL;

-- Add a check constraint to ensure either employee_id OR notes with EKSTERN: prefix exists
ALTER TABLE on_call_duties
ADD CONSTRAINT employee_or_external_check 
CHECK (
  employee_id IS NOT NULL 
  OR (notes IS NOT NULL AND notes LIKE 'EKSTERN:%')
);

-- Add comment explaining the schema design
COMMENT ON COLUMN on_call_duties.employee_id IS 
'Employee ID for internal staff. NULL for external personnel (manual entries stored in notes with EKSTERN: prefix)';