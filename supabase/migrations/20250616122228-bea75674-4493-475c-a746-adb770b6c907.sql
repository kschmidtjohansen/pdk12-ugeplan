
-- Phase 1: Critical RLS Policy Fixes

-- First, let's enable RLS on all tables that need it
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own vacations" ON public.vacations;
DROP POLICY IF EXISTS "Users can create their own vacations" ON public.vacations;
DROP POLICY IF EXISTS "Users can update their own vacations" ON public.vacations;
DROP POLICY IF EXISTS "Users can delete their own vacations" ON public.vacations;
DROP POLICY IF EXISTS "Admins can view all vacations" ON public.vacations;
DROP POLICY IF EXISTS "Admins can update all vacations" ON public.vacations;
DROP POLICY IF EXISTS "Admins can delete all vacations" ON public.vacations;

-- Recreate vacation policies with proper WITH CHECK clauses
CREATE POLICY "Users can view their own vacations" ON public.vacations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vacations" ON public.vacations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vacations" ON public.vacations
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vacations" ON public.vacations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vacations" ON public.vacations
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can update all vacations" ON public.vacations
  FOR UPDATE USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can delete all vacations" ON public.vacations
  FOR DELETE USING (public.is_admin_user());

-- Assignments policies
CREATE POLICY "Users can view assignments they're assigned to" ON public.assignments
  FOR SELECT USING (
    public.can_user_access_assignment(id, auth.uid())
  );

CREATE POLICY "Admins and skadeleders can create assignments" ON public.assignments
  FOR INSERT WITH CHECK (public.is_admin_or_skadeleder());

CREATE POLICY "Admins and skadeleders can update assignments" ON public.assignments
  FOR UPDATE USING (public.is_admin_or_skadeleder()) WITH CHECK (public.is_admin_or_skadeleder());

CREATE POLICY "Admins and skadeleders can delete assignments" ON public.assignments
  FOR DELETE USING (public.is_admin_or_skadeleder());

-- Assignment employees policies
CREATE POLICY "Users can view their own assignment relationships" ON public.assignments_employees
  FOR SELECT USING (
    auth.uid() = user_id OR 
    public.is_admin_or_skadeleder()
  );

CREATE POLICY "Admins and skadeleders can manage assignment relationships" ON public.assignments_employees
  FOR ALL USING (public.is_admin_or_skadeleder()) WITH CHECK (public.is_admin_or_skadeleder());

-- Notifications policies - strengthen security
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Only allow system or admin to create notifications with proper validation
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    -- Only allow if user is admin or the notification is for the current user
    public.is_admin_user() OR auth.uid() = user_id
  );

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "System can create profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Cars policies
CREATE POLICY "All authenticated users can view cars" ON public.cars
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and skadeleders can manage cars" ON public.cars
  FOR ALL USING (public.is_admin_or_skadeleder()) WITH CHECK (public.is_admin_or_skadeleder());

-- User roles policies
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Only admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Create security audit function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  event_message TEXT,
  event_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.logs (event_type, message, details)
  VALUES (event_type, event_message, event_details);
EXCEPTION WHEN OTHERS THEN
  -- If logging fails, we don't want to break the main operation
  NULL;
END;
$$;

-- Create function to validate email format
CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Create function to validate password strength
CREATE OR REPLACE FUNCTION public.is_strong_password(password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN (
    LENGTH(password) >= 8 AND
    password ~ '[A-Z]' AND  -- At least one uppercase letter
    password ~ '[a-z]' AND  -- At least one lowercase letter
    password ~ '[0-9]'      -- At least one digit
  );
END;
$$;
