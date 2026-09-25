
CREATE OR REPLACE FUNCTION public.duty_type_label_da(_duty_type public.duty_type)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE WHEN _duty_type = 'skadeleder_vagt' THEN 'Skadeleder vagt' ELSE 'Kørevagt' END;
$$;

CREATE OR REPLACE FUNCTION public.notify_duty_swap_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _duty public.on_call_duties%ROWTYPE;
  _requester_name text;
  _label text;
  _formatted text;
  _cand uuid;
BEGIN
  SELECT * INTO _duty FROM public.on_call_duties WHERE id = NEW.duty_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(name, 'Kollega') INTO _requester_name
  FROM public.profiles WHERE id = NEW.requested_by;

  _label := public.duty_type_label_da(_duty.duty_type);
  _formatted := to_char(_duty.duty_date, 'DD.MM.YYYY');

  FOREACH _cand IN ARRAY NEW.candidate_ids LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
      _cand,
      'duty',
      'Byttetilbud på vagt',
      COALESCE(_requester_name, 'Kollega') || ' tilbyder dig ' || _label || ' den ' || _formatted || '. Først til mølle.',
      '/duty',
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_duty_swap_offer ON public.duty_swap_requests;
CREATE TRIGGER trg_notify_duty_swap_offer
AFTER INSERT ON public.duty_swap_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_duty_swap_offer();

CREATE OR REPLACE FUNCTION public.notify_duty_swap_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _duty public.on_call_duties%ROWTYPE;
  _label text;
  _formatted text;
  _actor_name text;
  _cand uuid;
BEGIN
  SELECT * INTO _duty FROM public.on_call_duties WHERE id = NEW.duty_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  _label := public.duty_type_label_da(_duty.duty_type);
  _formatted := to_char(_duty.duty_date, 'DD.MM.YYYY');

  -- Accepted: notify requester + remaining candidates
  IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT COALESCE(name, 'En kollega') INTO _actor_name
    FROM public.profiles WHERE id = NEW.accepted_by;

    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
      NEW.requested_by,
      'duty',
      'Vagt overtaget',
      COALESCE(_actor_name, 'En kollega') || ' har overtaget din ' || _label || ' den ' || _formatted || '.',
      '/duty',
      false
    );

    FOREACH _cand IN ARRAY OLD.candidate_ids LOOP
      IF _cand <> NEW.accepted_by THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, read)
        VALUES (
          _cand,
          'duty',
          'Vagten er taget',
          _label || ' den ' || _formatted || ' er allerede taget af en anden.',
          '/duty',
          false
        );
      END IF;
    END LOOP;

    RETURN NEW;
  END IF;

  -- Declined (fully or partially): notify requester about who said no
  IF (NEW.status = 'declined' AND OLD.status <> 'declined')
     OR (NEW.status = 'pending' AND OLD.status = 'pending'
         AND COALESCE(array_length(NEW.candidate_ids, 1), 0) < COALESCE(array_length(OLD.candidate_ids, 1), 0)) THEN
    SELECT COALESCE(p.name, 'En kollega') INTO _actor_name
    FROM public.profiles p
    WHERE p.id = (
      SELECT c FROM unnest(OLD.candidate_ids) AS c
      WHERE NOT (c = ANY (COALESCE(NEW.candidate_ids, ARRAY[]::uuid[])))
      LIMIT 1
    );

    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
      NEW.requested_by,
      'duty',
      'Byttetilbud afslået',
      COALESCE(_actor_name, 'En kollega') || ' har afslået ' || _label || ' den ' || _formatted || '.',
      '/duty',
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_duty_swap_status ON public.duty_swap_requests;
CREATE TRIGGER trg_notify_duty_swap_status
AFTER UPDATE ON public.duty_swap_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_duty_swap_status();
