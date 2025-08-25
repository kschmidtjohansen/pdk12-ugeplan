-- Set up cron job to run the cleanup function daily at 2 AM
SELECT cron.schedule(
  'cleanup-expired-temporary-users',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://cyuyrpwtkljfiqwgasmn.supabase.co/functions/v1/cleanup-expired-users',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dXlycHd0a2xqZmlxd2dhc21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njc2ODk4MSwiZXhwIjoyMDYyMzQ0OTgxfQ.bM5wEn10RCOcVHG6FTutaXzUdH4EZ4LCFBKR6SQzNQU"}'::jsonb,
        body:=concat('{"scheduled": true, "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);