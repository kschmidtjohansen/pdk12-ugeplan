-- Drop global unique constraints on cars table
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS unique_car_number;
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS unique_number_plate;
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS unique_fuel_card_code;

-- Create composite unique constraints per department
ALTER TABLE public.cars ADD CONSTRAINT unique_car_number_per_dept 
  UNIQUE (car_number, department_id);
ALTER TABLE public.cars ADD CONSTRAINT unique_number_plate_per_dept 
  UNIQUE (number_plate, department_id);
ALTER TABLE public.cars ADD CONSTRAINT unique_fuel_card_code_per_dept 
  UNIQUE (fuel_card_code, department_id);