-- Phase 3: Performance Tuning
-- Optimize query performance and clean up database objects

-- 1. Update table statistics for optimal query planning
ANALYZE public.assignments;
ANALYZE public.assignments_employees;
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.notifications;
ANALYZE public.vacations;
ANALYZE public.cars;
ANALYZE public.logs;
ANALYZE public.system_cleanup_tracking;

-- 2. Vacuum tables to reclaim space and update statistics
VACUUM ANALYZE public.assignments;
VACUUM ANALYZE public.assignments_employees;
VACUUM ANALYZE public.profiles;
VACUUM ANALYZE public.user_roles;
VACUUM ANALYZE public.notifications;
VACUUM ANALYZE public.vacations;
VACUUM ANALYZE public.cars;
VACUUM ANALYZE public.logs;

-- 3. Create materialized views for complex queries (if beneficial)
-- Create a materialized view for active employees with their roles
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_active_employees AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.phone,
  p.job_title,
  p.status,
  ur.role,
  p.avatar_url,
  p.updated_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.status = 'active'
ORDER BY p.name;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_active_employees_id ON public.mv_active_employees (id);
CREATE INDEX IF NOT EXISTS idx_mv_active_employees_role ON public.mv_active_employees (role);

-- Create a materialized view for assignment statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_assignment_stats AS
SELECT 
  DATE_TRUNC('month', assignment_date) as month,
  COUNT(*) as total_assignments,
  COUNT(*) FILTER (WHERE published = true) as published_assignments,
  COUNT(DISTINCT responsible_user_id) FILTER (WHERE responsible_user_id IS NOT NULL) as unique_responsible_users,
  COUNT(DISTINCT car_id) FILTER (WHERE car_id IS NOT NULL) as unique_cars_used
FROM public.assignments
GROUP BY DATE_TRUNC('month', assignment_date)
ORDER BY month DESC;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_assignment_stats_month ON public.mv_assignment_stats (month);

-- 4. Optimize RLS policies by creating helper functions for common checks
-- Function to check if user can view assignments (optimized)
CREATE OR REPLACE FUNCTION public.can_view_assignment_optimized(assignment_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Use EXISTS for better performance than JOIN
  SELECT (
    -- Check if user is admin/skadeleder (most common case first)
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = can_view_assignment_optimized.user_id 
      AND role IN ('administrator', 'skadeleder')
      LIMIT 1
    )
    OR 
    -- Check if user is assigned to the assignment
    EXISTS (
      SELECT 1 FROM public.assignments_employees 
      WHERE assignments_employees.assignment_id = can_view_assignment_optimized.assignment_id 
      AND assignments_employees.user_id = can_view_assignment_optimized.user_id
      LIMIT 1
    )
    OR
    -- Check if user is responsible for the assignment
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE assignments.id = can_view_assignment_optimized.assignment_id
      AND assignments.responsible_user_id = can_view_assignment_optimized.user_id
      LIMIT 1
    )
  );
$$;

-- 5. Create function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_active_employees;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_assignment_stats;
  
  -- Log the refresh
  INSERT INTO public.logs (event_type, message, details)
  VALUES (
    'materialized_views_refreshed',
    'Materialized views refreshed successfully',
    jsonb_build_object(
      'views_refreshed', ARRAY['mv_active_employees', 'mv_assignment_stats'],
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- If concurrent refresh fails, try regular refresh
  BEGIN
    REFRESH MATERIALIZED VIEW public.mv_active_employees;
    REFRESH MATERIALIZED VIEW public.mv_assignment_stats;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the function
    INSERT INTO public.logs (event_type, message, details)
    VALUES (
      'materialized_views_refresh_error',
      'Failed to refresh materialized views: ' || SQLERRM,
      jsonb_build_object('error', SQLERRM, 'timestamp', now())
    );
  END;
END;
$$;

-- 6. Create indexes for better performance on frequently queried combinations
-- Index for assignment lookups by date range and user
CREATE INDEX IF NOT EXISTS idx_assignments_date_range_user ON public.assignments (assignment_date, responsible_user_id) 
WHERE responsible_user_id IS NOT NULL AND published = true;

-- Index for vacation lookups by status and date
CREATE INDEX IF NOT EXISTS idx_vacations_status_date_user ON public.vacations (status, start_date, user_id)
WHERE status IN ('pending', 'approved');

-- Index for notifications by user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, created_at DESC)
WHERE read = false;

-- 7. Clean up any orphaned sequences or unused objects
-- Check for sequences that might not be in use
DO $$
DECLARE
  seq_record RECORD;
BEGIN
  -- This will log any sequences that might need attention
  FOR seq_record IN 
    SELECT schemaname, sequencename 
    FROM pg_sequences 
    WHERE schemaname = 'public'
  LOOP
    INSERT INTO public.logs (event_type, message, details)
    VALUES (
      'sequence_audit',
      'Found sequence: ' || seq_record.schemaname || '.' || seq_record.sequencename,
      jsonb_build_object(
        'schema', seq_record.schemaname,
        'sequence', seq_record.sequencename,
        'timestamp', now()
      )
    );
  END LOOP;
END $$;

-- 8. Log the phase 3 completion
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'database_optimization_phase3',
  'Phase 3: Performance tuning completed',
  jsonb_build_object(
    'phase', 3,
    'action', 'performance_tuning',
    'optimizations', jsonb_build_object(
      'tables_analyzed', ARRAY['assignments', 'assignments_employees', 'profiles', 'user_roles', 'notifications', 'vacations', 'cars', 'logs'],
      'materialized_views_created', ARRAY['mv_active_employees', 'mv_assignment_stats'],
      'performance_indexes_added', 'date_range_user, status_date_user, user_unread',
      'helper_functions_created', 'can_view_assignment_optimized, refresh_materialized_views'
    ),
    'timestamp', now()
  )
);