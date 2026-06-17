
-- Trainings table for course/kursus registrations
CREATE TABLE public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  department_id uuid,
  sub_department_id uuid,
  start_date date NOT NULL,
  end_date date NOT NULL,
  title text,
  notes text,
  is_demo boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainings TO authenticated;
GRANT ALL ON public.trainings TO service_role;

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

-- SELECT: own rows or admin/skadeleder
CREATE POLICY "trainings_select_policy"
ON public.trainings FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin_or_skadeleder()
);

-- INSERT: admin/skadeleder only (course is registered by management)
CREATE POLICY "trainings_insert_policy"
ON public.trainings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_skadeleder());

-- UPDATE: admin/skadeleder only
CREATE POLICY "trainings_update_policy"
ON public.trainings FOR UPDATE
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- DELETE: admin/skadeleder only
CREATE POLICY "trainings_delete_policy"
ON public.trainings FOR DELETE
TO authenticated
USING (public.is_admin_or_skadeleder());

-- Hide demo data from non-demo sessions
CREATE POLICY "hide_demo_data_trainings"
ON public.trainings FOR SELECT
TO authenticated
USING (
  is_demo = false
  OR (auth.jwt() ->> 'email') = 'test@polygongroup.com'
);

-- updated_at trigger
CREATE TRIGGER update_trainings_updated_at
BEFORE UPDATE ON public.trainings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trainings;

CREATE INDEX idx_trainings_user_dates ON public.trainings (user_id, start_date, end_date);
CREATE INDEX idx_trainings_dept_dates ON public.trainings (department_id, start_date, end_date);
