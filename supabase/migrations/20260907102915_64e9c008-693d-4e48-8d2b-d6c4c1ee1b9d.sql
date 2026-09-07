CREATE INDEX IF NOT EXISTS idx_assignments_department_date ON public.assignments (department_id, assignment_date);
CREATE INDEX IF NOT EXISTS idx_web_vitals_created_at ON public.web_vitals_metrics (created_at);

CREATE OR REPLACE FUNCTION public.cleanup_log_retention()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_logs integer := 0;
  deleted_vitals integer := 0;
  deleted_changes integer := 0;
  batch integer;
BEGIN
  -- System logs: keep 90 days (delete in batches to avoid long locks)
  LOOP
    WITH doomed AS (
      SELECT id FROM public.logs
      WHERE created_at < now() - interval '90 days'
      LIMIT 20000
    )
    DELETE FROM public.logs l USING doomed d WHERE l.id = d.id;
    GET DIAGNOSTICS batch = ROW_COUNT;
    deleted_logs := deleted_logs + batch;
    EXIT WHEN batch = 0 OR deleted_logs >= 500000;
  END LOOP;

  -- Web vitals metrics: keep 30 days
  LOOP
    WITH doomed AS (
      SELECT id FROM public.web_vitals_metrics
      WHERE created_at < now() - interval '30 days'
      LIMIT 20000
    )
    DELETE FROM public.web_vitals_metrics w USING doomed d WHERE w.id = d.id;
    GET DIAGNOSTICS batch = ROW_COUNT;
    deleted_vitals := deleted_vitals + batch;
    EXIT WHEN batch = 0 OR deleted_vitals >= 200000;
  END LOOP;

  -- Planner change log: keep 365 days
  DELETE FROM public.planner_change_log
  WHERE created_at < now() - interval '365 days';
  GET DIAGNOSTICS deleted_changes = ROW_COUNT;

  RETURN jsonb_build_object(
    'logs_deleted', deleted_logs,
    'web_vitals_deleted', deleted_vitals,
    'planner_change_log_deleted', deleted_changes,
    'run_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_log_retention() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_log_retention() TO service_role;

SELECT cron.schedule('log-retention-cleanup', '30 3 * * *', $$SELECT public.cleanup_log_retention();$$);