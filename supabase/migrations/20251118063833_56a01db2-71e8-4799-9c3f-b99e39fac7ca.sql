-- Add first name column to planner_change_log
ALTER TABLE planner_change_log 
ADD COLUMN IF NOT EXISTS changed_by_first_name text;

-- Update existing records to populate first names from full names
UPDATE planner_change_log 
SET changed_by_first_name = SPLIT_PART(changed_by_name, ' ', 1)
WHERE changed_by_first_name IS NULL;

-- Create function to cleanup old change logs (30 days retention)
CREATE OR REPLACE FUNCTION cleanup_old_change_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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