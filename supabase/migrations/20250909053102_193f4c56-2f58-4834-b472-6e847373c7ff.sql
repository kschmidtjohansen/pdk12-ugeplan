-- Fix security vulnerability: Restrict direct access to cars table
-- Currently any authenticated user can SELECT from cars table and see fuel card codes
-- This bypasses the application-level security that tries to hide fuel codes

-- Step 1: Update the cars table RLS policy to be more restrictive
-- Remove the overly permissive policy
DROP POLICY IF EXISTS "cars_secure_select_policy" ON public.cars;

-- Create a new restrictive policy - only admin/skadeleder can access raw table
CREATE POLICY "cars_admin_select_policy" 
ON public.cars 
FOR SELECT 
TO authenticated
USING (public.can_view_fuel_codes());

-- Step 2: Create a secure view for general car access
-- This view will show car information but restrict fuel codes based on permissions
CREATE OR REPLACE VIEW public.cars_secure_view AS
SELECT 
  id,
  name,
  car_number,
  number_plate,
  has_trailer_hitch,
  is_available,
  notes,
  created_at,
  updated_at,
  CASE 
    WHEN public.can_view_fuel_codes() THEN fuel_card_code
    ELSE '***RESTRICTED***'::text
  END as fuel_card_code
FROM public.cars
ORDER BY name;

-- Step 3: Grant access to the secure view for authenticated users
GRANT SELECT ON public.cars_secure_view TO authenticated;

-- Step 4: Enable RLS on the view (though views inherit RLS behavior)
-- Create RLS policy for the secure view
CREATE POLICY "cars_secure_view_policy" 
ON public.cars_secure_view 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Step 5: Log this security fix
SELECT public.log_security_event_safe(
  'security_vulnerability_fixed',
  'Fixed cars table security vulnerability: restricted direct access to fuel card codes',
  jsonb_build_object(
    'vulnerability', 'unauthorized_fuel_card_access',
    'fix_applied', 'restrictive_rls_policy_and_secure_view',
    'affected_table', 'cars',
    'security_level', 'enhanced'
  ),
  'info'
);