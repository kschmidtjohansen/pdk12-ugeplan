-- Update get_sick_leave_statistics to include percentage metrics
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
  period_start_date DATE;
  period_end_date DATE;
  total_sick_days INTEGER;
  unique_employees INTEGER;
  top_employees JSONB;
  total_active_employees INTEGER;
  sick_percentage NUMERIC;
  avg_sick_days_per_employee NUMERIC;
BEGIN
  -- Security check: Only administrators can view sick leave statistics
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'administrator'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view sick leave statistics';
  END IF;

  -- Calculate date range based on period type
  CASE period_type
    WHEN 'week' THEN
      period_start_date := date_trunc('week', target_date)::DATE;
      period_end_date := period_start_date + INTERVAL '6 days';
    WHEN '14days' THEN
      period_start_date := target_date - INTERVAL '13 days';
      period_end_date := target_date;
    WHEN 'month' THEN
      period_start_date := date_trunc('month', target_date)::DATE;
      period_end_date := (date_trunc('month', target_date) + INTERVAL '1 month - 1 day')::DATE;
    ELSE
      RAISE EXCEPTION 'Invalid period_type. Use: week, 14days, or month';
  END CASE;

  -- Get total active employees
  SELECT COUNT(*) INTO total_active_employees
  FROM public.profiles
  WHERE status = 'active';

  -- Calculate total sick days
  SELECT COALESCE(SUM(
    CASE 
      WHEN slr.end_date IS NULL THEN 
        LEAST(period_end_date, CURRENT_DATE) - GREATEST(period_start_date, slr.start_date) + 1
      ELSE 
        LEAST(period_end_date, slr.end_date) - GREATEST(period_start_date, slr.start_date) + 1
    END
  ), 0)
  INTO total_sick_days
  FROM public.sick_leave_records slr
  WHERE 
    (slr.start_date <= period_end_date)
    AND (slr.end_date IS NULL OR slr.end_date >= period_start_date);

  -- Count unique employees who were sick
  SELECT COUNT(DISTINCT user_id)
  INTO unique_employees
  FROM public.sick_leave_records slr
  WHERE 
    (slr.start_date <= period_end_date)
    AND (slr.end_date IS NULL OR slr.end_date >= period_start_date);

  -- Calculate percentage
  IF total_active_employees > 0 THEN
    sick_percentage := ROUND((unique_employees::NUMERIC / total_active_employees::NUMERIC) * 100, 1);
  ELSE
    sick_percentage := 0;
  END IF;

  -- Calculate average sick days per employee who was sick
  IF unique_employees > 0 THEN
    avg_sick_days_per_employee := ROUND(total_sick_days::NUMERIC / unique_employees::NUMERIC, 1);
  ELSE
    avg_sick_days_per_employee := 0;
  END IF;

  -- Get top 5 employees with most sick days
  SELECT jsonb_agg(
    jsonb_build_object(
      'employee_id', user_id,
      'employee_name', p.name,
      'total_days', sick_days,
      'occurrences', occurrences
    )
    ORDER BY sick_days DESC
  )
  INTO top_employees
  FROM (
    SELECT 
      slr.user_id,
      SUM(
        CASE 
          WHEN slr.end_date IS NULL THEN 
            LEAST(period_end_date, CURRENT_DATE) - GREATEST(period_start_date, slr.start_date) + 1
          ELSE 
            LEAST(period_end_date, slr.end_date) - GREATEST(period_start_date, slr.start_date) + 1
        END
      ) as sick_days,
      COUNT(*) as occurrences
    FROM public.sick_leave_records slr
    WHERE 
      (slr.start_date <= period_end_date)
      AND (slr.end_date IS NULL OR slr.end_date >= period_start_date)
    GROUP BY slr.user_id
    ORDER BY sick_days DESC
    LIMIT 5
  ) top
  JOIN public.profiles p ON p.id = top.user_id;

  -- Build result with new fields
  result := jsonb_build_object(
    'period_type', period_type,
    'start_date', period_start_date,
    'end_date', period_end_date,
    'total_sick_days', total_sick_days,
    'unique_employees', unique_employees,
    'total_active_employees', total_active_employees,
    'sick_percentage', sick_percentage,
    'avg_sick_days_per_employee', avg_sick_days_per_employee,
    'top_employees', COALESCE(top_employees, '[]'::jsonb),
    'generated_at', now()
  );

  -- Log access for audit purposes
  PERFORM public.log_security_event_safe(
    'sick_leave_statistics_accessed',
    format('Admin accessed sick leave statistics for period: %s', period_type),
    jsonb_build_object(
      'period_type', period_type,
      'start_date', period_start_date,
      'end_date', period_end_date,
      'accessed_by', auth.uid()
    ),
    'info'
  );

  RETURN result;
END;
$$;