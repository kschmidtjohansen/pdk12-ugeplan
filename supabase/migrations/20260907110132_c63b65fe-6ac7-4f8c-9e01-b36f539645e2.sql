CREATE OR REPLACE FUNCTION public.notify_sick_day()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  rec_id uuid;
  v_name text;
  v_link text := '/employees';
  v_msg text;
BEGIN
  SELECT p.name INTO v_name FROM public.profiles p WHERE p.id = NEW.user_id;
  v_name := coalesce(nullif(v_name, ''), 'En medarbejder');
  v_msg := v_name || ' er meldt syg den ' || to_char(NEW.sick_date, 'DD-MM-YYYY') || '.';

  FOR rec_id IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    LEFT JOIN public.profiles pr ON pr.id = ur.user_id
    WHERE ur.role IN ('administrator', 'super_admin', 'skadeleder')
      AND (
        ur.role = 'super_admin'
        OR pr.home_department_id = NEW.department_id
        OR EXISTS (
          SELECT 1 FROM public.user_access ua
          WHERE ua.user_id = ur.user_id
            AND ua.department_id = NEW.department_id
        )
      )
      AND (NEW.created_by IS NULL OR ur.user_id <> NEW.created_by)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = rec_id
        AND n.type = 'sick_day'
        AND n.message = v_msg
    ) THEN
      INSERT INTO public.notifications(user_id, type, title, message, link)
      VALUES (rec_id, 'sick_day', 'Sygemelding', v_msg, v_link);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.notify_sick_day() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_sick_day ON public.sick_days;
CREATE TRIGGER trg_notify_sick_day
AFTER INSERT ON public.sick_days
FOR EACH ROW EXECUTE FUNCTION public.notify_sick_day();