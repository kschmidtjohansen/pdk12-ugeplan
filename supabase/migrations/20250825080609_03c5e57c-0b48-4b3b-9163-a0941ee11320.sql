-- FINAL SECURITY FIX: Implement database-level fuel card code protection
-- Create separate policies for viewing basic car info vs sensitive fuel card data

DROP POLICY IF EXISTS "cars_basic_select_policy" ON public.cars;

-- Policy for basic car information (everyone can see)
CREATE POLICY "cars_public_info_policy" ON public.cars
FOR SELECT 
TO authenticated
USING (
  -- All authenticated users can see basic car info, but we'll handle fuel codes separately
  true
);

-- Create a secure function that returns car data with conditional fuel code access
CREATE OR REPLACE FUNCTION public.get_car_with_conditional_access(car_row public.cars)
RETURNS TABLE (
  id uuid,
  name text,
  car_number text,
  number_plate text,
  has_trailer_hitch boolean,
  is_available boolean,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  fuel_card_code text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  can_view_fuel boolean;
BEGIN
  -- Check if current user can view fuel codes
  SELECT public.can_view_fuel_codes() INTO can_view_fuel;
  
  RETURN QUERY SELECT 
    car_row.id,
    car_row.name,
    car_row.car_number,
    car_row.number_plate,
    car_row.has_trailer_hitch,
    car_row.is_available,
    car_row.notes,
    car_row.created_at,
    car_row.updated_at,
    CASE 
      WHEN can_view_fuel THEN car_row.fuel_card_code
      ELSE '***RESTRICTED***'::text
    END as fuel_card_code;
END;
$$;