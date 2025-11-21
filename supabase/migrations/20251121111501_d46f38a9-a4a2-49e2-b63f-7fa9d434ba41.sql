-- Create sick_leave_records table
CREATE TABLE IF NOT EXISTS public.sick_leave_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes for performance
CREATE INDEX idx_sick_leave_user_id ON public.sick_leave_records(user_id);
CREATE INDEX idx_sick_leave_dates ON public.sick_leave_records(start_date, end_date);
CREATE INDEX idx_sick_leave_created_at ON public.sick_leave_records(created_at DESC);

-- Enable RLS
ALTER TABLE public.sick_leave_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only administrators can access
CREATE POLICY "Only administrators can view sick leave records"
  ON public.sick_leave_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator'));

CREATE POLICY "Only administrators can insert sick leave records"
  ON public.sick_leave_records FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator'));

CREATE POLICY "Only administrators can update sick leave records"
  ON public.sick_leave_records FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator'));

CREATE POLICY "Only administrators can delete sick leave records"
  ON public.sick_leave_records FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator'));

-- Function to get sick leave statistics
CREATE OR REPLACE FUNCTION public.get_sick_leave_statistics(
  period_type TEXT DEFAULT 'week',
  target_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
  start_date DATE;
  end_date DATE;
  total_sick_days INTEGER;
  unique_employees INTEGER;
  top_employees JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator') THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view sick leave statistics';
  END IF;

  CASE period_type
    WHEN 'week' THEN
      start_date := date_trunc('week', target_date)::DATE;
      end_date := start_date + INTERVAL '6 days';
    WHEN '14days' THEN
      start_date := target_date - INTERVAL '13 days';
      end_date := target_date;
    WHEN 'month' THEN
      start_date := date_trunc('month', target_date)::DATE;
      end_date := (date_trunc('month', target_date) + INTERVAL '1 month - 1 day')::DATE;
    ELSE
      RAISE EXCEPTION 'Invalid period_type. Use: week, 14days, or month';
  END CASE;

  SELECT COALESCE(SUM(
    CASE 
      WHEN end_date IS NULL THEN 
        LEAST(end_date::DATE, CURRENT_DATE) - GREATEST(start_date::DATE, slr.start_date) + 1
      ELSE 
        LEAST(end_date::DATE, slr.end_date) - GREATEST(start_date::DATE, slr.start_date) + 1
    END
  ), 0)
  INTO total_sick_days
  FROM public.sick_leave_records slr
  WHERE (slr.start_date <= end_date::DATE) AND (slr.end_date IS NULL OR slr.end_date >= start_date::DATE);

  SELECT COUNT(DISTINCT user_id) INTO unique_employees
  FROM public.sick_leave_records slr
  WHERE (slr.start_date <= end_date::DATE) AND (slr.end_date IS NULL OR slr.end_date >= start_date::DATE);

  SELECT jsonb_agg(
    jsonb_build_object(
      'employee_id', user_id,
      'employee_name', p.name,
      'total_days', sick_days,
      'occurrences', occurrences
    ) ORDER BY sick_days DESC
  )
  INTO top_employees
  FROM (
    SELECT slr.user_id,
      SUM(CASE 
        WHEN slr.end_date IS NULL THEN LEAST(end_date::DATE, CURRENT_DATE) - GREATEST(start_date::DATE, slr.start_date) + 1
        ELSE LEAST(end_date::DATE, slr.end_date) - GREATEST(start_date::DATE, slr.start_date) + 1
      END) as sick_days,
      COUNT(*) as occurrences
    FROM public.sick_leave_records slr
    WHERE (slr.start_date <= end_date::DATE) AND (slr.end_date IS NULL OR slr.end_date >= start_date::DATE)
    GROUP BY slr.user_id
    ORDER BY sick_days DESC
    LIMIT 5
  ) top
  JOIN public.profiles p ON p.id = top.user_id;

  result := jsonb_build_object(
    'period_type', period_type,
    'start_date', start_date,
    'end_date', end_date,
    'total_sick_days', total_sick_days,
    'unique_employees', unique_employees,
    'top_employees', COALESCE(top_employees, '[]'::jsonb),
    'generated_at', now()
  );

  PERFORM public.log_security_event_safe(
    'sick_leave_statistics_accessed',
    format('Admin accessed sick leave statistics for period: %s', period_type),
    jsonb_build_object('period_type', period_type, 'start_date', start_date, 'end_date', end_date, 'accessed_by', auth.uid()),
    'info'
  );

  RETURN result;
END;
$$;

-- Function to record sick leave
CREATE OR REPLACE FUNCTION public.record_sick_leave(
  p_user_id UUID,
  p_start_date DATE,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_record_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator') THEN
    RAISE EXCEPTION 'Access denied: Only administrators can record sick leave';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;

  INSERT INTO public.sick_leave_records (user_id, start_date, notes, created_by)
  VALUES (p_user_id, p_start_date, p_notes, auth.uid())
  RETURNING id INTO v_record_id;

  PERFORM public.log_security_event_safe(
    'sick_leave_recorded',
    format('Admin recorded sick leave for user: %s', p_user_id),
    jsonb_build_object('sick_leave_id', v_record_id, 'user_id', p_user_id, 'start_date', p_start_date, 'recorded_by', auth.uid()),
    'info'
  );

  RETURN v_record_id;
END;
$$;

-- Function to end sick leave
CREATE OR REPLACE FUNCTION public.end_sick_leave(
  p_record_id UUID,
  p_end_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_start_date DATE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator') THEN
    RAISE EXCEPTION 'Access denied: Only administrators can end sick leave';
  END IF;

  SELECT user_id, start_date INTO v_user_id, v_start_date
  FROM public.sick_leave_records WHERE id = p_record_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sick leave record not found';
  END IF;

  IF p_end_date < v_start_date THEN
    RAISE EXCEPTION 'End date cannot be before start date';
  END IF;

  UPDATE public.sick_leave_records SET end_date = p_end_date, updated_at = now() WHERE id = p_record_id;

  PERFORM public.log_security_event_safe(
    'sick_leave_ended',
    format('Admin ended sick leave for user: %s', v_user_id),
    jsonb_build_object('sick_leave_id', p_record_id, 'user_id', v_user_id, 'end_date', p_end_date, 'ended_by', auth.uid()),
    'info'
  );

  RETURN TRUE;
END;
$$;