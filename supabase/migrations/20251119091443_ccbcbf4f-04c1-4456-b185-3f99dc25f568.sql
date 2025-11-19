-- Add missing has_asbestos_certificate column to demo.profiles
ALTER TABLE demo.profiles ADD COLUMN IF NOT EXISTS has_asbestos_certificate boolean DEFAULT false;

-- Create demo.planner_change_log table
CREATE TABLE IF NOT EXISTS demo.planner_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES demo.assignments(id) ON DELETE CASCADE,
  operation text NOT NULL,
  changed_by uuid NOT NULL REFERENCES demo.profiles(id),
  changed_by_name text NOT NULL,
  changed_by_first_name text,
  change_details jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_demo_planner_change_log_assignment_id ON demo.planner_change_log(assignment_id);
CREATE INDEX IF NOT EXISTS idx_demo_planner_change_log_created_at ON demo.planner_change_log(created_at DESC);

-- Enable RLS on demo.planner_change_log
ALTER TABLE demo.planner_change_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for demo.planner_change_log
CREATE POLICY "Demo users can view logs" ON demo.planner_change_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM demo.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('administrator', 'skadeleder')
    )
  );

CREATE POLICY "Demo users can insert logs" ON demo.planner_change_log
  FOR INSERT
  WITH CHECK (changed_by = auth.uid());

-- Create function to log demo assignment changes
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on demo.assignments
DROP TRIGGER IF EXISTS log_demo_assignment_changes ON demo.assignments;
CREATE TRIGGER log_demo_assignment_changes
  AFTER INSERT OR UPDATE OR DELETE ON demo.assignments
  FOR EACH ROW
  EXECUTE FUNCTION demo.log_assignment_change();