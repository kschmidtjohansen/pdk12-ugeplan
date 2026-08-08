-- Harden: internal maintenance/ops functions must not be callable from the browser
DO $$
DECLARE
  fn text;
  names text[] := ARRAY[
    'emergency_log_cleanup','perform_database_maintenance','run_automated_maintenance',
    'schedule_maintenance_tasks','final_database_optimization','apply_logs_rls_policies',
    'rls_auto_enable','create_logs_partition_for_month','refresh_materialized_views',
    'generate_database_summary','run_logs_rls_maintenance','ensure_logs_rls_consistency',
    'auto_apply_rls_to_log_partitions','auto_publish_due_assignments','enhanced_security_monitor',
    'example_function','check_data_access_health','check_system_health','clear_sick_leave_data',
    'hmac_sha256','jwt_verify_hs256','base64url_decode','base64url_encode'
  ];
BEGIN
  FOR fn IN
    SELECT format('public.%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid))
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.proname = ANY(names)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END;
$$;

-- Missing atomic duty swap used by the swap-duties edge function
CREATE OR REPLACE FUNCTION public.swap_duty_employees(
  p_duty1_id uuid,
  p_duty2_id uuid,
  p_employee1_id uuid,
  p_employee2_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.on_call_duties
     SET employee_id = p_employee1_id, updated_at = now()
   WHERE id = p_duty1_id;

  UPDATE public.on_call_duties
     SET employee_id = p_employee2_id, updated_at = now()
   WHERE id = p_duty2_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.swap_duty_employees(uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.swap_duty_employees(uuid, uuid, uuid, uuid) TO service_role;