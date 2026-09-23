CREATE TABLE public.broadcast_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  created_by_name text NOT NULL DEFAULT '',
  department_id uuid REFERENCES public.departments(id),
  roles text[] NOT NULL DEFAULT '{}',
  title text NOT NULL,
  message text NOT NULL,
  link text,
  total_recipients integer NOT NULL DEFAULT 0,
  push_sent integer NOT NULL DEFAULT 0,
  push_failed integer NOT NULL DEFAULT 0,
  push_skipped_preference integer NOT NULL DEFAULT 0,
  push_no_subscription integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.broadcast_campaigns TO authenticated;
GRANT ALL ON public.broadcast_campaigns TO service_role;

ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broadcast_campaigns_select_admins"
ON public.broadcast_campaigns
FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (
    public.is_current_user_admin()
    AND (
      department_id IS NULL
      OR department_id = ANY (public.get_user_department_ids())
    )
  )
);

CREATE TRIGGER update_broadcast_campaigns_updated_at
BEFORE UPDATE ON public.broadcast_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS broadcast_id uuid REFERENCES public.broadcast_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_broadcast_id
  ON public.notifications (broadcast_id)
  WHERE broadcast_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.increment_broadcast_stats(
  p_campaign_id uuid,
  p_sent integer DEFAULT 0,
  p_failed integer DEFAULT 0,
  p_skipped integer DEFAULT 0,
  p_no_sub integer DEFAULT 0
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.broadcast_campaigns
  SET push_sent = push_sent + COALESCE(p_sent, 0),
      push_failed = push_failed + COALESCE(p_failed, 0),
      push_skipped_preference = push_skipped_preference + COALESCE(p_skipped, 0),
      push_no_subscription = push_no_subscription + COALESCE(p_no_sub, 0),
      updated_at = now()
  WHERE id = p_campaign_id;
$$;

REVOKE ALL ON FUNCTION public.increment_broadcast_stats(uuid, integer, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_broadcast_stats(uuid, integer, integer, integer, integer) TO service_role;