-- Drop the current failing cron job that uses HTTP calls
SELECT cron.unschedule('cleanup-expired-users-daily');

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
  'cron_job_migration',
  'Migrated temporary user cleanup from HTTP-based to direct function call',
  jsonb_build_object(
    'old_job', 'cleanup-expired-users-daily (HTTP-based)',
    'new_job', 'cleanup-expired-users-direct (direct function call)',
    'schedule', '0 2 * * * (Daily at 2 AM)',
    'reason', 'HTTP-based cron job was failing due to missing pg_net extension'
  )
);