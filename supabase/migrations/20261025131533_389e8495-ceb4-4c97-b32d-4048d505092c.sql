ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS resubscribe_token text;

CREATE OR REPLACE FUNCTION public.update_assignment_series(
  p_group_id uuid,
  p_fields jsonb,
  p_employee_ids uuid[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_ids uuid[];
  v_count integer;
BEGIN
  SELECT array_agg(id) INTO v_ids FROM public.assignments WHERE group_id = p_group_id;
  IF v_ids IS NULL OR array_length(v_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No assignments found in series';
  END IF;

  UPDATE public.assignments SET
    title = p_fields->>'title',
    description = p_fields->>'description',
    from_time = (p_fields->>'from_time')::time,
    to_time = (p_fields->>'to_time')::time,
    location = p_fields->>'location',
    case_number = p_fields->>'case_number',
    published = COALESCE((p_fields->>'published')::boolean, false),
    responsible_user_id = NULLIF(p_fields->>'responsible_user_id', '')::uuid,
    car_id = NULLIF(p_fields->>'car_id', '')::uuid,
    car_ids = CASE
      WHEN p_fields ? 'car_ids' AND jsonb_typeof(p_fields->'car_ids') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(p_fields->'car_ids'))::uuid[]
      ELSE NULL
    END,
    updated_at = now()
  WHERE group_id = p_group_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  DELETE FROM public.assignments_employees WHERE assignment_id = ANY(v_ids);

  IF p_employee_ids IS NOT NULL AND array_length(p_employee_ids, 1) IS NOT NULL THEN
    INSERT INTO public.assignments_employees (assignment_id, user_id)
    SELECT a_id, e_id
    FROM unnest(v_ids) AS a_id
    CROSS JOIN unnest(p_employee_ids) AS e_id;
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_assignment_series(uuid, jsonb, uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_assignment_series(p_group_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM public.assignments_employees
  WHERE assignment_id IN (SELECT id FROM public.assignments WHERE group_id = p_group_id);

  DELETE FROM public.assignments WHERE group_id = p_group_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_assignment_series(uuid) TO authenticated;