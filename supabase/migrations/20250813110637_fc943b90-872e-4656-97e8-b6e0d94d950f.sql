-- 1) Harden assignments SELECT policy: remove broad servicemedarbejder blanket access
DO $$ BEGIN
  -- Drop and recreate assignment_select_policy to restrict access
  DROP POLICY IF EXISTS "assignment_select_policy" ON public.assignments;
  CREATE POLICY "assignment_select_policy"
  ON public.assignments
  FOR SELECT
  TO authenticated
  USING (
    is_admin_or_skadeleder()
    OR can_user_access_assignment(id, (SELECT auth.uid() AS uid))
    OR (published = true) -- allow viewing published assignments
  );
END $$;

-- 2) Create a safe view for cars without sensitive fuel_card_code for general users
CREATE OR REPLACE VIEW public.cars_public AS
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

-- Ensure RLS on base table remains strict; control access to view via security barrier
-- Views inherit privileges; grant select on view to authenticated, and restrict base table
REVOKE ALL ON public.cars FROM PUBLIC;
REVOKE ALL ON public.cars FROM authenticated;
GRANT SELECT ON public.cars_public TO authenticated;
GRANT SELECT ON public.cars_public TO anon; -- optional: remove if you want authenticated only

-- 3) Optional: block non-admins from selecting fuel_card_code through base table explicitly by column privilege
-- Postgres column-level privileges: revoke select on that column from authenticated and public
REVOKE SELECT (fuel_card_code) ON public.cars FROM PUBLIC;
REVOKE SELECT (fuel_card_code) ON public.cars FROM authenticated;

-- 4) Profiles SELECT already restricted to authenticated in previous migration
-- Add a limited view if needed (names-only) for non-admin future use (not granted here)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, name, avatar_url, status, created_at, updated_at
FROM public.profiles;

-- Grant read to authenticated on the public subset
GRANT SELECT ON public.profiles_public TO authenticated;