-- Fix security vulnerability: Restrict direct access to cars table
-- Currently any authenticated user can SELECT from cars table and see fuel card codes

-- Step 1: Remove the overly permissive policy
DROP POLICY IF EXISTS "cars_secure_select_policy" ON public.cars;

-- Step 2: Create a restrictive policy - only admin/skadeleder can directly access cars table
CREATE POLICY "cars_restricted_select_policy" 
ON public.cars 
FOR SELECT 
TO authenticated
USING (public.can_view_fuel_codes());

-- Step 3: Create a secure view for general car access (no RLS needed on views)
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

-- Step 4: Grant access to the secure view
GRANT SELECT ON public.cars_secure_view TO authenticated;

-- Step 5: Log the security fix
SELECT public.log_security_event_safe(
  'security_vulnerability_fixed',
  'Fixed cars table security vulnerability by restricting direct table access and creating secure view',
  jsonb_build_object(
    'vulnerability', 'unauthorized_fuel_card_access',
    'fix_applied', 'restrictive_rls_policy_and_secure_view',
    'affected_table', 'cars'
  ),
  'info'
);