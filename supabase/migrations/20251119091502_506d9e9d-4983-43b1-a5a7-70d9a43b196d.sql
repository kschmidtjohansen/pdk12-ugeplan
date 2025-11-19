-- Fix search_path security issue for demo.log_assignment_change function
CREATE OR REPLACE FUNCTION demo.log_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name text;
  v_first_name text;
BEGIN
  -- Get user name and first name
  SELECT name, split_part(name, ' ', 1)
  INTO v_user_name, v_first_name
  FROM demo.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO demo.planner_change_log (
      assignment_id,
      operation,
      changed_by,
      changed_by_name,
      changed_by_first_name,
      change_details
    ) VALUES (
      NEW.id,
      'CREATE',
      auth.uid(),
      COALESCE(v_user_name, 'Unknown'),
      v_first_name,
      jsonb_build_object(
        'case_number', NEW.case_number,
        'title', NEW.title,
        'date', NEW.assignment_date
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO demo.planner_change_log (
      assignment_id,
      operation,
      changed_by,
      changed_by_name,
      changed_by_first_name,
      change_details
    ) VALUES (
      NEW.id,
      CASE WHEN OLD.published = false AND NEW.published = true THEN 'PUBLISH' ELSE 'UPDATE' END,
      auth.uid(),
      COALESCE(v_user_name, 'Unknown'),
      v_first_name,
      jsonb_build_object(
        'case_number', NEW.case_number,
        'title', NEW.title,
        'date', NEW.assignment_date,
        'published', NEW.published
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO demo.planner_change_log (
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
      COALESCE(v_user_name, 'Unknown'),
      v_first_name,
      jsonb_build_object(
        'case_number', OLD.case_number,
        'title', OLD.title,
        'date', OLD.assignment_date
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = demo, public;