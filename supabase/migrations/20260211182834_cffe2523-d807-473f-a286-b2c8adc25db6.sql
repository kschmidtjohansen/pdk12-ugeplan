
-- Del 2: Nye tabeller
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sub_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(department_id, name)
);
ALTER TABLE public.sub_departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  sub_department_id UUID REFERENCES public.sub_departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_id, sub_department_id)
);
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

-- Del 3: Udvid eksisterende tabeller
ALTER TABLE public.profiles
  ADD COLUMN home_department_id UUID REFERENCES public.departments(id),
  ADD COLUMN is_visible_in_planning BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.assignments
  ADD COLUMN department_id UUID REFERENCES public.departments(id),
  ADD COLUMN sub_department_id UUID REFERENCES public.sub_departments(id);

ALTER TABLE public.vacations
  ADD COLUMN department_id UUID REFERENCES public.departments(id),
  ADD COLUMN sub_department_id UUID REFERENCES public.sub_departments(id);

ALTER TABLE public.on_call_duties
  ADD COLUMN department_id UUID REFERENCES public.departments(id),
  ADD COLUMN sub_department_id UUID REFERENCES public.sub_departments(id);

-- Del 4: Hjælpefunktioner
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_department_ids(_user_id UUID DEFAULT auth.uid())
RETURNS UUID[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT department_id),
    ARRAY[]::UUID[]
  )
  FROM public.user_access
  WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_sub_department_ids(_user_id UUID DEFAULT auth.uid())
RETURNS UUID[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT sub_department_id) FILTER (WHERE sub_department_id IS NOT NULL),
    ARRAY[]::UUID[]
  )
  FROM public.user_access
  WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.can_access_department_data(
  _dept_id UUID,
  _sub_dept_id UUID DEFAULT NULL,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    is_super_admin(_user_id)
    OR
    (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'administrator'
      )
      AND _dept_id = ANY(get_user_department_ids(_user_id))
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM public.user_access
        WHERE user_id = _user_id
        AND department_id = _dept_id
        AND (
          _sub_dept_id IS NULL
          OR sub_department_id IS NULL
          OR sub_department_id = _sub_dept_id
        )
      )
    )
  );
$$;

-- Del 5: Opdater eksisterende funktioner
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'administrator')
    LIMIT 1
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_skadeleder()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('super_admin', 'administrator', 'skadeleder')
  );
$$;

-- Del 6: RLS policies
CREATE POLICY "Authenticated users can view departments"
  ON public.departments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Super admins can insert departments"
  ON public.departments FOR INSERT
  TO authenticated WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update departments"
  ON public.departments FOR UPDATE
  TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can delete departments"
  ON public.departments FOR DELETE
  TO authenticated USING (is_super_admin());

CREATE POLICY "Authenticated users can view sub_departments"
  ON public.sub_departments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert sub_departments"
  ON public.sub_departments FOR INSERT
  TO authenticated WITH CHECK (
    is_super_admin()
    OR (is_admin_user() AND department_id = ANY(get_user_department_ids()))
  );

CREATE POLICY "Admins can update sub_departments"
  ON public.sub_departments FOR UPDATE
  TO authenticated USING (
    is_super_admin()
    OR (is_admin_user() AND department_id = ANY(get_user_department_ids()))
  );

CREATE POLICY "Admins can delete sub_departments"
  ON public.sub_departments FOR DELETE
  TO authenticated USING (
    is_super_admin()
    OR (is_admin_user() AND department_id = ANY(get_user_department_ids()))
  );

CREATE POLICY "Users can view own access"
  ON public.user_access FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR is_super_admin()
    OR (is_admin_user() AND department_id = ANY(get_user_department_ids()))
  );

CREATE POLICY "Admins can insert user access"
  ON public.user_access FOR INSERT
  TO authenticated WITH CHECK (
    is_super_admin()
    OR (is_admin_user() AND department_id = ANY(get_user_department_ids()))
  );

CREATE POLICY "Admins can update user access"
  ON public.user_access FOR UPDATE
  TO authenticated USING (
    is_super_admin()
    OR (is_admin_user() AND department_id = ANY(get_user_department_ids()))
  );

CREATE POLICY "Admins can delete user access"
  ON public.user_access FOR DELETE
  TO authenticated USING (
    is_super_admin()
    OR (is_admin_user() AND department_id = ANY(get_user_department_ids()))
  );

-- Del 7: Seed Fredericia
INSERT INTO public.departments (name) VALUES ('Fredericia');

UPDATE public.profiles
  SET home_department_id = (SELECT id FROM public.departments WHERE name = 'Fredericia');

INSERT INTO public.user_access (user_id, department_id)
  SELECT id, (SELECT id FROM public.departments WHERE name = 'Fredericia')
  FROM public.profiles;

UPDATE public.assignments
  SET department_id = (SELECT id FROM public.departments WHERE name = 'Fredericia');

UPDATE public.vacations
  SET department_id = (SELECT id FROM public.departments WHERE name = 'Fredericia');

UPDATE public.on_call_duties
  SET department_id = (SELECT id FROM public.departments WHERE name = 'Fredericia');
