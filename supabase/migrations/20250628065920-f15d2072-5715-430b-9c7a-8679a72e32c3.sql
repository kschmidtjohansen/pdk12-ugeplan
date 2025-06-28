
-- PHASE 1: COMPLETE POLICY CLEANUP - Remove all remaining recursive policies

-- Drop the 4 remaining recursive policies that are causing infinite recursion
DROP POLICY IF EXISTS "Only admin can modify user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role, admin can view all" ON public.user_roles;
DROP POLICY IF EXISTS "user_role_manage_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_role_select_policy" ON public.user_roles;

-- Verify we now have exactly 2 clean policies (the ones we created earlier)
-- user_roles_clean_self: FOR SELECT USING (user_id = auth.uid())
-- user_roles_clean_service: FOR ALL USING (auth.role() = 'service_role')

-- Add a verification query to ensure policy count is exactly 2
SELECT 
  count(*) as policy_count,
  array_agg(policyname) as remaining_policies
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_roles';

-- Test that user_roles access works without recursion
SELECT 'Testing user_roles access...' as test_status;
SELECT count(*) as user_roles_count FROM public.user_roles LIMIT 5;

-- Test that role functions work without recursion
SELECT 'Testing role functions...' as test_status;
SELECT public.get_current_user_role() as current_role;
SELECT public.is_admin_user() as is_admin;

-- Final verification
SELECT * FROM public.verify_complete_fix();
