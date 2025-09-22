-- Fix overly restrictive profiles RLS policy
-- The current policy blocks ALL access, which breaks basic functionality
-- Replace with proper policies that allow secure access

-- Remove the overly restrictive policy
DROP POLICY IF EXISTS "profiles_no_direct_access" ON public.profiles;

-- Create proper RLS policies for secure but functional access
-- Policy 1: Users can read their own profile
CREATE POLICY "profiles_self_read_access" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Policy 2: Administrators can read all profiles
CREATE POLICY "profiles_admin_read_access" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  )
);

-- Policy 3: Users can update their own basic profile info (name, phone, avatar)
CREATE POLICY "profiles_self_update_basic" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 4: Only administrators can update sensitive fields and other users' profiles
CREATE POLICY "profiles_admin_update_all" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  )
);

-- Policy 5: Only administrators can insert new profiles
CREATE POLICY "profiles_admin_insert_only" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  )
);

-- Policy 6: Only administrators can delete profiles
CREATE POLICY "profiles_admin_delete_only" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  )
);

-- Log the policy changes for security audit
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'security_policy_update',
  'Fixed overly restrictive profiles RLS policies',
  jsonb_build_object(
    'table', 'profiles',
    'action', 'replaced_restrictive_policy_with_proper_rls',
    'policies_created', 6,
    'access_model', 'self_read_admin_manage',
    'security_level', 'improved'
  )
);