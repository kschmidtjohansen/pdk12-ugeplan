-- Phase 1: Index Cleanup and Optimization
-- Remove redundant indexes and optimize database performance

-- 1. First, let's see what indexes we currently have and remove redundant ones
-- Remove duplicate indexes that may have been created by multiple constraints

-- Drop old redundant indexes from foreign key constraints (if they exist)
DROP INDEX IF EXISTS idx_assignments_car_id;
DROP INDEX IF EXISTS idx_assignments_responsible_user_id;
DROP INDEX IF EXISTS idx_assignments_employees_assignment_id;
DROP INDEX IF EXISTS idx_assignments_employees_user_id;
DROP INDEX IF EXISTS idx_user_roles_user_id;
DROP INDEX IF EXISTS idx_profiles_user_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_vacations_user_id;

-- Drop any duplicate unique indexes
DROP INDEX IF EXISTS assignments_car_id_idx;
DROP INDEX IF EXISTS assignments_responsible_user_id_idx;
DROP INDEX IF EXISTS assignments_employees_assignment_id_idx;
DROP INDEX IF EXISTS assignments_employees_user_id_idx;

-- 2. Create optimal composite indexes for common query patterns
-- Assignments table - optimized for date and status queries
CREATE INDEX IF NOT EXISTS idx_assignments_date_published_optimized ON public.assignments (assignment_date DESC, published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_assignments_responsible_date ON public.assignments (responsible_user_id, assignment_date DESC) WHERE responsible_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_car_date_optimized ON public.assignments (car_id, assignment_date DESC) WHERE car_id IS NOT NULL;

-- Assignments_employees table - optimized for lookups
CREATE INDEX IF NOT EXISTS idx_assignments_employees_user_assignment ON public.assignments_employees (user_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employees_assignment_user ON public.assignments_employees (assignment_id, user_id);

-- User_roles table - optimized for role checking
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role_optimized ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_users ON public.user_roles (role, user_id);

-- Profiles table - optimized for employee queries
CREATE INDEX IF NOT EXISTS idx_profiles_status_name_optimized ON public.profiles (status, name) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email)) WHERE email IS NOT NULL;

-- Notifications table - optimized for user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread_user ON public.notifications (user_id, created_at DESC) WHERE read = false;

-- Vacations table - optimized for date range queries
CREATE INDEX IF NOT EXISTS idx_vacations_user_status_dates ON public.vacations (user_id, status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vacations_date_range_status ON public.vacations (start_date, end_date, status);
CREATE INDEX IF NOT EXISTS idx_vacations_status_dates ON public.vacations (status, start_date DESC) WHERE status IN ('pending', 'approved');

-- Cars table - optimized for availability queries
CREATE INDEX IF NOT EXISTS idx_cars_available_name ON public.cars (is_available, name) WHERE is_available = true;

-- Logs table - optimized for admin queries
CREATE INDEX IF NOT EXISTS idx_logs_type_created_desc ON public.logs (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_created_type ON public.logs (created_at DESC, event_type);

-- 3. Remove old less optimal indexes that are now covered by composite ones
DROP INDEX IF EXISTS idx_assignments_date;
DROP INDEX IF EXISTS idx_assignments_published;
DROP INDEX IF EXISTS idx_assignments_responsible;
DROP INDEX IF EXISTS idx_profiles_status;
DROP INDEX IF EXISTS idx_profiles_name;
DROP INDEX IF EXISTS idx_user_roles_role;
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_vacations_user;
DROP INDEX IF EXISTS idx_vacations_status;
DROP INDEX IF EXISTS idx_vacations_dates;
DROP INDEX IF EXISTS idx_logs_type;
DROP INDEX IF EXISTS idx_logs_created;

-- 4. Add missing unique constraints where needed
-- Ensure email uniqueness in profiles (if not already enforced)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique_constraint ON public.profiles (email) WHERE email IS NOT NULL;

-- Ensure user_id uniqueness in profiles (if not already enforced)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique ON public.profiles (id);

-- 5. Update table statistics for better query planning
ANALYZE public.assignments;
ANALYZE public.assignments_employees;
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.notifications;
ANALYZE public.vacations;
ANALYZE public.cars;
ANALYZE public.logs;

-- 6. Log the phase 1 completion
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'database_optimization_phase1',
  'Phase 1: Index cleanup and optimization completed',
  jsonb_build_object(
    'phase', 1,
    'action', 'index_optimization',
    'indexes_removed', 'redundant and duplicate indexes',
    'indexes_added', 'optimized composite indexes',
    'tables_analyzed', ARRAY['assignments', 'assignments_employees', 'profiles', 'user_roles', 'notifications', 'vacations', 'cars', 'logs'],
    'timestamp', now()
  )
);