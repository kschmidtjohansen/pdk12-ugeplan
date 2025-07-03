-- Phase 3: Add Employee Status System
-- Create employee status enum and add status field to profiles

-- Create employee status enum
CREATE TYPE public.employee_status AS ENUM (
  'active',
  'inactive', 
  'on_leave',
  'terminated'
);

-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status public.employee_status DEFAULT 'active'::employee_status;

-- Set default status for existing employees based on on_leave field
UPDATE public.profiles 
SET status = CASE 
  WHEN on_leave = true THEN 'on_leave'::employee_status
  ELSE 'active'::employee_status
END
WHERE status IS NULL;

-- Make status non-nullable now that all rows have values
ALTER TABLE public.profiles 
ALTER COLUMN status SET NOT NULL;

-- Add index for performance on status queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);

-- Add index for combined status and role queries (for employee filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_status_role ON public.profiles (status, id);

-- Log the status system creation
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'employee_status_system_phase3',
  'Phase 3: Created employee status system with enum and migrated existing data',
  jsonb_build_object(
    'phase', 3,
    'action', 'status_system_creation',
    'enum_values', ARRAY['active', 'inactive', 'on_leave', 'terminated'],
    'timestamp', now()
  )
);