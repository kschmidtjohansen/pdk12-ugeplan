-- Add towing capacity and total weight fields to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS towing_capacity INTEGER,
ADD COLUMN IF NOT EXISTS total_weight INTEGER;

COMMENT ON COLUMN public.cars.towing_capacity IS 'Maximum towing capacity in kg (only for cars with trailer hitch)';
COMMENT ON COLUMN public.cars.total_weight IS 'Total weight in kg (only for cars with trailer hitch)';