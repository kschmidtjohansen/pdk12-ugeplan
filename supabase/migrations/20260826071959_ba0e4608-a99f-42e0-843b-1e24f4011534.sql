DROP POLICY IF EXISTS "Users can view department access" ON public.user_access;

CREATE POLICY "Users can view department access"
ON public.user_access
FOR SELECT
USING (
  user_id = (SELECT public.get_auth_uid())
  OR public.is_super_admin()
  OR department_id = ANY (public.get_user_department_ids())
  OR EXISTS (
    SELECT 1
    FROM public.department_settings ds
    WHERE ds.setting_key = 'shared_duty_departments'
      AND ds.department_id = ANY (public.get_user_department_ids())
      AND (ds.setting_value)::jsonb ? (user_access.department_id)::text
  )
);