-- Add show_in_planner column to cars table
ALTER TABLE public.cars 
ADD COLUMN show_in_planner boolean NOT NULL DEFAULT true;

-- Create index for better performance when filtering
CREATE INDEX idx_cars_show_in_planner ON public.cars(show_in_planner) WHERE show_in_planner = true;

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.cars.show_in_planner IS 'Controls whether this car appears in the planner interface for assignment selection';