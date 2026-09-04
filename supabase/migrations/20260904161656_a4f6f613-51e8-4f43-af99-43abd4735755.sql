CREATE OR REPLACE FUNCTION public.accept_duty_swap(_request_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _request public.duty_swap_requests%ROWTYPE;
  _duty public.on_call_duties%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RETURN 'unauthenticated';
  END IF;

  SELECT * INTO _request
  FROM public.duty_swap_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF _request.status <> 'pending' THEN
    RETURN 'already_taken';
  END IF;

  IF _request.expires_at < now() THEN
    UPDATE public.duty_swap_requests
    SET status = 'expired', updated_at = now()
    WHERE id = _request_id;
    RETURN 'expired';
  END IF;

  IF NOT (_user_id = ANY (_request.candidate_ids)) THEN
    RETURN 'not_invited';
  END IF;

  SELECT * INTO _duty
  FROM public.on_call_duties
  WHERE id = _request.duty_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'duty_missing';
  END IF;

  IF _duty.duty_type = 'skadeleder_vagt' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
        AND role IN ('administrator','skadeleder','super_admin')
    ) THEN
      RETURN 'invalid_role';
    END IF;
  END IF;

  UPDATE public.on_call_duties
  SET employee_id = _user_id, updated_at = now()
  WHERE id = _request.duty_id;

  UPDATE public.duty_swap_requests
  SET status = 'accepted',
      accepted_by = _user_id,
      accepted_at = now(),
      updated_at = now()
  WHERE id = _request_id;

  RETURN 'accepted';
END;
$function$;

CREATE OR REPLACE FUNCTION public.decline_duty_swap(_request_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _request public.duty_swap_requests%ROWTYPE;
  _remaining uuid[];
BEGIN
  IF _user_id IS NULL THEN
    RETURN 'unauthenticated';
  END IF;

  SELECT * INTO _request
  FROM public.duty_swap_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF _request.status <> 'pending' THEN
    RETURN 'not_pending';
  END IF;

  IF NOT (_user_id = ANY (_request.candidate_ids)) THEN
    RETURN 'not_invited';
  END IF;

  SELECT array_agg(c) INTO _remaining
  FROM unnest(_request.candidate_ids) AS c
  WHERE c <> _user_id;

  IF _remaining IS NULL OR array_length(_remaining, 1) IS NULL THEN
    UPDATE public.duty_swap_requests
    SET status = 'declined',
        candidate_ids = ARRAY[]::uuid[],
        updated_at = now()
    WHERE id = _request_id;
    RETURN 'declined';
  END IF;

  UPDATE public.duty_swap_requests
  SET candidate_ids = _remaining,
      updated_at = now()
  WHERE id = _request_id;

  RETURN 'declined_partial';
END;
$function$;

GRANT EXECUTE ON FUNCTION public.decline_duty_swap(uuid) TO authenticated;