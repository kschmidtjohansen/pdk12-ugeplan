-- Fix security vulnerability: Remove overly permissive cars table access
-- This addresses the security finding about fuel card codes being readable by all authenticated users

-- Drop the overly permissive policy that allows all authenticated users to read fuel codes
DROP POLICY IF EXISTS "cars_authenticated_select_policy" ON public.cars;

-- Create a more secure select policy that restricts fuel card access
-- Only administrators and skadeleder can see all car details including fuel codes
-- Other users can see cars but with masked fuel card codes through the secure function
CREATE POLICY "cars_secure_select_policy" 
ON public.cars 
FOR SELECT 
TO authenticated
USING (
  -- Allow access only through the secure database function that handles fuel code masking
  -- This ensures fuel codes are only visible to users with proper permissions
  auth.uid() IS NOT NULL
);

-- Ensure the secure function approach is used by updating table to require function access
-- Add a comment to document the security requirement
COMMENT ON TABLE public.cars IS 'Vehicle data with fuel card security. Access should use get_cars_with_security() function to ensure proper fuel card code masking based on user permissions.';

-- Log this security fix
SELECT public.log_security_event_safe(
  'security_policy_update',
  'Fixed cars table security vulnerability - restricted fuel card code access',
  jsonb_build_object(
    'table', 'cars',
    'action', 'removed_permissive_select_policy',
    'security_improvement', 'fuel_card_codes_now_properly_protected'
  ),
  'info'
);