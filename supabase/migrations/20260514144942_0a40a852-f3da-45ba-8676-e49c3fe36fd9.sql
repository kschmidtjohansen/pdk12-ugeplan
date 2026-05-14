-- Lock down internal SECURITY DEFINER functions: revoke EXECUTE from PUBLIC/anon/authenticated.
-- Triggers run as table owner (unaffected). Helpers called from other definer functions
-- continue to work because the outer definer runs as owner.

-- Trigger / event-trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_assignment_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_assignment_deletion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_modified_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_assignment_times() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_duty_assignment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_vacation_dates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.security_audit_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_apply_rls_to_log_partitions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_logs_rls_policies(table_name text) FROM PUBLIC, anon, authenticated;

-- Logging helpers (only called from inside other definer functions)
REVOKE EXECUTE ON FUNCTION public.add_system_log(p_event_type text, p_message text, p_details jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_data_access_attempt(table_name text, access_type text, record_id uuid, success boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_data_fetch_error_safe(operation_type text, error_message text, user_id_param uuid, retry_count integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_profile_access_attempt(profile_id uuid, access_type text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_realtime_change_throttled(table_name text, operation text, record_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_security_event(event_type text, event_message text, event_details jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_security_event_optimized(event_type text, event_message text, event_details jsonb, severity text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_security_event_safe(event_type text, event_message text, event_details jsonb, severity text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_unauthorized_car_access() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_vacation_security_event(event_type text, vacation_id uuid, details jsonb) FROM PUBLIC, anon, authenticated;

-- Maintenance / cron / admin-only utilities
REVOKE EXECUTE ON FUNCTION public.cleanup_demo_data_ttl() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_temporary_users() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_change_logs() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_logs_partition_for_month() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_expired_approved_vacations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_old_rejected_vacations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.emergency_log_cleanup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_logs_rls_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.perform_database_maintenance() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_materialized_views() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_automated_maintenance() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_logs_rls_maintenance() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_temporary_user_expiration() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_roles_to_jwt() FROM PUBLIC, anon, authenticated;

-- Diagnostics / health / verification (admin-only, must not be RPC-callable)
REVOKE EXECUTE ON FUNCTION public.check_data_access_health() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit_security(operation_key text, max_attempts integer, window_minutes integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_system_health() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debug_auth_info() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enhanced_security_monitor() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_enhanced_system_metrics() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_security_events_summary() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.security_health_check() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_complete_fix() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_data_access_fix() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_policy_fix() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_role_assignments() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_input_security(input_text text, input_type text, max_length integer) FROM PUBLIC, anon, authenticated;

-- Internal helper only invoked by get_cars_with_security
REVOKE EXECUTE ON FUNCTION public.get_car_with_conditional_access(car_row public.cars) FROM PUBLIC, anon, authenticated;