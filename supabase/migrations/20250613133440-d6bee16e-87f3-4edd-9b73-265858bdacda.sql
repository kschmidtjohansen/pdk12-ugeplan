
-- Update the INSERT policy for vacations table to allow admins to create vacation requests for other employees
DROP POLICY IF EXISTS "Users can create their own vacations" ON public.vacations;

CREATE POLICY "Users can create vacations"
ON public.vacations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can only create vacation requests for themselves
  (user_id = auth.uid()) 
  OR 
  -- Administrators and skadeledere can create vacation requests for any employee
  (public.is_admin_or_skadeleder())
);
