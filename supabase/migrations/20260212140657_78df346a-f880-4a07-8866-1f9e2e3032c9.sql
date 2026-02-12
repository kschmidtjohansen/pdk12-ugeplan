
-- KRITISK 2: Fix on_call_duties UPDATE policy WITH CHECK (true) -> WITH CHECK (employee_id = auth.uid())
DROP POLICY IF EXISTS "Users can reassign their own duties" ON public.on_call_duties;
CREATE POLICY "Users can reassign their own duties"
  ON public.on_call_duties
  FOR UPDATE
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- VIGTIG 1a: Restrict assignment_messages SELECT to assigned/responsible/admin users
DROP POLICY IF EXISTS "Users can read assignment messages" ON public.assignment_messages;
CREATE POLICY "Users can read assignment messages"
  ON public.assignment_messages
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin_or_skadeleder() OR
      EXISTS (SELECT 1 FROM assignments_employees ae WHERE ae.assignment_id = assignment_messages.assignment_id AND ae.user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_messages.assignment_id AND a.responsible_user_id = auth.uid())
    )
  );

-- VIGTIG 1b: Restrict assignment_files SELECT to assigned/responsible/admin users
DROP POLICY IF EXISTS "Users can read assignment files" ON public.assignment_files;
CREATE POLICY "Users can read assignment files"
  ON public.assignment_files
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin_or_skadeleder() OR
      EXISTS (SELECT 1 FROM assignments_employees ae WHERE ae.assignment_id = assignment_files.assignment_id AND ae.user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_files.assignment_id AND a.responsible_user_id = auth.uid())
    )
  );

-- ADVARSEL 2: Require auth for on_call_duties SELECT
DROP POLICY IF EXISTS "Anyone can view on call duties" ON public.on_call_duties;
CREATE POLICY "Anyone can view on call duties"
  ON public.on_call_duties
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ADVARSEL 3a: Require auth for departments SELECT
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
CREATE POLICY "Anyone can view departments"
  ON public.departments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ADVARSEL 3a continued: Also fix "Authenticated users can view departments"
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;
CREATE POLICY "Authenticated users can view departments"
  ON public.departments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ADVARSEL 3b: Require auth for sub_departments SELECT
DROP POLICY IF EXISTS "Authenticated users can view sub_departments" ON public.sub_departments;
CREATE POLICY "Authenticated users can view sub_departments"
  ON public.sub_departments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
