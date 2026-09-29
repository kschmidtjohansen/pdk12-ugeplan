DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'handle_assignment_updated_at()','handle_new_user()','log_assignment_deletion()',
    'log_unauthorized_car_access()','security_audit_trigger()','set_temporary_user_expiration()',
    'update_modified_column()','update_updated_at_column()','validate_assignment_times()',
    'validate_vacation_dates()','cleanup_expired_temporary_users()','cleanup_old_change_logs()'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
  END LOOP;
END $$;