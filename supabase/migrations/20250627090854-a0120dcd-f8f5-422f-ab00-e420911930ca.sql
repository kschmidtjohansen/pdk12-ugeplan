
-- Phase 1: Critical RLS Policy Implementation

-- Add RLS policies for vacations table
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;

-- Users can view their own vacation requests, admin/skadeleder can view all
CREATE POLICY "Users can view own vacations, admin can view all"
ON public.vacations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Users can create their own vacation requests
CREATE POLICY "Users can create own vacations"
ON public.vacations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending vacations, admin/skadeleder can update any
CREATE POLICY "Users can update own pending vacations, admin can update any"
ON public.vacations
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id AND status = 'pending') OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Users can delete their own pending vacations, admin/skadeleder can delete any
CREATE POLICY "Users can delete own pending vacations, admin can delete any"
ON public.vacations
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id AND status = 'pending') OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Add RLS policies for assignments_employees table
ALTER TABLE public.assignments_employees ENABLE ROW LEVEL SECURITY;

-- Users can view assignment relationships they're part of, admin/skadeleder can view all
CREATE POLICY "Users can view own assignment relationships, admin can view all"
ON public.assignments_employees
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Only admin/skadeleder can insert assignment relationships
CREATE POLICY "Only admin can create assignment relationships"
ON public.assignments_employees
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Only admin/skadeleder can update assignment relationships
CREATE POLICY "Only admin can update assignment relationships"
ON public.assignments_employees
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Only admin/skadeleder can delete assignment relationships
CREATE POLICY "Only admin can delete assignment relationships"
ON public.assignments_employees
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Add RLS policies for system_cleanup_tracking table
ALTER TABLE public.system_cleanup_tracking ENABLE ROW LEVEL SECURITY;

-- Only admin users can access system cleanup tracking
CREATE POLICY "Only admin can access system cleanup tracking"
ON public.system_cleanup_tracking
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  )
);

-- Add RLS policies for assignments table (if not already present)
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Users can view assignments they're assigned to or responsible for, admin/skadeleder can view all
CREATE POLICY "Users can view relevant assignments, admin can view all"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  auth.uid() = responsible_user_id OR
  EXISTS (
    SELECT 1 FROM public.assignments_employees 
    WHERE assignment_id = assignments.id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Only admin/skadeleder can create assignments
CREATE POLICY "Only admin can create assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Only admin/skadeleder can update assignments
CREATE POLICY "Only admin can update assignments"
ON public.assignments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Only admin/skadeleder can delete assignments
CREATE POLICY "Only admin can delete assignments"
ON public.assignments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Add RLS policies for cars table
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view cars
CREATE POLICY "Authenticated users can view cars"
ON public.cars
FOR SELECT
TO authenticated
USING (true);

-- Only admin/skadeleder can modify cars
CREATE POLICY "Only admin can modify cars"
ON public.cars
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Add RLS policies for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Only admin/skadeleder can create notifications
CREATE POLICY "Only admin can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add RLS policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile, admin can view all
CREATE POLICY "Users can view own profile, admin can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'skadeleder')
  )
);

-- Users can update their own profile, admin can update any
CREATE POLICY "Users can update own profile, admin can update any"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  )
);

-- Add RLS policies for user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role, admin can view all
CREATE POLICY "Users can view own role, admin can view all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrator'
  )
);

-- Only admin can modify user roles
CREATE POLICY "Only admin can modify user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  )
);

-- Add RLS policies for logs table
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Only admin can access logs
CREATE POLICY "Only admin can access logs"
ON public.logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  )
);
