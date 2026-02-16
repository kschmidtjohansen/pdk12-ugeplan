-- Fix: Allow super_admin to update profiles (same as administrator)
DROP POLICY IF EXISTS "secure_profile_updates" ON public.profiles;

CREATE POLICY "secure_profile_updates" ON public.profiles
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL)
  AND (
    (id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('administrator'::user_role, 'super_admin'::user_role)
        AND ur.created_at IS NOT NULL
    ))
  )
)
WITH CHECK (
  (auth.uid() IS NOT NULL)
  AND (
    (id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('administrator'::user_role, 'super_admin'::user_role)
    ))
  )
);