-- Fix critical security vulnerability in assignments table
-- Remove public access to published assignments and require authentication

-- Drop the existing policy
DROP POLICY IF EXISTS "assignment_select_policy" ON public.assignments;

-- Create a new secure policy that requires authentication
CREATE POLICY "assignment_select_policy_secure" 
ON public.assignments 
FOR SELECT 
USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL 
  AND (
    -- Admin/skadeleder can see all assignments
    is_admin_or_skadeleder() 
    OR 
    -- Users can see assignments they're assigned to or responsible for
    can_user_access_assignment(id, auth.uid()) 
    OR 
    -- Authenticated users can see published assignments (not unauthenticated users)
    published = true
  )
);

-- Log the security fix
SELECT public.log_security_event_safe(
  'security_vulnerability_fixed',
  'Fixed critical security vulnerability: removed public access to published assignments',
  jsonb_build_object(
    'table', 'assignments',
    'policy', 'assignment_select_policy_secure',
    'vulnerability', 'published assignments were accessible to unauthenticated users',
    'fix', 'added authentication requirement to all assignment access'
  ),
  'info'
);