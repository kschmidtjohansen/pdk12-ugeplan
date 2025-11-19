-- Make employee_id nullable in demo schema to support external/manual name entries
ALTER TABLE demo.on_call_duties
ALTER COLUMN employee_id DROP NOT NULL;

-- Add a check constraint to ensure either employee_id OR notes with EKSTERN: prefix exists
ALTER TABLE demo.on_call_duties
ADD CONSTRAINT demo_employee_or_external_check 
CHECK (
  employee_id IS NOT NULL 
  OR (notes IS NOT NULL AND notes LIKE 'EKSTERN:%')
);

-- Add comment explaining the schema design
COMMENT ON COLUMN demo.on_call_duties.employee_id IS 
'Employee ID for internal staff. NULL for external personnel (manual entries stored in notes with EKSTERN: prefix)';