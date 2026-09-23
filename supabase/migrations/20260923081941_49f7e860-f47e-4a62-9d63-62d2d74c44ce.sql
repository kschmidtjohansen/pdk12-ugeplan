CREATE OR REPLACE FUNCTION public.notify_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret text;
  v_url text;
BEGIN
  IF NEW.is_demo THEN
    RETURN NEW;
  END IF;

  SELECT value INTO v_secret FROM public.app_internal_config WHERE key = 'push_trigger_secret';
  SELECT value INTO v_url FROM public.app_internal_config WHERE key = 'push_function_url';

  IF v_secret IS NULL OR v_url IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    body := jsonb_build_object('notification_id', NEW.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-trigger-secret', v_secret
    )
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_push_on_notification() FROM PUBLIC, anon, authenticated;