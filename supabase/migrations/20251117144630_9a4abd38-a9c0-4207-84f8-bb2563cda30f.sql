-- Create planner_change_log table to track all changes made in the planner
CREATE TABLE planner_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH')),
  changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  changed_by_name TEXT NOT NULL,
  change_details JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX idx_planner_log_created ON planner_change_log(created_at DESC);
CREATE INDEX idx_planner_log_assignment ON planner_change_log(assignment_id);

-- Enable RLS
ALTER TABLE planner_change_log ENABLE ROW LEVEL SECURITY;

-- Only admin and skadeleder can view logs
CREATE POLICY "Admin and Skadeleder can view logs"
  ON planner_change_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'skadeleder')
    )
  );

-- Service role can insert logs
CREATE POLICY "Authenticated users can insert logs"
  ON planner_change_log
  FOR INSERT
  WITH CHECK (changed_by = auth.uid());