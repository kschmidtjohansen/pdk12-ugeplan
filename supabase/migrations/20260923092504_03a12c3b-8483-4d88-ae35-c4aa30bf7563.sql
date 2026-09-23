ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS push_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS push_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS push_last_error text,
  ADD COLUMN IF NOT EXISTS push_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS notifications_broadcast_push_status_idx
  ON public.notifications (broadcast_id, push_status)
  WHERE broadcast_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.recalc_broadcast_stats(p_campaign_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  UPDATE public.broadcast_campaigns c
  SET push_sent = s.sent,
      push_failed = s.failed,
      push_skipped_preference = s.skipped,
      push_no_subscription = s.no_sub,
      updated_at = now()
  FROM (
    SELECT
      COUNT(*) FILTER (WHERE n.push_status = 'sent')::int AS sent,
      COUNT(*) FILTER (WHERE n.push_status = 'failed')::int AS failed,
      COUNT(*) FILTER (WHERE n.push_status = 'skipped')::int AS skipped,
      COUNT(*) FILTER (WHERE n.push_status = 'no_subscription')::int AS no_sub
    FROM public.notifications n
    WHERE n.broadcast_id = p_campaign_id
  ) s
  WHERE c.id = p_campaign_id;
$$;

REVOKE ALL ON FUNCTION public.recalc_broadcast_stats(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalc_broadcast_stats(uuid) TO service_role;

DROP FUNCTION IF EXISTS public.get_broadcast_recipients(uuid);

CREATE OR REPLACE FUNCTION public.get_broadcast_recipients(p_campaign_id uuid)
RETURNS TABLE(user_id uuid, name text, email text, read boolean, created_at timestamptz, push_status text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_department uuid;
BEGIN
  SELECT c.department_id INTO v_department
  FROM public.broadcast_campaigns c
  WHERE c.id = p_campaign_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF NOT (
    public.is_super_admin(auth.uid())
    OR (
      public.is_current_user_admin()
      AND (v_department IS NULL OR v_department = ANY (public.get_user_department_ids()))
    )
  ) THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  RETURN QUERY
  SELECT n.user_id, p.name, p.email, n.read, n.created_at, n.push_status
  FROM public.notifications n
  LEFT JOIN public.profiles p ON p.id = n.user_id
  WHERE n.broadcast_id = p_campaign_id
  ORDER BY p.name NULLS LAST;
END;
$$;