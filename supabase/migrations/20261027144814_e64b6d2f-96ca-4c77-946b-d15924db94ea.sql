CREATE POLICY "View car links for own sub-departments" ON public.car_sub_departments
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.sub_departments sd
  WHERE sd.id = car_sub_departments.sub_department_id
    AND sd.department_id = ANY (public.get_user_department_ids())));