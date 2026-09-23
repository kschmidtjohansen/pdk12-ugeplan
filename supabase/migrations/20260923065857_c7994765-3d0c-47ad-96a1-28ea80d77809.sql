
-- Cars: restrict SELECT to the user's own departments
DROP POLICY IF EXISTS "cars_select" ON public.cars;
CREATE POLICY "cars_select" ON public.cars
FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR public.is_current_user_admin()
  OR department_id IS NULL
  OR department_id = ANY (public.get_user_department_ids())
);

-- Car sub-department mappings: follow the car's department
DROP POLICY IF EXISTS "Authenticated users can view car_sub_departments" ON public.car_sub_departments;
CREATE POLICY "Authenticated users can view car_sub_departments" ON public.car_sub_departments
FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR public.is_current_user_admin()
  OR EXISTS (
    SELECT 1 FROM public.cars c
    WHERE c.id = car_sub_departments.car_id
      AND (c.department_id IS NULL OR c.department_id = ANY (public.get_user_department_ids()))
  )
);

-- User roles: own role, colleagues in the same departments, or admins
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.is_super_admin()
  OR public.is_current_user_admin()
  OR EXISTS (
    SELECT 1 FROM public.user_access ua
    WHERE ua.user_id = user_roles.user_id
      AND ua.department_id = ANY (public.get_user_department_ids())
  )
);
