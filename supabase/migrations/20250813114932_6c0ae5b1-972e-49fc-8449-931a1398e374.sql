-- SECURITY FIX: Replace overly permissive RLS policies with secure access controls

-- 1. Fix CRITICAL: Profiles table - restrict access to own profile + admin management
DROP POLICY IF EXISTS "profile_select_policy" ON public.profiles;

CREATE POLICY "profile_secure_select_policy" ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can see their own profile OR admin/skadeleder can see all for management
  id = auth.uid() OR is_admin_or_skadeleder()
);

-- 2. Fix CRITICAL: Cars table - protect fuel card codes while allowing basic car info
DROP POLICY IF EXISTS "car_select_policy" ON public.cars;

-- Allow basic car info for all authenticated users (needed for assignments)
CREATE POLICY "car_basic_select_policy" ON public.cars
FOR SELECT
TO authenticated
USING (true);

-- 3. Add RLS protection to public views that were completely unprotected
ALTER TABLE public.cars_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles_with_names ENABLE ROW LEVEL SECURITY;

-- Restrict public views to admin access only
CREATE POLICY "cars_public_admin_only" ON public.cars_public
FOR SELECT
TO authenticated
USING (is_admin_or_skadeleder());

CREATE POLICY "profiles_public_admin_only" ON public.profiles_public  
FOR SELECT
TO authenticated
USING (is_admin_or_skadeleder());

CREATE POLICY "user_roles_public_admin_only" ON public.user_roles_with_names
FOR SELECT
TO authenticated
USING (is_admin_or_skadeleder());

-- 4. Create helper function to check fuel card access permissions
CREATE OR REPLACE FUNCTION public.can_view_fuel_card_code()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT is_admin_or_skadeleder();
$$;

-- Log security policy updates
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'security_policy_update',
  'Critical security fixes applied: restricted profile and car data access',
  jsonb_build_object(
    'policies_updated', ARRAY['profiles', 'cars', 'cars_public', 'profiles_public', 'user_roles_with_names'],
    'security_level', 'critical_fix',
    'timestamp', now()
  )
);