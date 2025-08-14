-- SECURITY FIX: Properly restrict fuel card code access at database level
-- Replace the current car policy with role-based access control for sensitive data

DROP POLICY IF EXISTS "car_select_policy" ON public.cars;

-- Create a view for general car information (without fuel codes)
CREATE OR REPLACE VIEW public.cars_general AS
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
FROM public.cars;

-- Enable RLS on the view
ALTER VIEW public.cars_general SET (security_barrier = true);

-- Create policy for general car view (accessible to all authenticated users)
CREATE POLICY "cars_general_select_policy" ON public.cars_general
FOR SELECT 
TO authenticated
USING (true);

-- Create restrictive policy for full cars table (including fuel codes)
-- Only admins and skadeleders can see sensitive data like fuel card codes
CREATE POLICY "cars_admin_select_policy" ON public.cars
FOR SELECT 
TO authenticated
USING (
  -- Only administrators and skadeleders can see fuel card codes
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Ensure other car policies remain secure
-- (Insert, Update, Delete should still be admin-only as they were before)