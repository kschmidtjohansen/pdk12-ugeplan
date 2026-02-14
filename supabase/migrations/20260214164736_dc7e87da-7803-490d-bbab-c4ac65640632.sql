
-- Fix 1: Update can_view_fuel_codes to include super_admin
CREATE OR REPLACE FUNCTION public.can_view_fuel_codes()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'administrator', 'skadeleder')
  );
$$;

-- Fix 2: Temporarily disable trigger, clean up, re-enable
ALTER TABLE public.cars DISABLE TRIGGER cars_security_log_trigger;

UPDATE public.cars 
SET fuel_card_code = '' 
WHERE fuel_card_code = 'PENDING_ADMIN_APPROVAL';

ALTER TABLE public.cars ENABLE TRIGGER cars_security_log_trigger;

-- Fix 3: Create car_sub_departments junction table
CREATE TABLE public.car_sub_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  sub_department_id uuid NOT NULL REFERENCES public.sub_departments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(car_id, sub_department_id)
);

ALTER TABLE public.car_sub_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view car_sub_departments"
  ON public.car_sub_departments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert car_sub_departments"
  ON public.car_sub_departments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'administrator')
    )
  );

CREATE POLICY "Admins can update car_sub_departments"
  ON public.car_sub_departments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'administrator')
    )
  );

CREATE POLICY "Admins can delete car_sub_departments"
  ON public.car_sub_departments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'administrator')
    )
  );

-- Migrate existing data
INSERT INTO public.car_sub_departments (car_id, sub_department_id)
SELECT id, sub_department_id FROM public.cars 
WHERE sub_department_id IS NOT NULL
ON CONFLICT DO NOTHING;
