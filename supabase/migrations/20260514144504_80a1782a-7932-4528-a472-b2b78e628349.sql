-- Fase 5: Database & RLS audit cleanup
-- Removes performance-killing logging-in-RLS and duplicate policies.
-- Functional access is unchanged — surviving policies cover the same matrix.

-- 1) assignments: drop SELECT policy that calls log_security_event_safe() on every row.
--    Equivalent access already provided by "Users can view accessible assignments"
--    which uses can_view_assignment_optimized().
DROP POLICY IF EXISTS "assignments_restricted_access" ON public.assignments;

-- 2) notifications: drop SELECT policy that logs on every row.
--    Equivalent access already provided by "Users can view their notifications".
DROP POLICY IF EXISTS "notifications_owner_only" ON public.notifications;

-- 3) notifications: drop duplicated DELETE policy.
--    "Users can delete their notifications" already enforces the same rule.
DROP POLICY IF EXISTS "notification_delete_policy" ON public.notifications;

-- 4) notifications: drop duplicated UPDATE policy.
--    "Users can update their notifications" already enforces the same rule.
DROP POLICY IF EXISTS "notification_update_policy" ON public.notifications;

-- 5) cars: tighten role scope from {public} to {authenticated} for consistency
--    with all other authed-only SELECT policies in the schema.
--    The qual already required auth.uid() IS NOT NULL, so behaviour is unchanged.
DROP POLICY IF EXISTS "cars_select" ON public.cars;
CREATE POLICY "cars_select"
  ON public.cars
  FOR SELECT
  TO authenticated
  USING (true);