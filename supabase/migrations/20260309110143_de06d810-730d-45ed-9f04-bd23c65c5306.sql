
CREATE TABLE public.department_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value text,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(department_id, setting_key)
);

ALTER TABLE public.department_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings
CREATE POLICY "Authenticated users can view department settings"
  ON public.department_settings FOR SELECT
  USING (( SELECT get_auth_uid() AS get_auth_uid) IS NOT NULL);

-- Admins can insert
CREATE POLICY "Admins can insert department settings"
  ON public.department_settings FOR INSERT
  WITH CHECK (is_admin_or_skadeleder());

-- Admins can update
CREATE POLICY "Admins can update department settings"
  ON public.department_settings FOR UPDATE
  USING (is_admin_or_skadeleder())
  WITH CHECK (is_admin_or_skadeleder());

-- Admins can delete
CREATE POLICY "Admins can delete department settings"
  ON public.department_settings FOR DELETE
  USING (is_admin_or_skadeleder());
