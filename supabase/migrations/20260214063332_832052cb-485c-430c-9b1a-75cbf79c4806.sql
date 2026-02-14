
-- Step 1: Create SECURITY DEFINER function for vacation access control
CREATE OR REPLACE FUNCTION public.can_access_vacation(vacation_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Own vacation
    vacation_user_id = auth.uid()
    -- Super admin / administrator: full access
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'administrator')
    )
    -- Skadeleder: only if vacation user shares at least one department
    OR (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'skadeleder'
      )
      AND EXISTS (
        SELECT 1
        FROM user_access AS my_access
        JOIN user_access AS their_access
          ON my_access.department_id = their_access.department_id
        WHERE my_access.user_id = auth.uid()
          AND their_access.user_id = vacation_user_id
      )
    )
$$;

-- Step 2: Drop ALL existing vacation policies
DROP POLICY IF EXISTS "vacations_secure_access" ON public.vacations;
DROP POLICY IF EXISTS "vacation_insert_policy" ON public.vacations;
DROP POLICY IF EXISTS "vacation_update_policy" ON public.vacations;
DROP POLICY IF EXISTS "vacation_delete_policy" ON public.vacations;
DROP POLICY IF EXISTS "Users can view accessible vacations" ON public.vacations;
DROP POLICY IF EXISTS "Users can create vacation requests" ON public.vacations;
DROP POLICY IF EXISTS "Users can update own vacation requests" ON public.vacations;
DROP POLICY IF EXISTS "Users can delete own vacation requests" ON public.vacations;

-- Step 3: Create clean consolidated policies

-- SELECT: own + admin full + skadeleder department-scoped
CREATE POLICY "vacation_select_policy"
ON public.vacations FOR SELECT
TO authenticated
USING (can_access_vacation(user_id));

-- INSERT: own requests OR admin (skadeledere can create on behalf within dept)
CREATE POLICY "vacation_insert_policy"
ON public.vacations FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR can_access_vacation(user_id)
);

-- UPDATE: own pending OR admin/skadeleder department-scoped
CREATE POLICY "vacation_update_policy"
ON public.vacations FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid() AND status = 'pending')
  OR can_access_vacation(user_id)
)
WITH CHECK (
  (user_id = auth.uid() AND status = 'pending')
  OR can_access_vacation(user_id)
);

-- DELETE: own pending OR admin/skadeleder department-scoped
CREATE POLICY "vacation_delete_policy"
ON public.vacations FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid() AND status = 'pending')
  OR can_access_vacation(user_id)
);
