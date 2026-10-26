-- lovable-cron-fallback-reviewed: reminders must fire 15 min before a fixed start time; a per-record delay is unavailable, so a lightweight bounded per-minute check is required.
CREATE TABLE IF NOT EXISTS public.assignment_reminders_sent (
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  start_at timestamptz NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assignment_id, user_id, start_at)
);
ALTER TABLE public.assignment_reminders_sent ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assignment_reminders_sent FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.send_assignment_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inserted_count integer;
BEGIN
  WITH due AS (
    SELECT a.id AS assignment_id, ae.user_id, a.title, a.location, a.from_time,
           ((a.assignment_date + a.from_time) AT TIME ZONE 'Europe/Copenhagen') AS start_at
    FROM public.assignments a
    JOIN public.assignments_employees ae ON ae.assignment_id = a.id
    WHERE a.published = true
      AND COALESCE(a.is_demo, false) = false
      AND COALESCE(ae.is_demo, false) = false
      AND a.from_time IS NOT NULL
      AND a.assignment_date BETWEEN (now() AT TIME ZONE 'Europe/Copenhagen')::date - 1
                                AND (now() AT TIME ZONE 'Europe/Copenhagen')::date + 1
      AND ((a.assignment_date + a.from_time) AT TIME ZONE 'Europe/Copenhagen') > now()
      AND ((a.assignment_date + a.from_time) AT TIME ZONE 'Europe/Copenhagen') <= now() + interval '15 minutes'
      AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ae.user_id)
  ), marked AS (
    INSERT INTO public.assignment_reminders_sent (assignment_id, user_id, start_at)
    SELECT assignment_id, user_id, start_at FROM due
    ON CONFLICT DO NOTHING
    RETURNING assignment_id, user_id, start_at
  ), notified AS (
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    SELECT d.user_id, 'assignment_reminder', 'Opgave starter snart',
           d.title || ' starter kl. ' || to_char(d.from_time, 'HH24:MI')
             || CASE WHEN COALESCE(d.location, '') <> '' THEN ' – ' || d.location ELSE '' END,
           '/planner', false
    FROM due d
    JOIN marked m ON m.assignment_id = d.assignment_id AND m.user_id = d.user_id AND m.start_at = d.start_at
    RETURNING 1
  )
  SELECT count(*) INTO inserted_count FROM notified;

  DELETE FROM public.assignment_reminders_sent WHERE sent_at < now() - interval '3 days';
  RETURN inserted_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_assignment_reminders() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  PERFORM cron.unschedule('assignment-reminders-15min') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'assignment-reminders-15min');
  PERFORM cron.schedule('assignment-reminders-15min', '* * * * *', 'SELECT public.send_assignment_reminders();');
END $$;