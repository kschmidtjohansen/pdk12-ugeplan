-- Create calibration reports table
CREATE TABLE public.calibration_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_and_employee TEXT NOT NULL,
  report_number TEXT NOT NULL UNIQUE,
  control_date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create calibration equipment entries table
CREATE TABLE public.calibration_equipment_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.calibration_reports(id) ON DELETE CASCADE,
  equipment_number INTEGER NOT NULL CHECK (equipment_number BETWEEN 1 AND 10),
  product_name TEXT,
  product_number TEXT,
  approved_margin TEXT,
  measured_result TEXT,
  assessment TEXT CHECK (assessment IN ('OK', 'Ikke OK', '')),
  initials TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(report_id, equipment_number)
);

-- Enable RLS
ALTER TABLE public.calibration_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibration_equipment_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for calibration_reports (only admin and skadeleder)
CREATE POLICY "Only admin and skadeleder can view calibration reports"
  ON public.calibration_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  );

CREATE POLICY "Only admin and skadeleder can insert calibration reports"
  ON public.calibration_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  );

CREATE POLICY "Only admin and skadeleder can update calibration reports"
  ON public.calibration_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  );

CREATE POLICY "Only admin and skadeleder can delete calibration reports"
  ON public.calibration_reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  );

-- Create RLS policies for calibration_equipment_entries (only admin and skadeleder)
CREATE POLICY "Only admin and skadeleder can view calibration equipment entries"
  ON public.calibration_equipment_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  );

CREATE POLICY "Only admin and skadeleder can insert calibration equipment entries"
  ON public.calibration_equipment_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  );

CREATE POLICY "Only admin and skadeleder can update calibration equipment entries"
  ON public.calibration_equipment_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  );

CREATE POLICY "Only admin and skadeleder can delete calibration equipment entries"
  ON public.calibration_equipment_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'skadeleder')
    )
  );

-- Create updated_at trigger for calibration_reports
CREATE TRIGGER update_calibration_reports_updated_at
  BEFORE UPDATE ON public.calibration_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for calibration_equipment_entries
CREATE TRIGGER update_calibration_equipment_entries_updated_at
  BEFORE UPDATE ON public.calibration_equipment_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();