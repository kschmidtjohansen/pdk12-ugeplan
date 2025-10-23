-- Create demo schema with persistent baseline data
CREATE SCHEMA IF NOT EXISTS demo;

-- Clone table structures from public to demo
CREATE TABLE demo.profiles (LIKE public.profiles INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE demo.user_roles (LIKE public.user_roles INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE demo.assignments (LIKE public.assignments INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE demo.assignments_employees (LIKE public.assignments_employees INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE demo.cars (LIKE public.cars INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE demo.warehouse_items (LIKE public.warehouse_items INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE demo.notifications (LIKE public.notifications INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE demo.vacations (LIKE public.vacations INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);

-- Enable RLS on demo tables
ALTER TABLE demo.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo.assignments_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo.warehouse_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo.vacations ENABLE ROW LEVEL SECURITY;

-- Copy RLS policies from public schema to demo schema
-- Profiles policies
CREATE POLICY "Users can view all profiles" ON demo.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON demo.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON demo.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Anyone can view user roles" ON demo.user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can modify user roles" ON demo.user_roles FOR ALL USING (public.is_admin_user());

-- Assignments policies
CREATE POLICY "Users can view accessible assignments" ON demo.assignments FOR SELECT USING (public.can_view_assignment_optimized(id, auth.uid()));
CREATE POLICY "Admins can insert assignments" ON demo.assignments FOR INSERT WITH CHECK (public.is_admin_user() OR public.get_current_user_role() = 'skadeleder');
CREATE POLICY "Admins can update assignments" ON demo.assignments FOR UPDATE USING (public.is_admin_user() OR public.get_current_user_role() = 'skadeleder');
CREATE POLICY "Admins can delete assignments" ON demo.assignments FOR DELETE USING (public.is_admin_user() OR public.get_current_user_role() = 'skadeleder');

-- Assignments employees policies
CREATE POLICY "Users can view their assignments" ON demo.assignments_employees FOR SELECT USING (user_id = auth.uid() OR public.is_admin_user());
CREATE POLICY "Admins can manage assignments" ON demo.assignments_employees FOR ALL USING (public.is_admin_user() OR public.get_current_user_role() = 'skadeleder');

-- Cars policies
CREATE POLICY "Users can view all cars" ON demo.cars FOR SELECT USING (true);
CREATE POLICY "Admins can manage cars" ON demo.cars FOR ALL USING (public.is_admin_user() OR public.get_current_user_role() = 'skadeleder');

-- Warehouse policies
CREATE POLICY "Users can view all warehouse items" ON demo.warehouse_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage warehouse items" ON demo.warehouse_items FOR ALL USING (public.is_admin_user() OR public.get_current_user_role() = 'skadeleder');

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON demo.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their notifications" ON demo.notifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON demo.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their notifications" ON demo.notifications FOR DELETE USING (user_id = auth.uid());

-- Vacations policies
CREATE POLICY "Users can view accessible vacations" ON demo.vacations FOR SELECT USING (user_id = auth.uid() OR public.is_admin_user() OR public.get_current_user_role() = 'skadeleder');
CREATE POLICY "Users can create vacation requests" ON demo.vacations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own vacation requests" ON demo.vacations FOR UPDATE USING (user_id = auth.uid() OR public.is_admin_user() OR public.get_current_user_role() = 'skadeleder');
CREATE POLICY "Users can delete own vacation requests" ON demo.vacations FOR DELETE USING (user_id = auth.uid() OR public.is_admin_user());

-- Insert BASELINE DATA (fixed timestamp for persistence)
-- Demo user profile
INSERT INTO demo.profiles (id, name, email, job_title, status, created_at, updated_at)
VALUES 
  ('165cdbc9-6722-4c96-97d2-1a87185c8133', 'Demo Bruger', 'test@polygongroup.com', 'Administrator', 'active', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00');

-- Demo user role
INSERT INTO demo.user_roles (user_id, role, created_at, updated_at)
VALUES 
  ('165cdbc9-6722-4c96-97d2-1a87185c8133', 'administrator', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00');

-- Copy cars from public to demo (baseline)
INSERT INTO demo.cars 
SELECT * FROM public.cars;
UPDATE demo.cars SET created_at = '2024-01-01 00:00:00+00', updated_at = '2024-01-01 00:00:00+00';

-- Copy warehouse items from public to demo (baseline)
INSERT INTO demo.warehouse_items 
SELECT * FROM public.warehouse_items WHERE TRUE;
UPDATE demo.warehouse_items SET created_at = '2024-01-01 00:00:00+00', updated_at = '2024-01-01 00:00:00+00';

-- Function to clean up ONLY session-created data (preserving baseline)
CREATE OR REPLACE FUNCTION demo.cleanup_session_data(baseline_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS TABLE(deleted_assignments INT, deleted_notifications INT, deleted_vacations INT, deleted_warehouse INT) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  del_assignments INT;
  del_notifications INT;
  del_vacations INT;
  del_warehouse INT;
BEGIN
  -- Delete only records created AFTER baseline timestamp
  DELETE FROM demo.assignments WHERE created_at > baseline_timestamp;
  GET DIAGNOSTICS del_assignments = ROW_COUNT;
  
  -- Delete assignment-employee relationships for deleted assignments
  DELETE FROM demo.assignments_employees 
  WHERE assignment_id NOT IN (SELECT id FROM demo.assignments);
  
  DELETE FROM demo.notifications WHERE created_at > baseline_timestamp;
  GET DIAGNOSTICS del_notifications = ROW_COUNT;
  
  DELETE FROM demo.vacations WHERE created_at > baseline_timestamp;
  GET DIAGNOSTICS del_vacations = ROW_COUNT;
  
  DELETE FROM demo.warehouse_items WHERE created_at > baseline_timestamp;
  GET DIAGNOSTICS del_warehouse = ROW_COUNT;
  
  -- Reset any modified baseline data (updates to cars, profiles, etc.)
  UPDATE demo.cars SET 
    is_available = true,
    updated_at = baseline_timestamp
  WHERE updated_at > baseline_timestamp;
  
  UPDATE demo.profiles SET
    updated_at = baseline_timestamp
  WHERE updated_at > baseline_timestamp AND id != '165cdbc9-6722-4c96-97d2-1a87185c8133';
  
  RETURN QUERY SELECT del_assignments, del_notifications, del_vacations, del_warehouse;
END;
$$;