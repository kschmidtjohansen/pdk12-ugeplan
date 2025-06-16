
-- Add new columns to vacations table to support partial day requests
ALTER TABLE public.vacations 
ADD COLUMN request_type text DEFAULT 'full_day' CHECK (request_type IN ('full_day', 'partial_day')),
ADD COLUMN start_time time,
ADD COLUMN end_time time,
ADD COLUMN is_same_day boolean DEFAULT true;

-- Add a check constraint to ensure partial day requests have valid times
ALTER TABLE public.vacations 
ADD CONSTRAINT check_partial_day_times 
CHECK (
  (request_type = 'full_day' AND start_time IS NULL AND end_time IS NULL) OR
  (request_type = 'partial_day' AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
);

-- Update existing records to have the default request_type
UPDATE public.vacations SET request_type = 'full_day' WHERE request_type IS NULL;
