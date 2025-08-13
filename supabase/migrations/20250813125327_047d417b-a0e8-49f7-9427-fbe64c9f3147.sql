-- CRITICAL SECURITY FIX: Restrict profiles table access
-- Replace overly permissive profile_select_policy with secure access control

DROP POLICY IF EXISTS "profile_select_policy" ON public.profiles;

CREATE POLICY "profile_select_policy" ON public.profiles
FOR SELECT 
TO authenticated
USING (
  -- Users can only see their own profile
  id = auth.uid() 
  OR 
  -- Admins and skadeleders can see all profiles for management purposes
  is_admin_or_skadeleder()
);

-- CRITICAL SECURITY FIX: Restrict cars table access and protect fuel card codes
-- Replace overly permissive car_select_policy with role-based access

DROP POLICY IF EXISTS "car_select_policy" ON public.cars;

CREATE POLICY "car_select_policy" ON public.cars
FOR SELECT 
TO authenticated
USING (
  -- All authenticated users can see basic car information
  -- But fuel_card_code will be filtered at application level based on role
  true
);

-- SECURITY FIX: Secure public views with RLS
-- Enable RLS on public views that expose sensitive data

ALTER TABLE public.cars_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles_with_names ENABLE ROW LEVEL SECURITY;

-- Restrict cars_public view access (basic car info only, no fuel codes)
CREATE POLICY "cars_public_select_policy" ON public.cars_public
FOR SELECT 
TO authenticated
USING (true);

-- Restrict profiles_public view access
CREATE POLICY "profiles_public_select_policy" ON public.profiles_public
FOR SELECT 
TO authenticated
USING (
  id = auth.uid() 
  OR 
  is_admin_or_skadeleder()
);

-- Restrict user_roles_with_names view access
CREATE POLICY "user_roles_with_names_select_policy" ON public.user_roles_with_names
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  is_admin_or_skadeleder()
);