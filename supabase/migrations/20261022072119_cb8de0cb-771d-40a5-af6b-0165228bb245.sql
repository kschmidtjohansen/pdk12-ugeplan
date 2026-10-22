CREATE TABLE public.role_permissions (
  role public.user_role NOT NULL,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  PRIMARY KEY (role, permission),
  CONSTRAINT role_permissions_permission_chk CHECK (permission IN ('plan_assignments','publish_assignments','view_all_vacations','approve_vacations'))
);
GRANT SELECT, INSERT, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read role permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "Super admins can grant role permissions" ON public.role_permissions
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin((SELECT auth.uid())) AND role <> 'super_admin');
CREATE POLICY "Super admins can revoke role permissions" ON public.role_permissions
  FOR DELETE TO authenticated USING (public.is_super_admin((SELECT auth.uid())));

CREATE OR REPLACE FUNCTION public.has_role_permission(_permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = auth.uid() AND rp.permission = _permission
  );
$$;
REVOKE ALL ON FUNCTION public.has_role_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role_permission(text) TO authenticated, service_role;

-- Planning grant: tasks in departments the user can access
CREATE POLICY "Granted planners can view assignments" ON public.assignments
  FOR SELECT TO authenticated
  USING (public.has_role_permission('plan_assignments') AND public.can_access_department_data(department_id));
CREATE POLICY "Granted planners can insert assignments" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role_permission('plan_assignments') AND public.can_access_department_data(department_id));
CREATE POLICY "Granted planners can update assignments" ON public.assignments
  FOR UPDATE TO authenticated
  USING (public.has_role_permission('plan_assignments') AND public.can_access_department_data(department_id))
  WITH CHECK (public.has_role_permission('plan_assignments') AND public.can_access_department_data(department_id));
CREATE POLICY "Granted planners can delete assignments" ON public.assignments
  FOR DELETE TO authenticated
  USING (public.has_role_permission('plan_assignments') AND public.can_access_department_data(department_id));

CREATE POLICY "Granted planners can view assignment crews" ON public.assignments_employees
  FOR SELECT TO authenticated
  USING (public.has_role_permission('plan_assignments') AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.can_access_department_data(a.department_id)));
CREATE POLICY "Granted planners can insert assignment crews" ON public.assignments_employees
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role_permission('plan_assignments') AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.can_access_department_data(a.department_id)));
CREATE POLICY "Granted planners can update assignment crews" ON public.assignments_employees
  FOR UPDATE TO authenticated
  USING (public.has_role_permission('plan_assignments') AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.can_access_department_data(a.department_id)))
  WITH CHECK (public.has_role_permission('plan_assignments') AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.can_access_department_data(a.department_id)));
CREATE POLICY "Granted planners can delete assignment crews" ON public.assignments_employees
  FOR DELETE TO authenticated
  USING (public.has_role_permission('plan_assignments') AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.can_access_department_data(a.department_id)));

-- Vacation grants
CREATE POLICY "Granted roles can view department vacations" ON public.vacations
  FOR SELECT TO authenticated
  USING ((public.has_role_permission('view_all_vacations') OR public.has_role_permission('approve_vacations')) AND public.can_access_department_data(department_id));
CREATE POLICY "Granted roles can review department vacations" ON public.vacations
  FOR UPDATE TO authenticated
  USING (public.has_role_permission('approve_vacations') AND public.can_access_department_data(department_id))
  WITH CHECK (public.has_role_permission('approve_vacations') AND public.can_access_department_data(department_id));