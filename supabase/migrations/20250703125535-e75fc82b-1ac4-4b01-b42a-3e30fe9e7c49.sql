-- Phase 2: Constraint Optimization
-- Review and optimize constraints for data integrity and performance

-- 1. Add missing NOT NULL constraints where data integrity requires it
-- Ensure critical foreign key columns are not nullable where it makes sense

-- Assignments table - ensure critical fields are not null
ALTER TABLE public.assignments 
ALTER COLUMN assignment_date SET NOT NULL,
ALTER COLUMN from_time SET NOT NULL,
ALTER COLUMN to_time SET NOT NULL,
ALTER COLUMN location SET NOT NULL,
ALTER COLUMN title SET NOT NULL;

-- Profiles table - ensure critical fields are not null
ALTER TABLE public.profiles 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN email SET NOT NULL;

-- User_roles table - ensure role assignments are complete
ALTER TABLE public.user_roles 
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN role SET NOT NULL;

-- Notifications table - ensure required fields
ALTER TABLE public.notifications 
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN message SET NOT NULL,
ALTER COLUMN type SET NOT NULL;

-- Vacations table - ensure date consistency
ALTER TABLE public.vacations 
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN start_date SET NOT NULL,
ALTER COLUMN end_date SET NOT NULL;

-- Cars table - ensure required fields
ALTER TABLE public.cars 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN car_number SET NOT NULL,
ALTER COLUMN number_plate SET NOT NULL,
ALTER COLUMN fuel_card_code SET NOT NULL;

-- 2. Add data validation constraints using triggers (not CHECK constraints)
-- Create validation functions for complex business rules

-- Function to validate assignment time ranges
CREATE OR REPLACE FUNCTION validate_assignment_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure from_time is before to_time
  IF NEW.from_time >= NEW.to_time THEN
    RAISE EXCEPTION 'Assignment from_time must be before to_time';
  END IF;
  
  -- Ensure assignment is not too far in the past (more than 1 year)
  IF NEW.assignment_date < CURRENT_DATE - INTERVAL '1 year' THEN
    RAISE EXCEPTION 'Assignment date cannot be more than 1 year in the past';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger to assignments
DROP TRIGGER IF EXISTS trigger_validate_assignment_times ON public.assignments;
CREATE TRIGGER trigger_validate_assignment_times
  BEFORE INSERT OR UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION validate_assignment_times();

-- Function to validate vacation date ranges
CREATE OR REPLACE FUNCTION validate_vacation_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure start_date is before or equal to end_date
  IF NEW.start_date > NEW.end_date THEN
    RAISE EXCEPTION 'Vacation start_date must be before or equal to end_date';
  END IF;
  
  -- Ensure vacation is not too far in the future (more than 2 years)
  IF NEW.start_date > CURRENT_DATE + INTERVAL '2 years' THEN
    RAISE EXCEPTION 'Vacation cannot be scheduled more than 2 years in advance';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger to vacations
DROP TRIGGER IF EXISTS trigger_validate_vacation_dates ON public.vacations;
CREATE TRIGGER trigger_validate_vacation_dates
  BEFORE INSERT OR UPDATE ON public.vacations
  FOR EACH ROW EXECUTE FUNCTION validate_vacation_dates();

-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format using existing function
  IF NEW.email IS NOT NULL AND NOT validate_email_format_enhanced(NEW.email) THEN
    RAISE EXCEPTION 'Invalid email format: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply email validation trigger to profiles
DROP TRIGGER IF EXISTS trigger_validate_profile_email ON public.profiles;
CREATE TRIGGER trigger_validate_profile_email
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_email();

-- 3. Ensure referential integrity with proper foreign key constraints
-- Note: We're not adding actual FK constraints to auth.users as per Supabase best practices
-- Instead, we use application-level checks and cleanup functions

-- 4. Add unique constraints where business logic requires them
-- Ensure car number and number plate are unique
ALTER TABLE public.cars ADD CONSTRAINT IF NOT EXISTS unique_car_number UNIQUE (car_number);
ALTER TABLE public.cars ADD CONSTRAINT IF NOT EXISTS unique_number_plate UNIQUE (number_plate);

-- Ensure fuel card codes are unique
ALTER TABLE public.cars ADD CONSTRAINT IF NOT EXISTS unique_fuel_card_code UNIQUE (fuel_card_code);

-- Ensure only one role per user (if not already enforced)
ALTER TABLE public.user_roles ADD CONSTRAINT IF NOT EXISTS unique_user_role UNIQUE (user_id);

-- 5. Add constraints for data consistency
-- Ensure vacation same-day logic is consistent
CREATE OR REPLACE FUNCTION validate_vacation_same_day()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_same_day is true, start_date and end_date must be the same
  IF NEW.is_same_day = true AND NEW.start_date != NEW.end_date THEN
    RAISE EXCEPTION 'When is_same_day is true, start_date and end_date must be the same';
  END IF;
  
  -- If start_date equals end_date, is_same_day should be true
  IF NEW.start_date = NEW.end_date AND NEW.is_same_day != true THEN
    NEW.is_same_day := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply same-day validation trigger
DROP TRIGGER IF EXISTS trigger_validate_vacation_same_day ON public.vacations;
CREATE TRIGGER trigger_validate_vacation_same_day
  BEFORE INSERT OR UPDATE ON public.vacations
  FOR EACH ROW EXECUTE FUNCTION validate_vacation_same_day();

-- 6. Log the phase 2 completion
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'database_optimization_phase2',
  'Phase 2: Constraint optimization completed',
  jsonb_build_object(
    'phase', 2,
    'action', 'constraint_optimization',
    'constraints_added', jsonb_build_object(
      'not_null_constraints', 'added to critical fields',
      'unique_constraints', 'car_number, number_plate, fuel_card_code, user_role',
      'validation_triggers', 'assignment_times, vacation_dates, email_format, vacation_same_day'
    ),
    'tables_affected', ARRAY['assignments', 'profiles', 'user_roles', 'notifications', 'vacations', 'cars'],
    'timestamp', now()
  )
);