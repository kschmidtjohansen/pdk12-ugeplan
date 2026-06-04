
DO $$
DECLARE
  r RECORD;
  tables TEXT[] := ARRAY[
    'assignments','assignments_employees','cars','notifications',
    'on_call_duties','profiles','vacations','warehouse_items'
  ];
  policy_names TEXT[] := ARRAY[
    'hide_demo_data_assignments','hide_demo_data_assignments_employees',
    'hide_demo_data_cars','hide_demo_data_notifications',
    'hide_demo_data_duties','hide_demo_data_profiles',
    'hide_demo_data_vacations','hide_demo_data_warehouse'
  ];
BEGIN
  FOR i IN 1..array_length(tables,1) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_names[i], tables[i]);
  END LOOP;
END $$;

CREATE POLICY "hide_demo_data_assignments" ON public.assignments
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR (SELECT auth.uid()) = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid);

CREATE POLICY "hide_demo_data_assignments_employees" ON public.assignments_employees
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR (SELECT auth.uid()) = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid);

CREATE POLICY "hide_demo_data_cars" ON public.cars
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR (SELECT auth.uid()) = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid);

CREATE POLICY "hide_demo_data_notifications" ON public.notifications
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR (SELECT auth.uid()) = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid);

CREATE POLICY "hide_demo_data_duties" ON public.on_call_duties
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR (SELECT auth.uid()) = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid);

CREATE POLICY "hide_demo_data_profiles" ON public.profiles
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR (SELECT auth.uid()) = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid);

CREATE POLICY "hide_demo_data_vacations" ON public.vacations
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR (SELECT auth.uid()) = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid);

CREATE POLICY "hide_demo_data_warehouse" ON public.warehouse_items
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR (SELECT auth.uid()) = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid);
