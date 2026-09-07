CREATE TABLE IF NOT EXISTS public.sick_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id),
  sick_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sick_date)
);

GRANT SELECT, INSERT, DELETE ON public.sick_days TO authenticated;
GRANT ALL ON public.sick_days TO service_role;

ALTER TABLE public.sick_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and skadeleder can view sick days in their departments"
ON public.sick_days FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.is_admin_or_skadeleder()
    AND (department_id IS NULL OR department_id = ANY (public.get_user_department_ids()))
  )
);

CREATE POLICY "Admins can create sick days in their departments"
ON public.sick_days FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin()
  OR (
    public.is_admin_user()
    AND (department_id IS NULL OR department_id = ANY (public.get_user_department_ids()))
  )
);

CREATE POLICY "Admins can delete sick days in their departments"
ON public.sick_days FOR DELETE TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.is_admin_user()
    AND (department_id IS NULL OR department_id = ANY (public.get_user_department_ids()))
  )
);

CREATE INDEX IF NOT EXISTS idx_sick_days_dept_date ON public.sick_days (department_id, sick_date);

CREATE OR REPLACE FUNCTION public.list_department_absent_user_ids(_department_id uuid, _date date DEFAULT CURRENT_DATE)
RETURNS TABLE (user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT sd.user_id
  FROM public.sick_days sd
  WHERE sd.sick_date = _date
    AND (
      _department_id IS NULL
      OR sd.department_id = _department_id
    )
    AND (
      public.is_super_admin()
      OR _department_id = ANY (public.get_user_department_ids())
    );
$$;

REVOKE ALL ON FUNCTION public.list_department_absent_user_ids(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_department_absent_user_ids(uuid, date) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.sick_days;