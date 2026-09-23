CREATE OR REPLACE FUNCTION public.get_broadcast_recipients(p_campaign_id uuid)
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  read boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
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
  SELECT n.user_id, p.name, p.email, n.read, n.created_at
  FROM public.notifications n
  LEFT JOIN public.profiles p ON p.id = n.user_id
  WHERE n.broadcast_id = p_campaign_id
  ORDER BY p.name NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.get_broadcast_recipients(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_broadcast_recipients(uuid) TO authenticated;