-- SECURITY FIX: Restrict fuel card code access with simple role-based policy
-- Remove the overly permissive policy and add proper restrictions

DROP POLICY IF EXISTS "car_select_policy" ON public.cars;
DROP POLICY IF EXISTS "cars_restricted_select_policy" ON public.cars;

-- Create a simple but secure policy: only admins and skadeleders can see cars with fuel codes
CREATE POLICY "cars_secure_select_policy" ON public.cars
FOR SELECT 
TO authenticated
USING (
  -- Only administrators and skadeleders can access car data including fuel codes
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Create a view for public car information (without fuel card codes)
-- This will be used by the application for regular users
DROP VIEW IF EXISTS public.cars_public_safe;
CREATE VIEW public.cars_public_safe AS
SELECT 
  id,
  name,
  car_number,
  number_plate,
  has_trailer_hitch,
  is_available,
  notes,
  created_at,
  updated_at
FROM public.cars
WHERE true; -- This view excludes fuel_card_code column entirely

-- Grant access to the safe view for all authenticated users
GRANT SELECT ON public.cars_public_safe TO authenticated;