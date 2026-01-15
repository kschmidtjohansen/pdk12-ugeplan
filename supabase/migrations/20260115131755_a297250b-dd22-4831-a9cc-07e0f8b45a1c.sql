-- Add route distance and duration columns to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS route_distance_km NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS route_duration_min INTEGER;