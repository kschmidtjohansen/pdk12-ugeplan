CREATE OR REPLACE FUNCTION public.auto_publish_due_assignments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated integer := 0;
  v_total   integer := 0;
  v_dept    record;
BEGIN
  FOR v_dept IN
    SELECT DISTINCT department_id
    FROM public.assignments
    WHERE published = false
      AND assignment_date <= (now() AT TIME ZONE 'Europe/Copenhagen')::date
  LOOP
    WITH upd AS (
      UPDATE public.assignments
      SET published = true,
          updated_at = now()
      WHERE published = false
        AND assignment_date <= (now() AT TIME ZONE 'Europe/Copenhagen')::date
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