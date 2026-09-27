CREATE OR REPLACE FUNCTION public.notify_duty_swap_status()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  _duty public.on_call_duties%ROWTYPE; _label text; _formatted text; _actor_name text; _cand uuid;
BEGIN
  SELECT * INTO _duty FROM public.on_call_duties WHERE id = NEW.duty_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  _label := public.duty_type_label_da(_duty.duty_type);
  _formatted := to_char(_duty.duty_date, 'DD.MM.YYYY');

  IF NEW.status = 'cancelled' AND OLD.status = 'pending' THEN
    SELECT COALESCE(name, 'En kollega') INTO _actor_name FROM public.profiles WHERE id = NEW.requested_by;
    FOREACH _cand IN ARRAY COALESCE(OLD.candidate_ids, ARRAY[]::uuid[]) LOOP
      INSERT INTO public.notifications (user_id, type, title, message, link, read)
      VALUES (_cand, 'duty', 'Byttetilbud trukket tilbage',
        COALESCE(_actor_name, 'En kollega') || ' har trukket byttetilbuddet på ' || _label || ' den ' || _formatted || ' tilbage.',
        '/duty', false);
    END LOOP;
    RETURN NEW;
  END IF;

  IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT COALESCE(name, 'En kollega') INTO _actor_name FROM public.profiles WHERE id = NEW.accepted_by;
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (NEW.requested_by, 'duty', 'Vagt overtaget',
      COALESCE(_actor_name, 'En kollega') || ' har overtaget din ' || _label || ' den ' || _formatted || '.', '/duty', false);
    FOREACH _cand IN ARRAY OLD.candidate_ids LOOP
      IF _cand <> NEW.accepted_by THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, read)
        VALUES (_cand, 'duty', 'Vagten er taget', _label || ' den ' || _formatted || ' er allerede taget af en anden.', '/duty', false);
      END IF;
    END LOOP;
    RETURN NEW;
  END IF;

  IF (NEW.status = 'declined' AND OLD.status <> 'declined')
     OR (NEW.status = 'pending' AND OLD.status = 'pending'
         AND COALESCE(array_length(NEW.candidate_ids, 1), 0) < COALESCE(array_length(OLD.candidate_ids, 1), 0)) THEN
    SELECT COALESCE(p.name, 'En kollega') INTO _actor_name FROM public.profiles p
    WHERE p.id = (SELECT c FROM unnest(OLD.candidate_ids) AS c
      WHERE NOT (c = ANY (COALESCE(NEW.candidate_ids, ARRAY[]::uuid[]))) LIMIT 1);
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (NEW.requested_by, 'duty', 'Byttetilbud afslået',
      COALESCE(_actor_name, 'En kollega') || ' har afslået ' || _label || ' den ' || _formatted || '.', '/duty', false);
  END IF;
  RETURN NEW;
END;
$function$;