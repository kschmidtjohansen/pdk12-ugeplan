-- Create duty swap requests table
CREATE TABLE public.duty_swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duty_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  candidate_ids uuid[] NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  accepted_by uuid,
  accepted_at timestamptz,
  department_id uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT duty_swap_requests_status_check CHECK (status IN ('pending','accepted','cancelled','expired'))
);

CREATE INDEX idx_duty_swap_requests_duty_id ON public.duty_swap_requests(duty_id);
CREATE INDEX idx_duty_swap_requests_status ON public.duty_swap_requests(status);
CREATE INDEX idx_duty_swap_requests_candidates ON public.duty_swap_requests USING GIN (candidate_ids);
CREATE INDEX idx_duty_swap_requests_requested_by ON public.duty_swap_requests(requested_by);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_duty_swap_requests_updated_at
BEFORE UPDATE ON public.duty_swap_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.duty_swap_requests ENABLE ROW LEVEL SECURITY;

-- Requester can read their own requests
CREATE POLICY "Requester can read own swap requests"
ON public.duty_swap_requests
FOR SELECT
TO authenticated
USING (requested_by = auth.uid());

-- Candidates can read requests they are invited to
CREATE POLICY "Candidates can read swap offers"
ON public.duty_swap_requests
FOR SELECT
TO authenticated
USING (auth.uid() = ANY (candidate_ids));

-- Admins/skadeleder can read all
CREATE POLICY "Admins can read all swap requests"
ON public.duty_swap_requests
FOR SELECT
TO authenticated
USING (public.is_admin_or_skadeleder());

-- Requester can insert request for their own duty
CREATE POLICY "Requester can create swap request"
ON public.duty_swap_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.on_call_duties d
    WHERE d.id = duty_id AND d.employee_id = auth.uid()
  )
);

-- Requester can cancel (update status to cancelled) own pending request
CREATE POLICY "Requester can cancel own swap request"
ON public.duty_swap_requests
FOR UPDATE
TO authenticated
USING (requested_by = auth.uid() AND status = 'pending')
WITH CHECK (requested_by = auth.uid());

-- Admins can update
CREATE POLICY "Admins can update swap requests"
ON public.duty_swap_requests
FOR UPDATE
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- SECURITY DEFINER function for atomic accept
CREATE OR REPLACE FUNCTION public.accept_duty_swap(_request_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _request public.duty_swap_requests%ROWTYPE;
  _duty public.on_call_duties%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RETURN 'unauthenticated';
  END IF;

  -- Lock the request row
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

  -- Lock the duty
  SELECT * INTO _duty
  FROM public.on_call_duties
  WHERE id = _request.duty_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'duty_missing';
  END IF;

  -- For skadeleder_vagt only allow administrator/skadeleder roles
  IF _duty.duty_type = 'skadeleder_vagt' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
        AND role IN ('administrator','skadeleder','super_admin')
    ) THEN
      RETURN 'invalid_role';
    END IF;
  END IF;

  -- Reassign duty
  UPDATE public.on_call_duties
  SET employee_id = _user_id, updated_at = now()
  WHERE id = _request.duty_id;

  -- Mark request accepted
  UPDATE public.duty_swap_requests
  SET status = 'accepted',
      accepted_by = _user_id,
      accepted_at = now(),
      updated_at = now()
  WHERE id = _request_id;

  RETURN 'accepted';
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_duty_swap(uuid) TO authenticated;

-- Cancel function (for the requester)
CREATE OR REPLACE FUNCTION public.cancel_duty_swap(_request_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _request public.duty_swap_requests%ROWTYPE;
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

  IF _request.requested_by <> _user_id AND NOT public.is_admin_or_skadeleder() THEN
    RETURN 'not_authorized';
  END IF;

  IF _request.status <> 'pending' THEN
    RETURN 'not_pending';
  END IF;

  UPDATE public.duty_swap_requests
  SET status = 'cancelled', updated_at = now()
  WHERE id = _request_id;

  RETURN 'cancelled';
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_duty_swap(uuid) TO authenticated;

-- Realtime
ALTER TABLE public.duty_swap_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duty_swap_requests;