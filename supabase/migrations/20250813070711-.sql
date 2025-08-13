-- Harden SELECT policies to authenticated users only for profiles and cars

-- Profiles: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "profile_select_policy" ON public.profiles;
CREATE POLICY "profile_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Cars: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "car_select_policy" ON public.cars;
CREATE POLICY "car_select_policy"
ON public.cars
FOR SELECT
TO authenticated
USING (true);
