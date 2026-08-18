CREATE OR REPLACE FUNCTION public.update_car_note(_car_id uuid, _note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.cars
  SET notes = NULLIF(btrim(COALESCE(_note, '')), ''),
      updated_at = now()
  WHERE id = _car_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Car not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_car_note(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_car_note(uuid, text) TO authenticated;