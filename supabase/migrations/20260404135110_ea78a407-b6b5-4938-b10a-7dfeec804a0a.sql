
-- =============================================================
-- SECURITY HARDENING: Fix public-role RLS policies
-- =============================================================

-- 1. Profiles: Drop public-role hide_demo_data_profiles, recreate as authenticated
DROP POLICY IF EXISTS "hide_demo_data_profiles" ON public.profiles;
CREATE POLICY "hide_demo_data_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (is_demo = false) OR (get_auth_uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid)
  );

-- Also drop the "Users can view all profiles" public policy (USING true)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Fix profiles UPDATE policies: change from public to authenticated
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (get_auth_uid() = id)
  WITH CHECK (get_auth_uid() = id);

DROP POLICY IF EXISTS "secure_profile_access_unified" ON public.profiles;
CREATE POLICY "secure_profile_access_unified" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (id = get_auth_uid()) OR
    (
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = get_auth_uid()
          AND ur.role = ANY (ARRAY['administrator'::user_role, 'skadeleder'::user_role])
          AND ur.created_at IS NOT NULL
      )
      AND (
        CASE WHEN id <> get_auth_uid() THEN
          (log_security_event_safe(
            'admin_profile_access',
            format('Admin accessed profile: %s (ID: %s)', name, id),
            jsonb_build_object(
              'admin_id', get_auth_uid(),
              'accessed_profile_id', id,
              'accessed_profile_email', email
            ),
            'warning'
          ) IS NULL) OR true
        ELSE true
        END
      )
    )
  );

DROP POLICY IF EXISTS "secure_profile_updates" ON public.profiles;
CREATE POLICY "secure_profile_updates" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (id = get_auth_uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = get_auth_uid()
        AND ur.role = ANY (ARRAY['administrator'::user_role, 'super_admin'::user_role])
        AND ur.created_at IS NOT NULL
    )
  )
  WITH CHECK (
    (id = get_auth_uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = get_auth_uid()
        AND ur.role = ANY (ARRAY['administrator'::user_role, 'super_admin'::user_role])
    )
  );

-- Also fix "Users can insert own profile" and "Users can update own profile" (duplicate)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (get_auth_uid() = id);

-- 2. User roles: Drop public "Anyone can view user roles"
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;

-- 3. Cars: Drop public hide_demo_data_cars, recreate as authenticated
DROP POLICY IF EXISTS "hide_demo_data_cars" ON public.cars;
CREATE POLICY "hide_demo_data_cars" ON public.cars
  FOR SELECT TO authenticated
  USING (
    (is_demo = false) OR (get_auth_uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid)
  );

-- 4. Warehouse: need the table name
DROP POLICY IF EXISTS "hide_demo_data_warehouse" ON public.warehouse_items;
CREATE POLICY "hide_demo_data_warehouse" ON public.warehouse_items
  FOR SELECT TO authenticated
  USING (
    (is_demo = false) OR (get_auth_uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid)
  );

-- 5. Tighten assignments_employees_select_policy
DROP POLICY IF EXISTS "assignments_employees_select_policy" ON public.assignments_employees;
CREATE POLICY "assignments_employees_select_policy" ON public.assignments_employees
  FOR SELECT TO authenticated
  USING (
    (user_id = get_auth_uid()) OR
    is_admin_from_jwt() OR
    is_admin_or_skadeleder()
  );
