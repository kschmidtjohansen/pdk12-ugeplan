-- =====================================================================
-- STAGED — REVIEW ONLY. NOT EXECUTED. NOT A MIGRATION FILE.
-- PolyPlan backend security rollout (Punkt 1).
-- Run manually in the Supabase SQL editor AFTER a backup (see
-- docs/operations/backend-security-rollout.md). Whole file is one transaction.
-- Non-destructive: no table/column drops, no data deletes.
-- =====================================================================
BEGIN;

-- 0) Helper: department memberships (user_access + home department).
CREATE OR REPLACE FUNCTION public.security_user_department_ids(_uid uuid)
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(array_agg(DISTINCT d), '{}'::uuid[]) FROM (
    SELECT ua.department_id AS d FROM public.user_access ua WHERE ua.user_id = _uid
    UNION
    SELECT p.home_department_id FROM public.profiles p
     WHERE p.id = _uid AND p.home_department_id IS NOT NULL
  ) s;
$$;
REVOKE ALL ON FUNCTION public.security_user_department_ids(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.security_user_department_ids(uuid) TO service_role;

-- 1) Effective permission with DENY precedence (personal "Fra" wins).
CREATE OR REPLACE FUNCTION public.security_effective_permission_for(p_user_id uuid, p_permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    NOT EXISTS (SELECT 1 FROM public.user_permissions up
                 WHERE up.user_id = p_user_id AND up.permission = p_permission AND up.granted = false)
    AND (
      EXISTS (SELECT 1 FROM public.user_roles ur
                JOIN public.role_permissions rp ON rp.role = ur.role
               WHERE ur.user_id = p_user_id AND rp.permission = p_permission)
      OR EXISTS (SELECT 1 FROM public.user_permissions up
                  WHERE up.user_id = p_user_id AND up.permission = p_permission AND up.granted = true)
    );
$$;
REVOKE ALL ON FUNCTION public.security_effective_permission_for(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.security_effective_permission_for(uuid, text) TO service_role;

-- has_role_permission keeps its signature/grants (used by existing RLS policies:
-- plan_assignments x10, approve_vacations x3, view_all_vacations x1) but now
-- respects an explicit personal "Fra".
CREATE OR REPLACE FUNCTION public.has_role_permission(_permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT public.security_effective_permission_for(auth.uid(), _permission);
$$;
REVOKE ALL ON FUNCTION public.has_role_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role_permission(text) TO authenticated, service_role;

-- 2) user_permissions: own rows + super_admin only (was: every authenticated user).
DROP POLICY IF EXISTS "Authenticated can read user permissions" ON public.user_permissions;
CREATE POLICY "Read own or super admin user permissions" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_super_admin((SELECT auth.uid())));

-- 3) Atomic role replacement (service_role only; authorization lives in the Edge Function).
CREATE OR REPLACE FUNCTION public.replace_user_roles(p_user_id uuid, p_roles public.user_role[])
RETURNS public.user_role[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v public.user_role[];
BEGIN
  IF p_roles IS NULL OR cardinality(p_roles) = 0 THEN
    RAISE EXCEPTION 'At least one role required' USING ERRCODE = '22023';
  END IF;
  SELECT array_agg(DISTINCT r) INTO v FROM unnest(p_roles) AS r;
  -- Serialize concurrent role edits for the same user.
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0002'; END IF;
  DELETE FROM public.user_roles WHERE user_id = p_user_id AND NOT (role = ANY (v));
  INSERT INTO public.user_roles (user_id, role)
    SELECT p_user_id, r FROM unnest(v) AS r
     WHERE NOT EXISTS (SELECT 1 FROM public.user_roles x WHERE x.user_id = p_user_id AND x.role = r);
  RETURN v;
END;
$$;
REVOKE ALL ON FUNCTION public.replace_user_roles(uuid, public.user_role[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_user_roles(uuid, public.user_role[]) TO service_role;

-- 4) Atomic absence cleanup (service_role only; authorization in Edge Function).
CREATE OR REPLACE FUNCTION public.apply_absence_cleanup(
  p_user_id uuid, p_start date, p_end date,
  p_is_partial boolean, p_partial_start time, p_partial_end time,
  p_reason text, p_vacation_id uuid, p_changed_by uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_removed jsonb; v_cleared jsonb; v_details jsonb;
  v_op_u text; v_op_c text; v_emp text; v_by text; v_by_first text; v_reason_txt text;
  v_ps time := COALESCE(p_partial_start, '00:00:00');
  v_pe time := COALESCE(p_partial_end, '23:59:59');
  v_notified int := 0;
BEGIN
  IF p_reason NOT IN ('approved_vacation','on_leave','training','sick') THEN
    RAISE EXCEPTION 'Invalid reason' USING ERRCODE = '22023';
  END IF;
  IF p_end < p_start OR (p_end - p_start) > 365 THEN
    RAISE EXCEPTION 'Invalid period' USING ERRCODE = '22023';
  END IF;

  SELECT name INTO v_emp FROM public.profiles WHERE id = p_user_id;
  SELECT name, split_part(name, ' ', 1) INTO v_by, v_by_first FROM public.profiles WHERE id = p_changed_by;
  v_emp := COALESCE(v_emp, 'Medarbejder'); v_by := COALESCE(v_by, 'System'); v_by_first := COALESCE(v_by_first, 'System');

  v_op_u := CASE p_reason WHEN 'sick' THEN 'auto_unassign_sick' WHEN 'training' THEN 'auto_unassign_training'
                          WHEN 'on_leave' THEN 'auto_unassign_on_leave' ELSE 'auto_unassign_vacation' END;
  v_op_c := CASE p_reason WHEN 'sick' THEN 'auto_clear_responsible_sick' WHEN 'training' THEN 'auto_clear_responsible_training'
                          WHEN 'on_leave' THEN 'auto_clear_responsible_on_leave' ELSE 'auto_clear_responsible_vacation' END;
  v_details := jsonb_build_object('reason', p_reason, 'vacation_id', p_vacation_id, 'removed_user_id', p_user_id,
                                  'removed_user_name', v_emp, 'period_start', p_start, 'period_end', p_end);

  WITH del AS (
    DELETE FROM public.assignments_employees ae
     USING public.assignments a
     WHERE ae.assignment_id = a.id AND ae.user_id = p_user_id
       AND a.assignment_date BETWEEN p_start AND p_end
       AND (NOT p_is_partial OR (v_ps < COALESCE(a.to_time, '23:59:59') AND COALESCE(a.from_time, '00:00:00') < v_pe))
    RETURNING a.id, a.case_number, a.title, a.assignment_date, a.responsible_user_id)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'case_number', case_number, 'title', title,
                 'date', assignment_date, 'responsible_user_id', responsible_user_id)), '[]'::jsonb)
    INTO v_removed FROM del;

  WITH upd AS (
    UPDATE public.assignments a SET responsible_user_id = NULL, updated_at = now()
     WHERE a.responsible_user_id = p_user_id AND a.assignment_date BETWEEN p_start AND p_end
       AND (NOT p_is_partial OR (v_ps < COALESCE(a.to_time, '23:59:59') AND COALESCE(a.from_time, '00:00:00') < v_pe))
    RETURNING a.id)
  SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO v_cleared FROM upd;

  INSERT INTO public.planner_change_log (assignment_id, operation, changed_by, changed_by_name, changed_by_first_name, change_details)
  SELECT (e->>'id')::uuid, v_op_u, p_changed_by, v_by, v_by_first, v_details FROM jsonb_array_elements(v_removed) e
  UNION ALL
  SELECT (c #>> '{}')::uuid, v_op_c, p_changed_by, v_by, v_by_first,
         v_details || jsonb_build_object('cleared_responsible_user_id', p_user_id, 'cleared_responsible_user_name', v_emp)
    FROM jsonb_array_elements(v_cleared) c;

  v_reason_txt := CASE p_reason WHEN 'training' THEN 'kursus' WHEN 'on_leave' THEN 'fravær' WHEN 'sick' THEN 'sygdom' ELSE 'godkendt fri' END;
  WITH buckets AS (
    SELECT (e->>'responsible_user_id')::uuid AS uid, count(*) AS n
      FROM jsonb_array_elements(v_removed) e
     WHERE e->>'responsible_user_id' IS NOT NULL AND (e->>'responsible_user_id')::uuid <> p_user_id
     GROUP BY 1), ins AS (
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    SELECT uid, 'vacation', 'Medarbejder fjernet fra opgaver',
           format('%s er fjernet fra %s opgave%s pga. %s (%s).', v_emp, n, CASE WHEN n = 1 THEN '' ELSE 'r' END, v_reason_txt,
                  CASE WHEN p_start = p_end THEN p_start::text ELSE p_start::text || '–' || p_end::text END),
           '/planner', false
      FROM buckets RETURNING 1)
  SELECT count(*) INTO v_notified FROM ins;

  RETURN jsonb_build_object('removedFromCount', jsonb_array_length(v_removed),
                            'clearedResponsibleCount', jsonb_array_length(v_cleared),
                            'notifiedResponsibleUsers', v_notified,
                            'affectedAssignments', v_removed);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_absence_cleanup(uuid, date, date, boolean, time, time, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_absence_cleanup(uuid, date, date, boolean, time, time, text, uuid, uuid) TO service_role;

-- 5) Atomic duty swap / transfer with row locks (callable by authenticated; checks auth.uid()).
CREATE OR REPLACE FUNCTION public.swap_or_transfer_duty(p_duty1 uuid, p_duty2 uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  d1 public.on_call_duties%ROWTYPE; d2 public.on_call_duties%ROWTYPE;
  v_roles text[]; v_mgr boolean; v_transfer boolean; v_owner uuid;
  v_skv constant text[] := ARRAY['administrator','skadeleder','super_admin','fugttekniker'];
  v_today date := (now() AT TIME ZONE 'Europe/Copenhagen')::date;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_duty1 IS NULL OR p_duty2 IS NULL OR p_duty1 = p_duty2 THEN
    RAISE EXCEPTION 'Two different duties required' USING ERRCODE = '22023';
  END IF;

  -- Lock both rows in a deterministic order (prevents deadlocks and concurrent double swaps).
  PERFORM 1 FROM public.on_call_duties WHERE id IN (p_duty1, p_duty2) ORDER BY id FOR UPDATE;
  SELECT * INTO d1 FROM public.on_call_duties WHERE id = p_duty1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Duty not found' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO d2 FROM public.on_call_duties WHERE id = p_duty2;
  IF NOT FOUND THEN RAISE EXCEPTION 'Duty not found' USING ERRCODE = 'P0002'; END IF;

  IF d1.department_id IS NULL OR d1.department_id IS DISTINCT FROM d2.department_id THEN
    RAISE EXCEPTION 'Duties must belong to the same department' USING ERRCODE = '42501';
  END IF;
  IF d1.duty_type <> d2.duty_type THEN RAISE EXCEPTION 'Can only swap duties of the same type' USING ERRCODE = '22023'; END IF;
  IF d1.duty_date < v_today OR d2.duty_date < v_today THEN RAISE EXCEPTION 'Cannot swap past duties' USING ERRCODE = '22023'; END IF;
  IF d1.employee_id IS NULL AND d2.employee_id IS NULL THEN RAISE EXCEPTION 'Cannot swap two unassigned duties' USING ERRCODE = '22023'; END IF;

  SELECT COALESCE(array_agg(role::text), '{}') INTO v_roles FROM public.user_roles WHERE user_id = v_uid;
  IF NOT ('super_admin' = ANY (v_roles)) AND NOT (d1.department_id = ANY (public.security_user_department_ids(v_uid))) THEN
    RAISE EXCEPTION 'Not allowed in this department' USING ERRCODE = '42501';
  END IF;
  v_mgr := 'super_admin' = ANY (v_roles)
           OR (('administrator' = ANY (v_roles) OR 'skadeleder' = ANY (v_roles)) AND public.can_manage_duty_department(d1.department_id));

  IF NOT v_mgr AND d1.duty_type <> 'kørevagt' AND NOT (v_roles && v_skv) THEN
    RAISE EXCEPTION 'Not allowed for this duty type' USING ERRCODE = '42501';
  END IF;

  v_transfer := d1.employee_id IS NULL OR d2.employee_id IS NULL;
  IF v_transfer THEN
    v_owner := COALESCE(d1.employee_id, d2.employee_id);
    IF NOT v_mgr AND v_owner <> v_uid THEN RAISE EXCEPTION 'Not allowed to transfer this duty' USING ERRCODE = '42501'; END IF;
    IF d1.duty_type = 'skadeleder_vagt' AND NOT EXISTS (
         SELECT 1 FROM public.user_roles WHERE user_id = v_owner AND role::text = ANY (v_skv)) THEN
      RAISE EXCEPTION 'Employee not qualified for skadeleder vagt' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF NOT v_mgr AND v_uid NOT IN (d1.employee_id, d2.employee_id) THEN
      RAISE EXCEPTION 'Not allowed to swap these duties' USING ERRCODE = '42501';
    END IF;
    IF d1.duty_type = 'skadeleder_vagt' AND (
         NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = d1.employee_id AND role::text = ANY (v_skv))
      OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = d2.employee_id AND role::text = ANY (v_skv))) THEN
      RAISE EXCEPTION 'Employees not qualified for skadeleder vagt' USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.on_call_duties SET employee_id = d2.employee_id, updated_at = now() WHERE id = d1.id;
  UPDATE public.on_call_duties SET employee_id = d1.employee_id, updated_at = now() WHERE id = d2.id;

  RETURN jsonb_build_object(
    'is_transfer', v_transfer, 'duty_type', d1.duty_type,
    'd1_date', d1.duty_date, 'd2_date', d2.duty_date,
    -- e1/e2 = who holds duty1/duty2 AFTER the change
    'e1', d2.employee_id, 'e2', d1.employee_id,
    'e1_name', (SELECT name FROM public.profiles WHERE id = d2.employee_id),
    'e2_name', (SELECT name FROM public.profiles WHERE id = d1.employee_id));
END;
$$;
REVOKE ALL ON FUNCTION public.swap_or_transfer_duty(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.swap_or_transfer_duty(uuid, uuid) TO authenticated, service_role;

COMMIT;
