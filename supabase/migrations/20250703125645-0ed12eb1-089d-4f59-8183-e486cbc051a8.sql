-- Phase 2: Constraint Optimization (Fixed)
-- Review and optimize constraints for data integrity and performance

-- 1. Add missing NOT NULL constraints where data integrity requires it
-- First check if columns already have data that would violate NOT NULL

-- For assignments table - set NOT NULL only if no existing NULL values
DO $$
BEGIN
  -- Check if we can safely add NOT NULL constraints
  IF NOT EXISTS (SELECT 1 FROM public.assignments WHERE assignment_date IS NULL OR from_time IS NULL OR to_time IS NULL OR location IS NULL OR title IS NULL) THEN
    ALTER TABLE public.assignments 
    ALTER COLUMN assignment_date SET NOT NULL,
    ALTER COLUMN from_time SET NOT NULL,
    ALTER COLUMN to_time SET NOT NULL,
    ALTER COLUMN location SET NOT NULL,
    ALTER COLUMN title SET NOT NULL;
  END IF;
END $$;

-- For profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE name IS NULL OR email IS NULL) THEN
    ALTER TABLE public.profiles 
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN email SET NOT NULL;
  END IF;
END $$;

-- For user_roles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id IS NULL OR role IS NULL) THEN
    ALTER TABLE public.user_roles 
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN role SET NOT NULL;
  END IF;
END $$;

-- For notifications table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id IS NULL OR title IS NULL OR message IS NULL OR type IS NULL) THEN
    ALTER TABLE public.notifications 
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN message SET NOT NULL,
    ALTER COLUMN type SET NOT NULL;
  END IF;
END $$;

-- For vacations table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.vacations WHERE user_id IS NULL OR start_date IS NULL OR end_date IS NULL) THEN
    ALTER TABLE public.vacations 
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN start_date SET NOT NULL,
    ALTER COLUMN end_date SET NOT NULL;
  END IF;
END $$;

-- For cars table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cars WHERE name IS NULL OR car_number IS NULL OR number_plate IS NULL OR fuel_card_code IS NULL) THEN
    ALTER TABLE public.cars 
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN car_number SET NOT NULL,
    ALTER COLUMN number_plate SET NOT NULL,
    ALTER COLUMN fuel_card_code SET NOT NULL;
  END IF;
END $$;

-- 2. Add data validation triggers
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

-- 3. Add unique constraints (safely check if they exist first)
DO $$
BEGIN
  -- Add unique constraint for car_number if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_car_number') THEN
    ALTER TABLE public.cars ADD CONSTRAINT unique_car_number UNIQUE (car_number);
  END IF;
  
  -- Add unique constraint for number_plate if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_number_plate') THEN
    ALTER TABLE public.cars ADD CONSTRAINT unique_number_plate UNIQUE (number_plate);
  END IF;
  
  -- Add unique constraint for fuel_card_code if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_fuel_card_code') THEN
    ALTER TABLE public.cars ADD CONSTRAINT unique_fuel_card_code UNIQUE (fuel_card_code);
  END IF;
  
  -- Add unique constraint for user_role if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_role') THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT unique_user_role UNIQUE (user_id);
  END IF;
END $$;

-- 4. Log the phase 2 completion
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'database_optimization_phase2_fixed',
  'Phase 2: Constraint optimization completed (with safety checks)',
  jsonb_build_object(
    'phase', 2,
    'action', 'constraint_optimization',
    'constraints_added', jsonb_build_object(
      'not_null_constraints', 'added to critical fields with safety checks',
      'unique_constraints', 'car_number, number_plate, fuel_card_code, user_role',
      'validation_triggers', 'assignment_times, vacation_dates'
    ),
    'tables_affected', ARRAY['assignments', 'profiles', 'user_roles', 'notifications', 'vacations', 'cars'],
    'timestamp', now()
  )
);