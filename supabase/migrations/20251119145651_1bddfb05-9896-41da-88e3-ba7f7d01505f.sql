-- Drop unique constraint to allow multiple people on same duty type per day
ALTER TABLE demo.on_call_duties 
DROP CONSTRAINT IF EXISTS on_call_duties_duty_date_duty_type_key;

ALTER TABLE public.on_call_duties 
DROP CONSTRAINT IF EXISTS on_call_duties_duty_date_duty_type_key;

-- Update demo validation function to skip role check for manual entries (NULL employee_id)
CREATE OR REPLACE FUNCTION demo.validate_duty_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = demo, public
AS $$
BEGIN
  -- Only validate role for skadeleder_vagt if employee_id is provided (not a manual entry)
  IF NEW.duty_type = 'skadeleder_vagt' AND NEW.employee_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM demo.user_roles
      WHERE user_id = NEW.employee_id
      AND role IN ('administrator', 'skadeleder')
    ) THEN
      RAISE EXCEPTION 'Only administrators and skadeledere can be assigned to skadeleder_vagt';
    END IF;
  END IF;
  
  -- Manual entries (employee_id IS NULL) are allowed for all duty types
  -- They are identified by EKSTERN: prefix in notes column
  
  RETURN NEW;
END;
$$;

-- Update public validation function to skip role check for manual entries (NULL employee_id)
CREATE OR REPLACE FUNCTION public.validate_duty_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate role for skadeleder_vagt if employee_id is provided (not a manual entry)
  IF NEW.duty_type = 'skadeleder_vagt' AND NEW.employee_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = NEW.employee_id
      AND role IN ('administrator', 'skadeleder')
    ) THEN
      RAISE EXCEPTION 'Only administrators and skadeledere can be assigned to skadeleder_vagt';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION demo.validate_duty_assignment() IS 
'Validates duty assignments: requires admin/skadeleder role for skadeleder_vagt when employee_id is provided. Allows manual external entries (employee_id IS NULL with EKSTERN: notes) for all duty types.';

COMMENT ON FUNCTION public.validate_duty_assignment() IS 
'Validates duty assignments: requires admin/skadeleder role for skadeleder_vagt when employee_id is provided. Allows manual external entries (employee_id IS NULL with EKSTERN: notes) for all duty types.';