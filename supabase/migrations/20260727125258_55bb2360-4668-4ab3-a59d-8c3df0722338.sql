
CREATE TABLE public.car_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL DEFAULT 'Værkstedsbesøg',
  notes text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  released_at timestamptz,
  released_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT car_unavailability_date_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_car_unavailability_car ON public.car_unavailability(car_id);
CREATE INDEX idx_car_unavailability_active ON public.car_unavailability(car_id, start_date, end_date) WHERE released_at IS NULL;
CREATE INDEX idx_car_unavailability_dept ON public.car_unavailability(department_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.car_unavailability TO authenticated;
GRANT ALL ON public.car_unavailability TO service_role;

ALTER TABLE public.car_unavailability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cu_select_dept"
ON public.car_unavailability
FOR SELECT
TO authenticated
USING (
  department_id IS NULL
  OR department_id = ANY (public.get_user_department_ids(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "cu_insert_admin"
ON public.car_unavailability
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    (department_id IS NULL OR department_id = ANY (public.get_user_department_ids(auth.uid())))
    AND public.is_admin_or_skadeleder()
  )
);

CREATE POLICY "cu_update_admin"
ON public.car_unavailability
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (
    (department_id IS NULL OR department_id = ANY (public.get_user_department_ids(auth.uid())))
    AND public.is_admin_or_skadeleder()
  )
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    (department_id IS NULL OR department_id = ANY (public.get_user_department_ids(auth.uid())))
    AND public.is_admin_or_skadeleder()
  )
);

CREATE POLICY "cu_delete_admin"
ON public.car_unavailability
FOR DELETE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (
    (department_id IS NULL OR department_id = ANY (public.get_user_department_ids(auth.uid())))
    AND public.is_current_user_admin()
  )
);

CREATE TRIGGER trg_car_unavailability_updated_at
BEFORE UPDATE ON public.car_unavailability
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.car_unavailability;
