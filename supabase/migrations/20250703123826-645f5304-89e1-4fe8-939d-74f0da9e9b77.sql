-- Phase 2: Consolidate RLS Policies (Performance)
-- Remove old/duplicate RLS policies and keep only the newer function-based ones

-- ASSIGNMENTS TABLE - Remove old policies, keep function-based ones
DROP POLICY IF EXISTS "Only admin can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Only admin can delete assignments" ON public.assignments;
DROP POLICY IF EXISTS "Only admin can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can view relevant assignments, admin can view all" ON public.assignments;

-- Keep: assignment_select_policy, assignment_insert_policy, assignment_update_policy, assignment_delete_policy

-- ASSIGNMENTS_EMPLOYEES TABLE - Remove old policies, keep function-based ones
DROP POLICY IF EXISTS "Only admin can create assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "Only admin can delete assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "Only admin can update assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "Users can view own assignment relationships, admin can view all" ON public.assignments_employees;

-- Keep: assignment_employee_manage_policy, assignment_employee_select_policy

-- CARS TABLE - Remove old policies, keep function-based ones
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Only admin can modify cars" ON public.cars;

-- Keep: car_manage_policy, car_select_policy

-- LOGS TABLE - Remove old policies, keep function-based ones
DROP POLICY IF EXISTS "Only admin can access logs" ON public.logs;

-- Keep: log_admin_manage_policy, log_admin_select_policy, log_system_insert_policy

-- NOTIFICATIONS TABLE - Remove old policies, keep function-based ones
DROP POLICY IF EXISTS "Only admin can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

-- Keep: notification_insert_policy, notification_select_policy, notification_update_policy, notification_delete_policy

-- PROFILES TABLE - Remove old policies, keep function-based ones
DROP POLICY IF EXISTS "Users can update own profile, admin can update any" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile, admin can view all" ON public.profiles;

-- Keep: profile_admin_manage_policy, profile_select_policy, profile_update_own_policy

-- SYSTEM_CLEANUP_TRACKING TABLE - Remove old policies, keep function-based ones
DROP POLICY IF EXISTS "Only admin can access system cleanup tracking" ON public.system_cleanup_tracking;

-- Keep: cleanup_tracking_policy

-- VACATIONS TABLE - Remove old policies, keep function-based ones
DROP POLICY IF EXISTS "Users can create own vacations" ON public.vacations;
DROP POLICY IF EXISTS "Users can delete own pending vacations, admin can delete any" ON public.vacations;
DROP POLICY IF EXISTS "Users can update own pending vacations, admin can update any" ON public.vacations;
DROP POLICY IF EXISTS "Users can view own vacations, admin can view all" ON public.vacations;

-- Keep: vacation_insert_policy, vacation_select_policy, vacation_update_policy, vacation_delete_policy

-- Log the policy cleanup
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'policy_cleanup_phase2',
  'Phase 2: Consolidated RLS policies - removed old duplicate policies, kept function-based ones',
  jsonb_build_object(
    'phase', 2,
    'action', 'policy_consolidation',
    'timestamp', now()
  )
);