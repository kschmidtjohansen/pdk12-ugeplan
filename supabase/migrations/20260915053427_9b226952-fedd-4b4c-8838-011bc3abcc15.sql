CREATE OR REPLACE FUNCTION public.cleanup_log_retention()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_logs integer := 0;
  v_vitals integer := 0;
  v_planner integer := 0;
  v_sick integer := 0;
BEGIN
  WITH del AS (
    DELETE FROM public.logs
    WHERE ctid IN (
      SELECT ctid FROM public.logs
      WHERE created_at < now() - interval '90 days'
      LIMIT 500000
    )
    RETURNING 1
  ) SELECT count(*) INTO v_logs FROM del;

  WITH del AS (
    DELETE FROM public.web_vitals_metrics
    WHERE ctid IN (
      SELECT ctid FROM public.web_vitals_metrics
      WHERE created_at < now() - interval '30 days'
      LIMIT 200000
    )
    RETURNING 1
  ) SELECT count(*) INTO v_vitals FROM del;

  WITH del AS (
    DELETE FROM public.planner_change_log
    WHERE ctid IN (
      SELECT ctid FROM public.planner_change_log
      WHERE created_at < now() - interval '365 days'
      LIMIT 20000
    )
    RETURNING 1
  ) SELECT count(*) INTO v_planner FROM del;

  WITH del AS (
    DELETE FROM public.sick_days
    WHERE ctid IN (
      SELECT ctid FROM public.sick_days
      WHERE sick_date < (current_date - interval '365 days')
      LIMIT 20000
    )
    RETURNING 1
  ) SELECT count(*) INTO v_sick FROM del;

  RETURN jsonb_build_object(
    'logs_deleted', v_logs,
    'web_vitals_deleted', v_vitals,
    'planner_change_log_deleted', v_planner,
    'sick_days_deleted', v_sick,
    'run_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_log_retention() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_log_retention() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_log_retention() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_log_retention() TO service_role;