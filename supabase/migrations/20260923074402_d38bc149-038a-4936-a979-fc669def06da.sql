CREATE OR REPLACE FUNCTION public.validate_temporary_employee_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_date date;
  v_expires timestamptz;
  v_is_temp boolean;
BEGIN
  SELECT p.is_temporary, p.expires_at INTO v_is_temp, v_expires
  FROM public.profiles p WHERE p.id = NEW.user_id;

  IF COALESCE(v_is_temp, false) = false OR v_expires IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT a.assignment_date INTO v_date
  FROM public.assignments a WHERE a.id = NEW.assignment_id;

  IF v_date IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_date > (v_expires AT TIME ZONE 'UTC')::date THEN
    RAISE EXCEPTION 'Midlertidig adgang er udløbet for denne medarbejder (udløb: %)', (v_expires AT TIME ZONE 'UTC')::date
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_temporary_employee_assignment_trg ON public.assignments_employees;

CREATE TRIGGER validate_temporary_employee_assignment_trg
BEFORE INSERT OR UPDATE ON public.assignments_employees
FOR EACH ROW EXECUTE FUNCTION public.validate_temporary_employee_assignment();