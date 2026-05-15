-- Helper function: returns true if a user has no role row (i.e., pending admin approval)
CREATE OR REPLACE FUNCTION public.is_pending_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_pending_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pending_user(uuid) TO authenticated;

-- RPC: notify all super_admins that a new user is awaiting approval.
-- Idempotent: only inserts a notification per (super_admin, target user) combo
-- if no unread pending_user notification already exists.
CREATE OR REPLACE FUNCTION public.notify_admins_of_pending_user(
  _email text,
  _name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_id uuid;
  caller uuid := auth.uid();
  v_email text := lower(coalesce(_email, ''));
  v_name text := coalesce(nullif(_name, ''), v_email);
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
  LOOP
    -- Skip if a pending notification already exists for this admin/user pair
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = admin_id
        AND type = 'pending_user'
        AND read = false
        AND message LIKE '%' || v_email || '%'
    ) THEN
      INSERT INTO public.notifications(user_id, type, title, message, link)
      VALUES (
        admin_id,
        'pending_user',
        'Ny bruger venter på godkendelse',
        v_name || ' (' || v_email || ') har logget ind via Microsoft og venter på rolle/afdeling.',
        '/admin'
      );
    END IF;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admins_of_pending_user(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_admins_of_pending_user(text, text) TO authenticated;