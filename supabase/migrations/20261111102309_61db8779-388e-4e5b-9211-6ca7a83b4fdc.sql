DROP POLICY IF EXISTS "Authenticated can read user permissions" ON public.user_permissions;
CREATE POLICY "Users read own or super admins read all permissions" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_super_admin((SELECT auth.uid())));