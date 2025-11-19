-- Function to log assignment deletions automatically
CREATE OR REPLACE FUNCTION public.log_assignment_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_name TEXT;
  user_first_name TEXT;
BEGIN
  -- Get user's name and first name
  SELECT name, SPLIT_PART(name, ' ', 1) 
  INTO user_name, user_first_name
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Insert deletion log entry
  INSERT INTO public.planner_change_log (
    assignment_id,
    operation,
    changed_by,
    changed_by_name,
    changed_by_first_name,
    change_details
  ) VALUES (
    OLD.id,
    'DELETE',
    auth.uid(),
    COALESCE(user_name, 'Unknown User'),
    COALESCE(user_first_name, 'Unknown'),
    jsonb_build_object(
      'operation', 'DELETE',
      'title', OLD.title,
      'date', OLD.assignment_date,
      'location', OLD.location,
      'case_number', OLD.case_number
    )
  );
  
  RETURN OLD;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS assignment_deletion_logger ON public.assignments;

-- Create trigger that fires before deletion
CREATE TRIGGER assignment_deletion_logger
  BEFORE DELETE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assignment_deletion();