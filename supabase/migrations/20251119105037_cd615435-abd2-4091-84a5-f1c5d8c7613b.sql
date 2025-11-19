-- Create duty_type enum
CREATE TYPE public.duty_type AS ENUM ('skadeleder_vagt', 'kørevagt');

-- Create on_call_duties table in public schema
CREATE TABLE public.on_call_duties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duty_date DATE NOT NULL,
  duty_type public.duty_type NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(duty_date, duty_type)
);

-- Create indexes for better performance
CREATE INDEX idx_on_call_duties_duty_date ON public.on_call_duties(duty_date);
CREATE INDEX idx_on_call_duties_employee_id ON public.on_call_duties(employee_id);
CREATE INDEX idx_on_call_duties_duty_type ON public.on_call_duties(duty_type);

-- Enable RLS
ALTER TABLE public.on_call_duties ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view duties
CREATE POLICY "Anyone can view on call duties"
ON public.on_call_duties
FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Only admin and skadeleder can manage duties
CREATE POLICY "Admin and skadeleder can manage duties"
ON public.on_call_duties
FOR ALL
TO authenticated
USING (
  public.is_admin_user() OR public.get_current_user_role() = 'skadeleder'::public.user_role
)
WITH CHECK (
  public.is_admin_user() OR public.get_current_user_role() = 'skadeleder'::public.user_role
);

-- Validation function to check skadeleder_vagt assignment
CREATE OR REPLACE FUNCTION public.validate_duty_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If assigning skadeleder_vagt, ensure employee has the right role
  IF NEW.duty_type = 'skadeleder_vagt' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = NEW.employee_id
      AND role IN ('administrator', 'skadeleder')
    ) THEN
      RAISE EXCEPTION 'Only administrators and skadeledere can be assigned to skadeleder_vagt';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add validation trigger
CREATE TRIGGER validate_duty_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.on_call_duties
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_duty_assignment();

-- Create updated_at trigger
CREATE TRIGGER update_on_call_duties_updated_at
  BEFORE UPDATE ON public.on_call_duties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create demo schema tables
CREATE TABLE demo.on_call_duties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duty_date DATE NOT NULL,
  duty_type public.duty_type NOT NULL,
  employee_id UUID NOT NULL REFERENCES demo.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES demo.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(duty_date, duty_type)
);

-- Create indexes for demo schema
CREATE INDEX idx_demo_on_call_duties_duty_date ON demo.on_call_duties(duty_date);
CREATE INDEX idx_demo_on_call_duties_employee_id ON demo.on_call_duties(employee_id);
CREATE INDEX idx_demo_on_call_duties_duty_type ON demo.on_call_duties(duty_type);

-- Enable RLS on demo table
ALTER TABLE demo.on_call_duties ENABLE ROW LEVEL SECURITY;

-- RLS policies for demo schema
CREATE POLICY "Demo users can view duties"
ON demo.on_call_duties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'test@polygongroup.com'
  )
);

CREATE POLICY "Demo admin and skadeleder can manage duties"
ON demo.on_call_duties
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'test@polygongroup.com'
  )
  AND (
    public.is_admin_user() OR public.get_current_user_role() = 'skadeleder'::public.user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'test@polygongroup.com'
  )
  AND (
    public.is_admin_user() OR public.get_current_user_role() = 'skadeleder'::public.user_role
  )
);

-- Validation function for demo schema
CREATE OR REPLACE FUNCTION demo.validate_duty_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = demo, public
AS $$
BEGIN
  IF NEW.duty_type = 'skadeleder_vagt' THEN
    IF NOT EXISTS (
      SELECT 1 FROM demo.user_roles
      WHERE user_id = NEW.employee_id
      AND role IN ('administrator', 'skadeleder')
    ) THEN
      RAISE EXCEPTION 'Only administrators and skadeledere can be assigned to skadeleder_vagt';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add validation trigger for demo
CREATE TRIGGER validate_demo_duty_assignment_trigger
  BEFORE INSERT OR UPDATE ON demo.on_call_duties
  FOR EACH ROW
  EXECUTE FUNCTION demo.validate_duty_assignment();

-- Create updated_at trigger for demo
CREATE TRIGGER update_demo_on_call_duties_updated_at
  BEFORE UPDATE ON demo.on_call_duties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();