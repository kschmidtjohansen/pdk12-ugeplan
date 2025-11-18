-- Fix search_path for cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_change_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM planner_change_log
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'message', format('Deleted %s change logs older than 30 days', deleted_count)
  );
END;
$$;