-- Phase 1: Comprehensive Database Optimization - Index Cleanup
-- Remove redundant and duplicate indexes to improve performance

-- Step 1: Remove duplicate indexes that provide no additional benefit
-- These indexes are either redundant or covered by more efficient composite indexes

-- Remove redundant assignment indexes
DROP INDEX IF EXISTS public.idx_assignments_car_date;
DROP INDEX IF EXISTS public.idx_assignments_date;
DROP INDEX IF EXISTS public.idx_assignments_published;
DROP INDEX IF EXISTS public.idx_assignments_responsible;

-- Remove redundant assignment_employees indexes
DROP INDEX IF EXISTS public.idx_assignments_employees_assignment_id;
DROP INDEX IF EXISTS public.idx_assignments_employees_user_id;
DROP INDEX IF EXISTS public.assignments_employees_assignment_id_idx;
DROP INDEX IF EXISTS public.assignments_employees_user_id_idx;

-- Remove redundant profile indexes
DROP INDEX IF EXISTS public.idx_profiles_status;
DROP INDEX IF EXISTS public.idx_profiles_name;
DROP INDEX IF EXISTS public.idx_profiles_user_id_unique;

-- Remove redundant user_roles indexes
DROP INDEX IF EXISTS public.idx_user_roles_user_id;
DROP INDEX IF EXISTS public.idx_user_roles_role;

-- Remove redundant notification indexes
DROP INDEX IF EXISTS public.idx_notifications_user;
DROP INDEX IF EXISTS public.idx_notifications_read;
DROP INDEX IF EXISTS public.idx_notifications_user_read;

-- Remove redundant vacation indexes
DROP INDEX IF EXISTS public.idx_vacations_user;
DROP INDEX IF EXISTS public.idx_vacations_status;
DROP INDEX IF EXISTS public.idx_vacations_dates;
DROP INDEX IF EXISTS public.idx_vacations_user_id_status;

-- Remove redundant car indexes
DROP INDEX IF EXISTS public.idx_cars_availability;

-- Remove redundant log indexes
DROP INDEX IF EXISTS public.idx_logs_type;
DROP INDEX IF EXISTS public.idx_logs_created;
DROP INDEX IF EXISTS public.idx_logs_type_created;
DROP INDEX IF EXISTS public.idx_logs_created_type;

-- Step 2: Ensure we have optimal composite indexes (create if missing)
-- These provide better performance for common query patterns

-- Assignments - optimized for date and published status queries
CREATE INDEX IF NOT EXISTS idx_assignments_date_published_optimal 
ON public.assignments (assignment_date DESC, published) 
WHERE published = true;

-- Assignment employees - optimized for user and assignment lookups
CREATE INDEX IF NOT EXISTS idx_assignments_employees_user_assignment_optimal 
ON public.assignments_employees (user_id, assignment_id);

-- User roles - optimized for role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role_optimal 
ON public.user_roles (user_id, role);

-- Profiles - optimized for active user queries
CREATE INDEX IF NOT EXISTS idx_profiles_status_name_optimal 
ON public.profiles (status, name) 
WHERE status = 'active';

-- Notifications - optimized for unread user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_optimal 
ON public.notifications (user_id, created_at DESC) 
WHERE read = false;

-- Vacations - optimized for user status and date queries
CREATE INDEX IF NOT EXISTS idx_vacations_user_status_dates_optimal 
ON public.vacations (user_id, status, start_date, end_date);

-- Cars - optimized for available car queries
CREATE INDEX IF NOT EXISTS idx_cars_available_name_optimal 
ON public.cars (is_available, name) 
WHERE is_available = true;

-- Logs - optimized for admin queries by type and date
CREATE INDEX IF NOT EXISTS idx_logs_type_created_optimal 
ON public.logs (event_type, created_at DESC);

-- Step 3: Update table statistics for better query planning
ANALYZE public.assignments;
ANALYZE public.assignments_employees;
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.notifications;
ANALYZE public.vacations;
ANALYZE public.cars;
ANALYZE public.logs;

-- Step 4: Set up automated maintenance
-- Create function for regular maintenance tasks
CREATE OR REPLACE FUNCTION public.run_automated_maintenance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  cleaned_logs integer := 0;
BEGIN
  -- Clean up old logs (keep last 1000 entries, but preserve critical security logs)
  DELETE FROM public.logs 
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND event_type NOT IN ('security_error', 'unauthorized_access', 'auth_failure')
    AND id NOT IN (
      SELECT id FROM public.logs 
      ORDER BY created_at DESC 
      LIMIT 1000
    );
  
  GET DIAGNOSTICS cleaned_logs = ROW_COUNT;
  
  -- Refresh materialized views
  PERFORM public.refresh_materialized_views();
  
  -- Update table statistics
  ANALYZE public.assignments;
  ANALYZE public.assignments_employees;
  ANALYZE public.profiles;
  ANALYZE public.user_roles;
  ANALYZE public.notifications;
  ANALYZE public.vacations;
  ANALYZE public.cars;
  ANALYZE public.logs;
  
  result := jsonb_build_object(
    'maintenance_completed', true,
    'logs_cleaned', cleaned_logs,
    'materialized_views_refreshed', true,
    'statistics_updated', true,
    'timestamp', now()
  );
  
  -- Log maintenance completion
  INSERT INTO public.logs (event_type, message, details)
  VALUES (
    'automated_maintenance',
    'Automated maintenance completed successfully',
    result
  );
  
  RETURN result;
END;
$$;

-- Step 5: Log optimization completion
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'database_optimization_phase1_complete',
  'Phase 1: Comprehensive database optimization completed - Removed redundant indexes and optimized query performance',
  jsonb_build_object(
    'phase', 1,
    'action', 'comprehensive_index_optimization',
    'redundant_indexes_removed', 'Multiple duplicate and inefficient indexes',
    'optimal_indexes_created', 'Composite indexes for common query patterns',
    'tables_analyzed', ARRAY['assignments', 'assignments_employees', 'profiles', 'user_roles', 'notifications', 'vacations', 'cars', 'logs'],
    'maintenance_automation', 'Created run_automated_maintenance() function',
    'expected_benefits', ARRAY['Reduced storage usage', 'Improved write performance', 'Simplified maintenance', 'Better query optimization'],
    'timestamp', now()
  )
);