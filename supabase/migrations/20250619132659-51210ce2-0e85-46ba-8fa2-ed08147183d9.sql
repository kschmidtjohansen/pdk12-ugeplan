
-- Critical Security Fix: Add Row Level Security to logs table
-- This prevents unauthorized access to system logs

-- Enable RLS on logs table (if not already enabled)
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Drop any existing log policies to avoid conflicts
DROP POLICY IF EXISTS "log_select_policy" ON public.logs;
DROP POLICY IF EXISTS "log_insert_policy" ON public.logs;
DROP POLICY IF EXISTS "log_update_policy" ON public.logs;
DROP POLICY IF EXISTS "log_delete_policy" ON public.logs;

-- Create admin-only access policy for viewing logs
CREATE POLICY "log_admin_select_policy"
ON public.logs FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- Allow system to insert logs (for security events, etc.)
CREATE POLICY "log_system_insert_policy"
ON public.logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only admins can update or delete logs
CREATE POLICY "log_admin_manage_policy"
ON public.logs FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Add index for performance on admin log queries
CREATE INDEX IF NOT EXISTS idx_logs_created_at_event_type ON public.logs (created_at DESC, event_type);
