
-- First, let's fix existing phone data that doesn't match our validation pattern
-- Update any phone numbers that are too short or have invalid characters
UPDATE public.profiles 
SET phone = NULL 
WHERE phone IS NOT NULL 
  AND NOT (phone ~ '^\+?[0-9\s\-\(\)]{8,}$');

-- Now let's apply the constraints one by one, starting with the non-problematic ones

-- Phase 1: Add Missing Foreign Key Constraints (these should work)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assignments_car_id_fkey' 
        AND table_name = 'assignments'
    ) THEN
        ALTER TABLE public.assignments 
        ADD CONSTRAINT assignments_car_id_fkey 
        FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assignments_responsible_user_id_fkey' 
        AND table_name = 'assignments'
    ) THEN
        ALTER TABLE public.assignments 
        ADD CONSTRAINT assignments_responsible_user_id_fkey 
        FOREIGN KEY (responsible_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assignments_employees_assignment_id_fkey' 
        AND table_name = 'assignments_employees'
    ) THEN
        ALTER TABLE public.assignments_employees 
        ADD CONSTRAINT assignments_employees_assignment_id_fkey 
        FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assignments_employees_user_id_fkey' 
        AND table_name = 'assignments_employees'
    ) THEN
        ALTER TABLE public.assignments_employees 
        ADD CONSTRAINT assignments_employees_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Phase 2: Add Performance Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_date_time 
ON public.assignments (assignment_date, from_time);

CREATE INDEX IF NOT EXISTS idx_assignments_published_date 
ON public.assignments (published, assignment_date) WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_assignments_car_date 
ON public.assignments (car_id, assignment_date) WHERE car_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assignments_responsible_date 
ON public.assignments (responsible_user_id, assignment_date) WHERE responsible_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assignments_employees_composite_lookup 
ON public.assignments_employees (user_id, assignment_id);

CREATE INDEX IF NOT EXISTS idx_profiles_email_unique 
ON public.profiles (email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_name_search 
ON public.profiles USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_profiles_leave_status 
ON public.profiles (on_leave) WHERE on_leave = true;

CREATE INDEX IF NOT EXISTS idx_vacations_date_range 
ON public.vacations (start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_vacations_user_status_date 
ON public.vacations (user_id, status, start_date);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, read, created_at) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_cars_availability 
ON public.cars (is_available) WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_logs_event_type_date 
ON public.logs (event_type, created_at);

-- Phase 3: Add Data Validation Constraints (now that we've cleaned the data)
-- Email format validation
ALTER TABLE public.profiles 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Phone format validation (now that we've cleaned invalid data)
ALTER TABLE public.profiles 
ADD CONSTRAINT check_phone_format 
CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]{8,}$');

-- Other validation constraints
ALTER TABLE public.vacations 
ADD CONSTRAINT check_vacation_dates 
CHECK (end_date >= start_date);

ALTER TABLE public.assignments 
ADD CONSTRAINT check_assignment_times 
CHECK (to_time > from_time);

ALTER TABLE public.cars 
ADD CONSTRAINT check_car_number_format 
CHECK (car_number ~ '^[A-Z0-9\-]{2,10}$');
