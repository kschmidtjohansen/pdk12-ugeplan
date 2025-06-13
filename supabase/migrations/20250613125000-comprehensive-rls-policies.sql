
-- Comprehensive RLS Policy Implementation
-- This migration adds proper Row Level Security policies to all tables

-- Enable RLS on all tables that don't have it yet
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.assignments;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.assignments;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.assignments;

-- Assignments table policies
CREATE POLICY "Admins and skadeleder can view all assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (public.is_admin_or_skadeleder());

CREATE POLICY "Servicemedarbejder can view published assignments and own assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (
  published = true 
  OR public.is_admin_or_skadeleder()
  OR responsible_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.assignments_employees 
    WHERE assignment_id = assignments.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins and skadeleder can manage assignments"
ON public.assignments FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- Assignments_employees table policies
CREATE POLICY "Users can view assignment relationships"
ON public.assignments_employees FOR SELECT
TO authenticated
USING (
  public.is_admin_or_skadeleder() 
  OR user_id = auth.uid()
);

CREATE POLICY "Admins and skadeleder can manage assignment relationships"
ON public.assignments_employees FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- Cars table policies
CREATE POLICY "All authenticated users can view cars"
ON public.cars FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and skadeleder can manage cars"
ON public.cars FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- User_roles table policies
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_user());

CREATE POLICY "Only admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Notifications table policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
ON public.notifications FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Profiles table policies
CREATE POLICY "All authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Logs table policies (admin only)
CREATE POLICY "Only admins can view logs"
ON public.logs FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "System can create logs"
ON public.logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Vacations table policies
CREATE POLICY "Users can view their own vacations"
ON public.vacations FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_skadeleder());

CREATE POLICY "Users can create their own vacation requests"
ON public.vacations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending vacation requests"
ON public.vacations FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and skadeleder can manage all vacations"
ON public.vacations FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());
