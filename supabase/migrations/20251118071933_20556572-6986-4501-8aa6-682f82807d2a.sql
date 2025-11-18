-- Add has_forklift_license column to profiles table for "Truckbevis" certification
ALTER TABLE public.profiles 
ADD COLUMN has_forklift_license boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.has_forklift_license IS 'Indicates if employee has forklift license (Truckbevis)';