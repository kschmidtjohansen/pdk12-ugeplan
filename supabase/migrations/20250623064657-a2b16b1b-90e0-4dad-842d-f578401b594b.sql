
-- First, clean up orphaned records that would violate the foreign key constraints

-- Remove assignments_employees records where user_id doesn't exist in profiles
DELETE FROM public.assignments_employees 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Remove assignments_employees records where assignment_id doesn't exist in assignments
DELETE FROM public.assignments_employees 
WHERE assignment_id NOT IN (SELECT id FROM public.assignments);

-- Set responsible_user_id to NULL in assignments where the user doesn't exist in profiles
UPDATE public.assignments 
SET responsible_user_id = NULL 
WHERE responsible_user_id IS NOT NULL 
AND responsible_user_id NOT IN (SELECT id FROM public.profiles);

-- Set car_id to NULL in assignments where the car doesn't exist in cars
UPDATE public.assignments 
SET car_id = NULL 
WHERE car_id IS NOT NULL 
AND car_id NOT IN (SELECT id FROM public.cars);

-- Now add the foreign key constraints
-- Add foreign key from assignments_employees.user_id to profiles.id
ALTER TABLE public.assignments_employees 
ADD CONSTRAINT fk_assignments_employees_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from assignments_employees.assignment_id to assignments.id  
ALTER TABLE public.assignments_employees 
ADD CONSTRAINT fk_assignments_employees_assignment_id 
FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;

-- Add foreign key from assignments.responsible_user_id to profiles.id
ALTER TABLE public.assignments 
ADD CONSTRAINT fk_assignments_responsible_user_id 
FOREIGN KEY (responsible_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign key from assignments.car_id to cars.id (legacy single car support)
ALTER TABLE public.assignments 
ADD CONSTRAINT fk_assignments_car_id 
FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE SET NULL;
