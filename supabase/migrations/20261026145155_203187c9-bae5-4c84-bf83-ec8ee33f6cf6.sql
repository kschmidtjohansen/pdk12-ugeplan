CREATE TABLE public.user_permissions (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted boolean NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, permission),
  CONSTRAINT user_permissions_permission_chk CHECK (permission IN ('plan_assignments','publish_assignments','view_unpublished','view_all_vacations','approve_vacations','view_fuel_codes'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read user permissions" ON public.user_permissions
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "Super admins insert user permissions" ON public.user_permissions
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY "Super admins update user permissions" ON public.user_permissions
  FOR UPDATE TO authenticated USING (public.is_super_admin((SELECT auth.uid()))) WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY "Super admins delete user permissions" ON public.user_permissions
  FOR DELETE TO authenticated USING (public.is_super_admin((SELECT auth.uid())));

-- Role grants OR an explicit personal grant
CREATE OR REPLACE FUNCTION public.has_role_permission(_permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = auth.uid() AND rp.permission = _permission
  ) OR EXISTS (
    SELECT 1 FROM public.user_permissions up
    WHERE up.user_id = auth.uid() AND up.permission = _permission AND up.granted
  );
$$;
REVOKE ALL ON FUNCTION public.has_role_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role_permission(text) TO authenticated, service_role;