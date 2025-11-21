-- Add new towing capacity columns
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS towing_capacity_with_brakes INTEGER,
ADD COLUMN IF NOT EXISTS towing_capacity_without_brakes INTEGER;

-- Backup existing towing_capacity data to towing_capacity_with_brakes
UPDATE public.cars 
SET towing_capacity_with_brakes = towing_capacity
WHERE towing_capacity IS NOT NULL;

-- Drop old single towing_capacity column
ALTER TABLE public.cars DROP COLUMN IF EXISTS towing_capacity;

-- Add comments for clarity
COMMENT ON COLUMN public.cars.towing_capacity_with_brakes IS 'Trækvægt med bremser i kg';
COMMENT ON COLUMN public.cars.towing_capacity_without_brakes IS 'Trækvægt uden bremser i kg';
COMMENT ON COLUMN public.cars.total_weight IS 'Totalvægt i kg';