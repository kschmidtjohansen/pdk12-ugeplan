-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admin and skadeleder can manage duties" ON public.on_call_duties;

-- Recreate admin/skadeleder policy for full management
CREATE POLICY "Admin and skadeleder can manage all duties"
ON public.on_call_duties
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('administrator', 'skadeleder')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('administrator', 'skadeleder')
  )
);

-- New policy: Allow users to reassign duties they are currently assigned to
CREATE POLICY "Users can reassign their own duties"
ON public.on_call_duties
FOR UPDATE
TO authenticated
USING (employee_id = auth.uid())
WITH CHECK (true);

COMMENT ON POLICY "Users can reassign their own duties" ON public.on_call_duties IS
'Allows employees to swap/reassign duties they are currently assigned to. This enables the "Byt vagt" (swap duty) feature for all employees.';