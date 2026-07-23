
-- Helper function: get shared duty department IDs for a given department
CREATE OR REPLACE FUNCTION public.get_shared_duty_department_ids(_department_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT (jsonb_array_elements_text(setting_value::jsonb))::uuid
      FROM public.department_settings
      WHERE department_id = _department_id
        AND setting_key = 'shared_duty_departments'
        AND setting_value IS NOT NULL
        AND setting_value <> ''
    ),
    ARRAY[]::uuid[]
  );
$$;

-- Helper function: can current user manage duty in the given department (via own access or via shared configuration)
CREATE OR REPLACE FUNCTION public.can_manage_duty_department(_duty_department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_super_admin(auth.uid())
    OR (
      public.is_admin_or_skadeleder()
      AND (
        -- Direct access to the duty's department
        _duty_department_id = ANY(public.get_user_department_ids(auth.uid()))
        OR EXISTS (
          -- Duty department shares with one of the user's departments
          SELECT 1
          FROM public.department_settings ds
          WHERE ds.setting_key = 'shared_duty_departments'
            AND ds.department_id = ANY(public.get_user_department_ids(auth.uid()))
            AND ds.setting_value::jsonb ? _duty_department_id::text
        )
      )
    );
$$;

-- Replace the overly permissive SELECT policy on on_call_duties
DROP POLICY IF EXISTS "Anyone can view on call duties" ON public.on_call_duties;

CREATE POLICY "Users can view duties in accessible departments"
ON public.on_call_duties
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_super_admin(auth.uid())
    OR department_id IS NULL
    OR department_id = ANY(public.get_user_department_ids(auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM public.department_settings ds
      WHERE ds.setting_key = 'shared_duty_departments'
        AND ds.department_id = ANY(public.get_user_department_ids(auth.uid()))
        AND ds.setting_value::jsonb ? on_call_duties.department_id::text
    )
  )
);

-- Extend admin/skadeleder management to include shared departments
DROP POLICY IF EXISTS "Admin and skadeleder can manage all duties" ON public.on_call_duties;

CREATE POLICY "Admin and skadeleder can manage duties"
ON public.on_call_duties
FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (
    public.is_admin_or_skadeleder()
    AND (
      department_id IS NULL
      OR public.can_manage_duty_department(department_id)
    )
  )
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    public.is_admin_or_skadeleder()
    AND (
      department_id IS NULL
      OR public.can_manage_duty_department(department_id)
    )
  )
);
