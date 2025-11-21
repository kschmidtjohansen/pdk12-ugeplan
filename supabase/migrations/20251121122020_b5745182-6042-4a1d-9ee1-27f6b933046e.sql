-- Fix clear_sick_leave_data function to properly handle RLS deletion
-- This allows administrators to clear all sick leave data by temporarily disabling RLS

CREATE OR REPLACE FUNCTION public.clear_sick_leave_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Security check - Only administrators can clear data
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'administrator'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can clear sick leave data';
  END IF;

  -- Count records before deletion
  SELECT COUNT(*) INTO deleted_count 
  FROM public.sick_leave_records;

  -- Temporarily disable RLS for this transaction (safe due to admin check above)
  SET LOCAL row_security = off;

  -- Delete all sick leave records (cascade will delete sick_leave_notifications_sent)
  DELETE FROM public.sick_leave_records;

  -- Re-enable RLS (will happen automatically at end of transaction anyway)
  SET LOCAL row_security = on;

  -- Log the action
  PERFORM public.log_security_event_safe(
    'sick_leave_data_cleared',
    format('Admin cleared all sick leave data (%s records deleted)', deleted_count),
    jsonb_build_object(
      'deleted_count', deleted_count,
      'cleared_by', auth.uid(),
      'timestamp', now()
    ),
    'warning'
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'message', format('Successfully deleted %s sick leave record(s)', deleted_count)
  );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.clear_sick_leave_data() IS 
'Deletes all sick leave records. Only accessible to administrators. Uses row_security = off temporarily within SECURITY DEFINER context after verifying admin status.';