
-- Reschedule cron to run at 00:01 Copenhagen time (handles DST by running at both 22:01 and 23:01 UTC)
SELECT cron.unschedule('auto-publish-assignments');

SELECT cron.schedule(
  'auto-publish-assignments',
  '1 22,23 * * *',
  $$SELECT public.auto_publish_due_assignments();$$
);

-- Update function: only run at Copenhagen hour 0, only publish assignments for today (Copenhagen)
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
  v_today   date;
BEGIN
  -- Only execute at midnight Copenhagen time (handles DST: cron runs at 22:01 and 23:01 UTC)
  IF EXTRACT(HOUR FROM (now() AT TIME ZONE 'Europe/Copenhagen')) <> 0 THEN
    RETURN 0;
  END IF;

  v_today := (now() AT TIME ZONE 'Europe/Copenhagen')::date;

  FOR v_dept IN
    SELECT DISTINCT department_id
    FROM public.assignments
    WHERE published = false
      AND assignment_date = v_today
  LOOP
    WITH upd AS (
      UPDATE public.assignments
      SET published = true,
          updated_at = now()
      WHERE published = false
        AND assignment_date = v_today
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
