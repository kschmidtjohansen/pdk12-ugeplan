# Fix: 82 SECURITY DEFINER functions exposed via PostgREST

## Background
Supabase scanner flags every `SECURITY DEFINER` function in `public` that `authenticated` can `EXECUTE`, because they are auto-exposed at `/rest/v1/rpc/<name>`. We cannot blindly switch them to `SECURITY INVOKER` — many are RLS helpers that *must* run as definer to bypass recursion, and others are triggers.

The correct fix is to **REVOKE EXECUTE from `public`, `anon`, and `authenticated`** on every function that is **not** intentionally exposed as an RPC and **not** referenced inside a user-triggered RLS policy.

Key facts that make this safe:
- **Trigger functions** run as the table owner regardless of grants — revoking EXECUTE does not break triggers.
- **Helpers called from inside another `SECURITY DEFINER` function** continue to work, because the outer definer runs with the owner's privileges.
- **RLS helper functions** referenced in `USING`/`WITH CHECK` clauses *do* need EXECUTE for the querying role — those we keep.

## Categorization of the 82 functions

### KEEP callable by `authenticated` (RLS helpers + intentional RPCs)
Role/permission checks used in RLS:
`is_admin_user`, `is_admin_or_skadeleder`, `is_super_admin`, `is_current_user_admin`, `get_current_user_role`, `get_user_role`, `get_user_role_safe`, `user_has_role`, `get_user_department_ids`, `get_user_sub_department_ids`

Access checks used in RLS:
`can_access_assignment`, `can_access_case_data`, `can_access_department_data`, `can_access_profile_field`, `can_access_vacation`, `can_user_access_assignment`, `can_view_assignment_optimized`, `can_view_fuel_codes`, `can_view_fuel_codes_audited`, `is_user_assigned_to_assignment`

Intentional RPCs called by the frontend:
`list_accessible_assignments_with_team`, `list_demo_assignments_with_team`, `get_accessible_profiles`, `get_profile_detailed`, `get_profile_with_role`, `get_profiles_admin_detailed` (both overloads), `get_profiles_basic`, `get_cars_with_security`, `get_demo_cars_with_security`, `get_demo_duties_with_employee`, `get_demo_profiles_admin_detailed`, `get_demo_vacations`, `get_demo_warehouse_items`, `cancel_duty_swap`, `clear_sick_leave_data`, `reset_demo_data`

(All of these already enforce role/identity checks internally.)

### REVOKE EXECUTE from `public`, `anon`, `authenticated` (≈55 funcs)

Trigger / event-trigger functions:
`handle_assignment_updated_at`, `handle_new_user`, `log_assignment_deletion`, `update_modified_column`, `update_updated_at_column`, `validate_assignment_times`, `validate_duty_assignment`, `validate_vacation_dates`, `security_audit_trigger`, `rls_auto_enable`, `auto_apply_rls_to_log_partitions`, `apply_logs_rls_policies`

Logging helpers (only called from inside other definer functions):
`add_system_log`, `log_data_access_attempt`, `log_data_fetch_error_safe`, `log_profile_access_attempt`, `log_realtime_change_throttled`, `log_security_event`, `log_security_event_optimized`, `log_security_event_safe`, `log_unauthorized_car_access`, `log_vacation_security_event`

Maintenance / cron / admin-only utilities:
`cleanup_demo_data_ttl`, `cleanup_expired_temporary_users`, `cleanup_old_change_logs`, `create_logs_partition_for_month`, `delete_expired_approved_vacations`, `delete_old_rejected_vacations`, `emergency_log_cleanup`, `ensure_logs_rls_consistency`, `perform_database_maintenance`, `refresh_materialized_views`, `run_automated_maintenance`, `run_logs_rls_maintenance`, `set_temporary_user_expiration`, `sync_user_roles_to_jwt`

Diagnostics / health / verification (admin-only, should not be callable by any signed-in user):
`check_data_access_health`, `check_rate_limit_security`, `check_system_health`, `debug_auth_info`, `enhanced_security_monitor`, `get_enhanced_system_metrics`, `get_security_events_summary`, `security_health_check`, `verify_complete_fix`, `verify_data_access_fix`, `verify_policy_fix`, `verify_role_assignments`, `validate_input_security`

Internal helper:
`get_car_with_conditional_access(cars)` — only called by `get_cars_with_security`.

## Implementation

A single migration will:
1. Issue `REVOKE EXECUTE ON FUNCTION public.<fn>(<args>) FROM PUBLIC, anon, authenticated;` for each function in the revoke list.
2. Re-`GRANT EXECUTE ... TO authenticated` is **not** needed for the keep list (default grants remain).
3. Update `CHANGELOG.md` and `docs/technical-specs` security note.
4. Update security memory documenting the new posture: definer functions are private by default; only the listed RPCs are callable.

## Verification
After migration, re-run the security scanner — the 82 findings should drop to ~30 (the intentional RPCs + RLS helpers). Then mark those remaining as "ignored — intentional" with rationale in the security memory.

## Open question
Two functions are ambiguous and worth confirming before the revoke:
- `clear_sick_leave_data` — internally checks `is_admin_user()`. Called from the admin UI via RPC? If yes, keep. If invoked only by cron/edge function, revoke.
- `reset_demo_data` — same situation; internally restricted to demo. Keep callable if the demo UI calls it directly.

I will assume **both stay callable** unless you say otherwise.
