-- Phase 1 & 2: Multi-Department Foundation Schema and Data Migration

-- 1. Create departments table
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Create user_departments table for cross-department access
CREATE TABLE public.user_departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- 3. Add department_id to existing tables
ALTER TABLE public.profiles ADD COLUMN department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.assignments ADD COLUMN department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.cars ADD COLUMN department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.notifications ADD COLUMN department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.vacations ADD COLUMN department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.user_roles ADD COLUMN department_id uuid REFERENCES public.departments(id);

-- 4. Insert initial departments
INSERT INTO public.departments (name, code) VALUES 
('Afdeling 12 - Trekantsområdet', 'AFD12'),
('Afdeling 02 - Hvidovre', 'AFD02');

-- 5. Get the department IDs for migration
DO $$
DECLARE
  afd12_id uuid;
  afd02_id uuid;
  kasper_user_id uuid;
BEGIN
  -- Get department IDs
  SELECT id INTO afd12_id FROM public.departments WHERE code = 'AFD12';
  SELECT id INTO afd02_id FROM public.departments WHERE code = 'AFD02';
  
  -- Find Kasper's user ID (assuming his email is known)
  SELECT id INTO kasper_user_id FROM public.profiles WHERE email ILIKE '%kasper%schmidt%johansen%' OR name ILIKE '%kasper%schmidt%johansen%' LIMIT 1;
  
  -- Migrate all existing data to Afdeling 12 (default department)
  UPDATE public.profiles SET department_id = afd12_id WHERE department_id IS NULL;
  UPDATE public.assignments SET department_id = afd12_id WHERE department_id IS NULL;
  UPDATE public.cars SET department_id = afd12_id WHERE department_id IS NULL;
  UPDATE public.notifications SET department_id = afd12_id WHERE department_id IS NULL;
  UPDATE public.vacations SET department_id = afd12_id WHERE department_id IS NULL;
  UPDATE public.user_roles SET department_id = afd12_id WHERE department_id IS NULL;
  
  -- Set up Kasper's cross-department access if found
  IF kasper_user_id IS NOT NULL THEN
    -- Add Kasper to both departments
    INSERT INTO public.user_departments (user_id, department_id, is_primary) 
    VALUES 
      (kasper_user_id, afd12_id, true),
      (kasper_user_id, afd02_id, false)
    ON CONFLICT (user_id, department_id) DO NOTHING;
    
    -- Ensure Kasper has admin role in both departments
    INSERT INTO public.user_roles (user_id, role, department_id)
    VALUES 
      (kasper_user_id, 'administrator', afd02_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 6. Make department_id NOT NULL after migration
ALTER TABLE public.profiles ALTER COLUMN department_id SET NOT NULL;
ALTER TABLE public.assignments ALTER COLUMN department_id SET NOT NULL;
ALTER TABLE public.cars ALTER COLUMN department_id SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN department_id SET NOT NULL;
ALTER TABLE public.vacations ALTER COLUMN department_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN department_id SET NOT NULL;

-- 7. Add indexes for performance
CREATE INDEX idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX idx_assignments_department_id ON public.assignments(department_id);
CREATE INDEX idx_cars_department_id ON public.cars(department_id);
CREATE INDEX idx_notifications_department_id ON public.notifications(department_id);
CREATE INDEX idx_vacations_department_id ON public.vacations(department_id);
CREATE INDEX idx_user_roles_department_id ON public.user_roles(department_id);
CREATE INDEX idx_user_departments_user_id ON public.user_departments(user_id);
CREATE INDEX idx_user_departments_department_id ON public.user_departments(department_id);

-- 8. Enable RLS on new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for new tables
CREATE POLICY "Everyone can view departments" ON public.departments
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can view their department associations" ON public.user_departments
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'administrator'
));

CREATE POLICY "Admins can manage department associations" ON public.user_departments
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'administrator'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'administrator'
));

-- 10. Create updated timestamp triggers
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_departments_updated_at
  BEFORE UPDATE ON public.user_departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Create helper function to get user's departments
CREATE OR REPLACE FUNCTION public.get_user_departments(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(department_id uuid, department_name text, department_code text, is_primary boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    d.id as department_id,
    d.name as department_name,
    d.code as department_code,
    ud.is_primary
  FROM public.departments d
  JOIN public.user_departments ud ON d.id = ud.department_id
  WHERE ud.user_id = user_uuid
    AND d.is_active = true
  ORDER BY ud.is_primary DESC, d.name;
$$;

-- 12. Create function to check if user has access to department
CREATE OR REPLACE FUNCTION public.user_has_department_access(user_uuid uuid, dept_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments
    WHERE user_id = user_uuid AND department_id = dept_id
  );
$$;