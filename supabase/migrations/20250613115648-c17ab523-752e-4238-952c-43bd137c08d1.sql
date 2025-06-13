
-- Phase 1 Fix: Properly handle existing policies
-- First, let's get a comprehensive list and drop ALL existing policies systematically

-- Drop ALL existing RLS policies on assignments table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'assignments' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.assignments';
    END LOOP;
END $$;

-- Drop ALL existing RLS policies on assignments_employees table  
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'assignments_employees' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.assignments_employees';
    END LOOP;
END $$;

-- Drop ALL existing RLS policies on profiles table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Drop ALL existing RLS policies on user_roles table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.user_roles';
    END LOOP;
END $$;

-- Drop ALL existing RLS policies on vacations table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'vacations' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.vacations';
    END LOOP;
END $$;

-- Drop ALL existing RLS policies on notifications table  
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.notifications';
    END LOOP;
END $$;

-- Drop ALL existing RLS policies on cars table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'cars' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.cars';
    END LOOP;
END $$;

-- Drop ALL existing RLS policies on logs table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'logs' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.logs';
    END LOOP;
END $$;

-- Drop ALL existing RLS policies on system_cleanup_tracking table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'system_cleanup_tracking' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.system_cleanup_tracking';
    END LOOP;
END $$;

-- Now create the new optimized policies

-- ASSIGNMENTS TABLE - Consolidated policies with better performance
CREATE POLICY "assignments_select_policy"
ON public.assignments FOR SELECT
TO authenticated
USING (
  public.is_admin_or_skadeleder() 
  OR public.can_user_access_assignment(id, auth.uid())
);

CREATE POLICY "assignments_insert_policy"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_skadeleder());

CREATE POLICY "assignments_update_policy"
ON public.assignments FOR UPDATE
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

CREATE POLICY "assignments_delete_policy"
ON public.assignments FOR DELETE
TO authenticated
USING (public.is_admin_or_skadeleder());

-- ASSIGNMENTS_EMPLOYEES TABLE - Simplified policies
CREATE POLICY "assignments_employees_select_policy"
ON public.assignments_employees FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "assignments_employees_all_policy"
ON public.assignments_employees FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- PROFILES TABLE - Fixed policies
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profiles_update_own_policy"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_all_policy"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- USER_ROLES TABLE - Simplified policies
CREATE POLICY "user_roles_select_policy"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "user_roles_admin_all_policy"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- VACATIONS TABLE - Fixed policies with proper permissions
CREATE POLICY "vacations_select_policy"
ON public.vacations FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "vacations_insert_policy"
ON public.vacations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "vacations_update_policy"
ON public.vacations FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid() AND status = 'pending')
  OR public.is_admin_or_skadeleder()
)
WITH CHECK (
  (user_id = auth.uid() AND status = 'pending')
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "vacations_delete_policy"
ON public.vacations FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

-- NOTIFICATIONS TABLE - FIXED policies to resolve RLS violations
CREATE POLICY "notifications_select_policy"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow administrators to create notifications for any user (KEY FIX)
CREATE POLICY "notifications_insert_policy"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "notifications_update_policy"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_policy"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- CARS TABLE - Optimized policies
CREATE POLICY "cars_select_policy"
ON public.cars FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "cars_admin_all_policy"
ON public.cars FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- LOGS TABLE - Admin-only policies
CREATE POLICY "logs_select_policy"
ON public.logs FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "logs_insert_policy"
ON public.logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- SYSTEM_CLEANUP_TRACKING TABLE - Admin-only
CREATE POLICY "system_cleanup_tracking_admin_policy"
ON public.system_cleanup_tracking FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Add critical performance indexes to support RLS policies (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_assignments_responsible_user_id ON public.assignments (responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employees_user_id ON public.assignments_employees (user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employees_assignment_id ON public.assignments_employees (assignment_id);
CREATE INDEX IF NOT EXISTS idx_vacations_user_id ON public.vacations (user_id);
CREATE INDEX IF NOT EXISTS idx_vacations_status ON public.vacations (status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications (read);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles (id);

-- Ensure all tables have RLS enabled
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_cleanup_tracking ENABLE ROW LEVEL SECURITY;
