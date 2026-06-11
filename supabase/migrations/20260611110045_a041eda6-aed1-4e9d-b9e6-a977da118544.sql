-- Allow all authenticated users to read user_roles so role-based UI
-- (dashboard filters, planner badges, availability KPIs) works for
-- non-admin roles like fugttekniker and servicemedarbejder.
-- Without this, useEmployeeData falls back to 'servicemedarbejder'
-- for every colleague whose role row is hidden by RLS.
DROP POLICY IF EXISTS user_roles_select_policy ON public.user_roles;

CREATE POLICY user_roles_select_policy
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);