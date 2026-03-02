-- Fix on_call_duties: replace inline role check with is_admin_or_skadeleder() (includes super_admin)
DROP POLICY IF EXISTS "Admin and skadeleder can manage all duties" ON on_call_duties;
CREATE POLICY "Admin and skadeleder can manage all duties" ON on_call_duties
  FOR ALL TO authenticated
  USING (is_admin_or_skadeleder())
  WITH CHECK (is_admin_or_skadeleder());

-- Fix planner_change_log: replace inline role check with is_admin_or_skadeleder()
DROP POLICY IF EXISTS "Admin and Skadeleder can view logs" ON planner_change_log;
CREATE POLICY "Admin and Skadeleder can view logs" ON planner_change_log
  FOR SELECT TO authenticated
  USING (is_admin_or_skadeleder());