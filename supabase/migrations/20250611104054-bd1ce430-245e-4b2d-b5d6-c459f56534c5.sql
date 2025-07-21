
-- Phase 1: Drop all existing problematic RLS policies to start fresh
-- This will eliminate conflicts and allow us to create a clean, consolidated set

-- Drop all existing policies on assignments table
DROP POLICY IF EXISTS "Servicemedarbejder can view accessible assignments" ON public.assignments;
DROP POLICY IF EXISTS "Servicemedarbejder can view own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can view assignments they are assigned to" ON public.assignments;
DROP POLICY IF EXISTS "Responsible users can view their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Skadeleder can view all assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can delete assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admin can manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "System can manage assignments" ON public.assignments;

-- Drop all existing policies on assignments_employees table
DROP POLICY IF EXISTS "Users can view their own assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "Users can view their assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "Admins can manage assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "System can manage assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "Users can create assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "Users can update assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "Users can delete assignment relationships" ON public.assignments_employees;
DROP POLICY IF EXISTS "Skadeleder can manage assignment relationships" ON public.assignments_employees;

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "All authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Skadeleder can view all profiles" ON public.profiles;

-- Drop all existing policies on user_roles table
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can create roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Skadeleder can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their role" ON public.user_roles;

-- Drop all existing policies on vacations table
DROP POLICY IF EXISTS "Users can view their own vacations" ON public.vacations;
DROP POLICY IF EXISTS "Admins can manage all vacations" ON public.vacations;
DROP POLICY IF EXISTS "Users can create their own vacations" ON public.vacations;
DROP POLICY IF EXISTS "Users can update their own vacations" ON public.vacations;
DROP POLICY IF EXISTS "Users can delete their own vacations" ON public.vacations;
DROP POLICY IF EXISTS "Skadeleder can manage vacations" ON public.vacations;
DROP POLICY IF EXISTS "System can manage vacations" ON public.vacations;
DROP POLICY IF EXISTS "Users can view vacations" ON public.vacations;
DROP POLICY IF EXISTS "Admins can view all vacation requests" ON public.vacations;
DROP POLICY IF EXISTS "Users can submit vacation requests" ON public.vacations;
DROP POLICY IF EXISTS "Admins can approve vacation requests" ON public.vacations;
DROP POLICY IF EXISTS "Users can modify pending requests" ON public.vacations;

-- Drop all existing policies on notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can mark notifications as read" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can manage notifications" ON public.notifications;

-- Drop all existing policies on cars table
DROP POLICY IF EXISTS "All users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can manage cars" ON public.cars;
DROP POLICY IF EXISTS "Skadeleder can manage cars" ON public.cars;
DROP POLICY IF EXISTS "Users can view available cars" ON public.cars;
DROP POLICY IF EXISTS "System can manage cars" ON public.cars;

-- Drop all existing policies on logs table
DROP POLICY IF EXISTS "Admins can view logs" ON public.logs;
DROP POLICY IF EXISTS "System can create logs" ON public.logs;
DROP POLICY IF EXISTS "Admins can manage logs" ON public.logs;

-- Phase 2: Add missing foreign key constraints for data integrity (only if they don't exist)
-- Check and add foreign key constraints that are missing

-- Add foreign key for vacations.user_id to profiles.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vacations_user_id_fkey' 
        AND table_name = 'vacations'
    ) THEN
        ALTER TABLE public.vacations 
        ADD CONSTRAINT vacations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for notifications.user_id to profiles.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_user_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for user_roles.user_id to profiles.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_roles_user_id_fkey' 
        AND table_name = 'user_roles'
    ) THEN
        ALTER TABLE public.user_roles 
        ADD CONSTRAINT user_roles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Phase 3: Remove the obsolete users table if it exists
DROP TABLE IF EXISTS public.users CASCADE;

-- Phase 4: Create consolidated, non-conflicting RLS policies
-- ASSIGNMENTS TABLE - 4 consolidated policies
CREATE POLICY "View assignments policy"
ON public.assignments FOR SELECT
TO authenticated
USING (
  public.is_admin_or_skadeleder() 
  OR public.can_user_access_assignment(id, auth.uid())
);

CREATE POLICY "Create assignments policy"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_skadeleder());

CREATE POLICY "Update assignments policy"
ON public.assignments FOR UPDATE
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

CREATE POLICY "Delete assignments policy"
ON public.assignments FOR DELETE
TO authenticated
USING (public.is_admin_or_skadeleder());

-- ASSIGNMENTS_EMPLOYEES TABLE - 2 consolidated policies
CREATE POLICY "View assignment relationships policy"
ON public.assignments_employees FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "Manage assignment relationships policy"
ON public.assignments_employees FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- PROFILES TABLE - 3 consolidated policies
CREATE POLICY "View profiles policy"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Update own profile policy"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admin manage profiles policy"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- USER_ROLES TABLE - 2 consolidated policies
CREATE POLICY "View user roles policy"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin manage roles policy"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- VACATIONS TABLE - 4 consolidated policies
CREATE POLICY "View vacations policy"
ON public.vacations FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "Create vacation requests policy"
ON public.vacations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own vacation requests policy"
ON public.vacations FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid() AND status = 'pending')
  OR public.is_admin_or_skadeleder()
)
WITH CHECK (
  (user_id = auth.uid() AND status = 'pending')
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "Delete vacation requests policy"
ON public.vacations FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

-- NOTIFICATIONS TABLE - 4 consolidated policies
CREATE POLICY "View own notifications policy"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Create notifications policy"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Update own notifications policy"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own notifications policy"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- CARS TABLE - 2 consolidated policies
CREATE POLICY "View cars policy"
ON public.cars FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin manage cars policy"
ON public.cars FOR ALL
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- LOGS TABLE - 2 consolidated policies
CREATE POLICY "Admin view logs policy"
ON public.logs FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "System create logs policy"
ON public.logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Phase 5: Add performance indexes for RLS policies
CREATE INDEX IF NOT EXISTS idx_assignments_responsible_user 
ON public.assignments (responsible_user_id);

CREATE INDEX IF NOT EXISTS idx_assignments_employees_user 
ON public.assignments_employees (user_id);

CREATE INDEX IF NOT EXISTS idx_vacations_user_status 
ON public.vacations (user_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications (user_id, read);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles (user_id, role);

-- Phase 6: Update system cleanup tracking table RLS
ALTER TABLE public.system_cleanup_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage cleanup tracking policy"
ON public.system_cleanup_tracking FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
