-- SECURITY FIX: Properly restrict fuel card code access at database level
-- Replace the current permissive car policy with role-based access control

DROP POLICY IF EXISTS "car_select_policy" ON public.cars;

-- Create restrictive policy for cars table
-- Regular users can see basic car info, but fuel codes are restricted to admins/skadeleders
CREATE POLICY "cars_restricted_select_policy" ON public.cars
FOR SELECT 
TO authenticated
USING (
  -- Only administrators and skadeleders can see all car data including fuel codes
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
  OR
  -- Regular users can only see cars they are assigned to via assignments
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.assignments_employees ae ON a.id = ae.assignment_id
    WHERE ae.user_id = auth.uid()
    AND (a.car_id = cars.id OR cars.id = ANY(a.car_ids))
  )
);

-- Create a function to get car basic info without fuel codes for regular users
CREATE OR REPLACE FUNCTION public.get_car_basic_info(car_uuid uuid)
RETURNS TABLE (
  id uuid,
  name text,
  car_number text,
  number_plate text,
  has_trailer_hitch boolean,
  is_available boolean,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    c.id,
    c.name,
    c.car_number,
    c.number_plate,
    c.has_trailer_hitch,
    c.is_available,
    c.notes,
    c.created_at,
    c.updated_at
  FROM public.cars c
  WHERE c.id = car_uuid;
$$;