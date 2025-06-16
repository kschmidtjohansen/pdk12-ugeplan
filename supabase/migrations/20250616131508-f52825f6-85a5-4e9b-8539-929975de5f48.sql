
-- Phase 1: Comprehensive Database Cleanup and Policy Standardization
-- This migration will clean up duplicate policies and recreate them properly

-- First, drop ALL existing RLS policies systematically to clean up duplicates
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on vacations table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'vacations' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.vacations';
    END LOOP;
    
    -- Drop all policies on assignments table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'assignments' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.assignments';
    END LOOP;
    
    -- Drop all policies on assignments_employees table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'assignments_employees' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.assignments_employees';
    END LOOP;
    
    -- Drop all policies on cars table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'cars' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.cars';
    END LOOP;
    
    -- Drop all policies on user_roles table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.user_roles';
    END LOOP;
    
    -- Drop all policies on notifications table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.notifications';
    END LOOP;
    
    -- Drop all policies on profiles table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
    END LOOP;
    
    -- Drop all policies on logs table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'logs' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.logs';
    END LOOP;
    
    -- Drop all policies on system_cleanup_tracking table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'system_cleanup_tracking' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.system_cleanup_tracking';
    END LOOP;
END $$;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_cleanup_tracking ENABLE ROW LEVEL SECURITY;

-- Create optimized and standardized RLS policies

-- VACATIONS TABLE POLICIES
CREATE POLICY "vacation_select_policy"
ON public.vacations FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "vacation_insert_policy"
ON public.vacations FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "vacation_update_policy"
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

CREATE POLICY "vacation_delete_policy"
ON public.vacations FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

-- ASSIGNMENTS TABLE POLICIES
CREATE POLICY "assignment_select_policy"
ON public.assignments FOR SELECT
TO authenticated
USING (
  public.is_admin_or_skadeleder() 
  OR public.can_user_access_assignment(id, auth.uid())
);

CREATE POLICY "assignment_insert_policy"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_skadeleder());

CREATE POLICY "assignment_update_policy"
ON public.assignments FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_skadeleder()
  OR responsible_user_id = auth.uid()
)
WITH CHECK (
  public.is_admin_or_skadeleder()
  OR responsible_user_id = auth.uid()
);

CREATE POLICY "assignment_delete_policy"
ON public.assignments FOR DELETE
TO authenticated
USING (public.is_admin_or_skadeleder());

-- ASSIGNMENTS_EMPLOYEES TABLE POLICIES
CREATE POLICY "assignment_employee_select_policy"
ON public.assignments_employees FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "assignment_employee_manage_policy"
ON public.assignments_employees FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- CARS TABLE POLICIES
CREATE POLICY "car_select_policy"
ON public.cars FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "car_manage_policy"
ON public.cars FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- USER_ROLES TABLE POLICIES
CREATE POLICY "user_role_select_policy"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_user()
);

CREATE POLICY "user_role_manage_policy"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "notification_select_policy"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notification_insert_policy"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "notification_update_policy"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_delete_policy"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- PROFILES TABLE POLICIES
CREATE POLICY "profile_select_policy"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profile_update_own_policy"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profile_admin_manage_policy"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- LOGS TABLE POLICIES
CREATE POLICY "log_select_policy"
ON public.logs FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "log_insert_policy"
ON public.logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- SYSTEM_CLEANUP_TRACKING TABLE POLICIES
CREATE POLICY "cleanup_tracking_policy"
ON public.system_cleanup_tracking FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Create or replace enhanced security functions
CREATE OR REPLACE FUNCTION public.validate_email_format_enhanced(email text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
BEGIN
  IF email IS NULL OR length(email) = 0 OR length(email) > 255 THEN
    RETURN false;
  END IF;
  
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
    AND email NOT LIKE '%..'
    AND email NOT LIKE '.%'
    AND email NOT LIKE '%.'
    AND position('@' in email) > 1
    AND length(email) - position('@' in reverse(email)) > 3;
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_text_input(input_text text, max_length integer DEFAULT 1000)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potential XSS patterns and limit length
  RETURN left(
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(input_text, '[<>]', '', 'g'),
            'javascript:', '', 'gi'
          ),
          'on\w+\s*=', '', 'gi'
        ),
        'data:', '', 'gi'
      )
    ),
    max_length
  );
