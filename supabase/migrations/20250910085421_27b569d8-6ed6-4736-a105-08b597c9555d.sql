-- List existing cron jobs to see what's currently scheduled
SELECT jobname, schedule, command FROM cron.job;

-- Create a new cron job that directly calls the database function
-- This runs daily at 2 AM and doesn't require the pg_net extension
SELECT cron.schedule(
  'cleanup-expired-users-direct',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT public.cleanup_expired_temporary_users();
  $$
);

-- Log the change
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'cron_job_creation',
  'Created direct function call cron job for temporary user cleanup',
  jsonb_build_object(
    'job_name', 'cleanup-expired-users-direct',
    'schedule', '0 2 * * * (Daily at 2 AM)',
    'function', 'public.cleanup_expired_temporary_users()',
    'reason', 'Replace any failing HTTP-based cleanup with reliable direct function call'
  )
);