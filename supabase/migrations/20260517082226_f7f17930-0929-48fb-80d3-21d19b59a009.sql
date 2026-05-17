CREATE OR REPLACE FUNCTION public.search_assignments(query text, dept_id uuid)
RETURNS SETOF public.assignments
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT *
  FROM public.assignments
  WHERE department_id = dept_id
    AND length(trim(query)) >= 2
    AND (
      title ILIKE '%' || query || '%'
      OR location ILIKE '%' || query || '%'
      OR case_number ILIKE '%' || query || '%'
    )
  ORDER BY assignment_date DESC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.search_assignments(text, uuid) TO authenticated;