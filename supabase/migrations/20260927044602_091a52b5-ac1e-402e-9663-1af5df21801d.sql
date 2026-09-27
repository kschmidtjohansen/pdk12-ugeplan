DO $$
DECLARE r record;
BEGIN
  -- 1) anon: revoke on all SECURITY DEFINER functions except kiosk + policy helpers
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND p.proname NOT IN ('list_screen_display_assignments','list_screen_display_absences','list_screen_display_sub_departments')
      AND NOT EXISTS (SELECT 1 FROM pg_policies pp WHERE coalesce(pp.qual,'')||' '||coalesce(pp.with_check,'') ~ ('\m'||p.proname||'\('))
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;

  -- 2) authenticated: revoke on unused internal SECURITY DEFINER functions
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.prosecdef
      AND p.proname IN ('add_system_log','can_access_assignment','can_access_department_data','can_access_profile_field','can_user_access_assignment','can_view_fuel_codes_audited','check_rate_limit_security','debug_auth_info','delete_expired_approved_vacations','get_accessible_profiles','get_car_with_conditional_access','get_cars_with_security','get_enhanced_system_metrics','get_profile_detailed','get_profile_with_role','get_profiles_admin_detailed','get_profiles_basic','get_security_events_summary','get_shared_duty_department_ids','get_user_role','get_user_role_safe','get_user_sub_department_ids','is_pending_user','is_user_assigned_to_assignment','log_data_access_attempt','log_data_fetch_error_safe','log_profile_access_attempt','log_realtime_change_throttled','log_security_event','log_vacation_security_event','notify_admins_of_pending_user','security_health_check','sync_user_roles_to_jwt','test_query_performance','validate_data_integrity','validate_database_health','validate_input_security','verify_data_access_fix','verify_policy_fix','verify_role_assignments')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

COMMENT ON TABLE public.app_internal_config IS 'Backend-only configuration. RLS enabled with no policies by design: only service_role / SECURITY DEFINER functions may access it.';