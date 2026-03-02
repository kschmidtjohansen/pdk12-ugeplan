-- Fix validate_duty_assignment trigger to include super_admin role
CREATE OR REPLACE FUNCTION public.validate_duty_assignment()
RETURNS trigger
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
      AND role IN ('super_admin', 'administrator', 'skadeleder')
    ) THEN
      RAISE EXCEPTION 'Only super_admins, administrators and skadeledere can be assigned to skadeleder_vagt';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;