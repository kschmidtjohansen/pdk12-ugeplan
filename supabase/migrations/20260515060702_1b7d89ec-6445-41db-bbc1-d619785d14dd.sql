-- Auto-publish: DB function + pg_cron schedule
CREATE OR REPLACE FUNCTION public.auto_publish_due_assignments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  UPDATE public.assignments
  SET published = true, updated_at = now()
  WHERE published = false
    AND assignment_date <= (now() AT TIME ZONE 'Europe/Copenhagen')::date;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count > 0 THEN
    BEGIN
      INSERT INTO public.logs (event_type, message, details)
      VALUES (
        'auto_publish',
        format('Auto-published %s assignment(s)', updated_count),
        jsonb_build_object(
          'count', updated_count,
          'run_at', now(),
          'copenhagen_date', (now() AT TIME ZONE 'Europe/Copenhagen')::date
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_publish_due_assignments() TO postgres, service_role;

-- Remove any prior schedule with same name to make migration idempotent
DO $$
BEGIN
  PERFORM cron.unschedule('auto-publish-assignments')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-publish-assignments');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'auto-publish-assignments',
  '* * * * *',
  $$SELECT public.auto_publish_due_assignments();$$
);