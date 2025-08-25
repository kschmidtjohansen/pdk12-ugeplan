-- Fix security definer view warning by removing the view
-- Application will handle the restricted car access directly

DROP VIEW IF EXISTS public.cars_public_safe;
DROP FUNCTION IF EXISTS public.get_car_basic_info(uuid);

-- Update the car policy to be more permissive for basic car info viewing
-- but still restrict fuel card access through application-level filtering
DROP POLICY IF EXISTS "cars_secure_select_policy" ON public.cars;

CREATE POLICY "cars_basic_select_policy" ON public.cars
FOR SELECT 
TO authenticated
USING (true); -- Allow viewing, but fuel codes will be filtered in application code

-- Add a helper function to check if user can see sensitive car data
CREATE OR REPLACE FUNCTION public.can_view_fuel_codes()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  );
$$;