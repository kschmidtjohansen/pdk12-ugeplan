DROP POLICY IF EXISTS secure_profile_access_unified ON public.profiles;

CREATE POLICY secure_profile_access_unified
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('administrator', 'skadeleder', 'super_admin')
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_access me
    JOIN public.user_access them
      ON them.department_id = me.department_id
    WHERE me.user_id = auth.uid()
      AND them.user_id = profiles.id
  )
);