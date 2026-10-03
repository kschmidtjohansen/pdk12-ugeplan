CREATE OR REPLACE FUNCTION public.get_duty_contacts(_department_id uuid)
RETURNS TABLE(id uuid, name text, phone text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE _depts uuid[];
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF NOT (public.is_super_admin(auth.uid())
          OR _department_id = ANY(public.get_user_department_ids(auth.uid()))
          OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.home_department_id = _department_id)) THEN
    RETURN;
  END IF;
  _depts := array_append(COALESCE(public.get_shared_duty_department_ids(_department_id), ARRAY[]::uuid[]), _department_id);
  RETURN QUERY
  SELECT DISTINCT p.id, p.name, p.phone
  FROM public.profiles p
  WHERE p.status = 'active'
    AND (p.home_department_id = ANY(_depts)
         OR EXISTS (SELECT 1 FROM public.user_access ua WHERE ua.user_id = p.id AND ua.department_id = ANY(_depts)));
END;
$$;
REVOKE ALL ON FUNCTION public.get_duty_contacts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_duty_contacts(uuid) TO authenticated;