END;
$$;

-- Enhanced security logging with better error handling
CREATE OR REPLACE FUNCTION public.log_security_event_safe(
  event_type text,
  event_message text,
  event_details jsonb DEFAULT NULL,
  severity text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  enriched_details jsonb;
BEGIN
  -- Safely get current user
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;
  
  -- Build enriched details safely
  enriched_details := COALESCE(event_details, '{}'::jsonb);
  
  BEGIN
    enriched_details := enriched_details || jsonb_build_object(
      'user_id', current_user_id,
      'timestamp', now(),
      'severity', severity
    );
  EXCEPTION WHEN OTHERS THEN
    -- If JSON building fails, use basic details
    enriched_details := jsonb_build_object(
      'user_id', current_user_id,
      'timestamp', now(),
      'severity', severity,
      'original_details_error', 'Failed to merge details'
    );
  END;
  
  -- Insert log with error handling
  BEGIN
    INSERT INTO public.logs (event_type, message, details)
    VALUES (
      coalesce(sanitize_text_input(event_type, 100), 'unknown'),
      coalesce(sanitize_text_input(event_message, 1000), 'No message'),
      enriched_details
    );
  EXCEPTION WHEN OTHERS THEN
    -- Last resort: try to log the failure
    BEGIN
      INSERT INTO public.logs (event_type, message, details)
      VALUES (
        'logging_error',
        'Failed to log security event: ' || SQLERRM,
        jsonb_build_object('error', SQLERRM, 'original_event_type', event_type)
      );
    EXCEPTION WHEN OTHERS THEN
      -- If even this fails, give up silently
      NULL;
    END;
  END;
END;
$$;

-- Update existing functions to use safer logging
CREATE OR REPLACE FUNCTION public.delete_old_rejected_vacations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rejected_deleted_count INTEGER := 0;
  expired_deleted_count INTEGER := 0;
BEGIN
  -- Delete rejected vacation requests where the updated_at timestamp is more than 14 days old
  DELETE FROM public.vacations
  WHERE 
    status = 'rejected'
    AND updated_at < (NOW() - INTERVAL '14 days');
  
  GET DIAGNOSTICS rejected_deleted_count = ROW_COUNT;
  
  -- Delete expired approved vacation requests
  DELETE FROM public.vacations
  WHERE 
    status = 'approved'
    AND end_date < CURRENT_DATE;
  
  GET DIAGNOSTICS expired_deleted_count = ROW_COUNT;
  
  -- Use safe logging
  PERFORM public.log_security_event_safe(
    'vacation_cleanup_combined',
    format('Deleted %s old rejected requests and %s expired approved requests', 
           rejected_deleted_count, expired_deleted_count),
    jsonb_build_object(
      'rejected_deleted_count', rejected_deleted_count, 
      'expired_deleted_count', expired_deleted_count,
      'cleanup_type', 'automated'
    ),
    'info'
  );
END;
$$;

-- Add performance indexes for RLS policy optimization
CREATE INDEX IF NOT EXISTS idx_vacations_user_id ON public.vacations (user_id);
CREATE INDEX IF NOT EXISTS idx_vacations_status ON public.vacations (status);
CREATE INDEX IF NOT EXISTS idx_assignments_responsible_user_id ON public.assignments (responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employees_user_id ON public.assignments_employees (user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employees_assignment_id ON public.assignments_employees (assignment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications (read);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles (id);
CREATE INDEX IF NOT EXISTS idx_logs_event_type ON public.logs (event_type);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs (created_at);

-- Create a function to validate system health
CREATE OR REPLACE FUNCTION public.check_system_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  policy_count integer;
  function_count integer;
  table_count integer;
  result jsonb;
BEGIN
  -- Count policies
  SELECT count(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  
  -- Count custom functions
  SELECT count(*) INTO function_count FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid 
  WHERE n.nspname = 'public' AND p.prokind = 'f';
  
  -- Count tables
  SELECT count(*) INTO table_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  result := jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'policy_count', policy_count,
    'function_count', function_count,
    'table_count', table_count,
    'rls_enabled_tables', (
      SELECT count(*) FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
    )
  );
  
  RETURN result;
END;
$$;
