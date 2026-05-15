CREATE TABLE public.auto_publish_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_at timestamptz NOT NULL DEFAULT now(),
  assignments_updated integer NOT NULL DEFAULT 0,
  department_id uuid NULL,
  triggered_by text NOT NULL DEFAULT 'cron'
);

CREATE INDEX idx_auto_publish_log_run_at ON public.auto_publish_log (run_at DESC);
CREATE INDEX idx_auto_publish_log_dept ON public.auto_publish_log (department_id, run_at DESC);

ALTER TABLE public.auto_publish_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read auto_publish_log"
ON public.auto_publish_log
FOR SELECT
TO authenticated
USING (
  public.user_has_role('super_admin'::public.user_role)
  OR public.user_has_role('administrator'::public.user_role)
  OR public.user_has_role('skadeleder'::public.user_role)
);

CREATE OR REPLACE FUNCTION public.auto_publish_due_assignments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated integer := 0;
  v_total integer := 0;
  v_dept record;
BEGIN
  FOR v_dept IN
    SELECT DISTINCT department_id
    FROM public.assignments
    WHERE published = false
      AND date <= (now() AT TIME ZONE 'Europe/Copenhagen')::date
  LOOP
    WITH upd AS (
      UPDATE public.assignments
      SET published = true,
          updated_at = now()
      WHERE published = false
        AND date <= (now() AT TIME ZONE 'Europe/Copenhagen')::date
        AND department_id IS NOT DISTINCT FROM v_dept.department_id
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_updated FROM upd;

    INSERT INTO public.auto_publish_log (run_at, assignments_updated, department_id, triggered_by)
    VALUES (now(), v_updated, v_dept.department_id, 'cron');

    v_total := v_total + v_updated;
  END LOOP;

  RETURN v_total;
END;
$$;