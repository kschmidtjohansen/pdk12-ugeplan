-- Migration: Add historical trends, notifications tracking, and clear data functionality

-- 1. Create sick_leave_notifications_sent table to track sent notifications
CREATE TABLE IF NOT EXISTS public.sick_leave_notifications_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sick_leave_id UUID NOT NULL REFERENCES public.sick_leave_records(id) ON DELETE CASCADE,
  notification_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  days_when_sent INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sick_leave_notifications_sent_sick_leave_id 
ON public.sick_leave_notifications_sent(sick_leave_id);

-- Enable RLS
ALTER TABLE public.sick_leave_notifications_sent ENABLE ROW LEVEL SECURITY;

-- Only administrators can access this table
CREATE POLICY "Only administrators can manage notification tracking"
ON public.sick_leave_notifications_sent
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'administrator'
));

-- 2. Create function to get historical sick leave trends (last 12 months)
CREATE OR REPLACE FUNCTION public.get_historical_sick_leave_trends(
  months_back INTEGER DEFAULT 12
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
  monthly_data JSONB;
BEGIN
  -- Security check
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'administrator'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view historical trends';
  END IF;

  -- Generate monthly statistics for the specified period
  WITH months AS (
    SELECT 
      date_trunc('month', CURRENT_DATE - (n || ' months')::INTERVAL)::DATE as month_start,
      (date_trunc('month', CURRENT_DATE - (n || ' months')::INTERVAL) + INTERVAL '1 month - 1 day')::DATE as month_end
    FROM generate_series(0, months_back - 1) n
  ),
  monthly_stats AS (
    SELECT
      m.month_start,
      to_char(m.month_start, 'YYYY-MM') as month,
      to_char(m.month_start, 'TMMonth YYYY') as month_label,
      COALESCE(SUM(
        CASE 
          WHEN slr.end_date IS NULL THEN 
            LEAST(m.month_end, CURRENT_DATE) - GREATEST(m.month_start, slr.start_date) + 1
          ELSE 
            LEAST(m.month_end, slr.end_date) - GREATEST(m.month_start, slr.start_date) + 1
        END
      ), 0) as total_sick_days,
      COUNT(DISTINCT slr.user_id) as unique_employees,
      (SELECT COUNT(*) FROM public.profiles WHERE status = 'active') as total_active_employees
    FROM months m
    LEFT JOIN public.sick_leave_records slr ON
      (slr.start_date <= m.month_end)
      AND (slr.end_date IS NULL OR slr.end_date >= m.month_start)
    GROUP BY m.month_start, m.month_end
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month,
      'month_label', month_label,
      'total_sick_days', total_sick_days,
      'unique_employees', unique_employees,
      'total_active_employees', total_active_employees,
      'sick_percentage', CASE 
        WHEN total_active_employees > 0 
        THEN ROUND((unique_employees::NUMERIC / total_active_employees::NUMERIC) * 100, 1)
        ELSE 0 
      END,
      'avg_sick_days', CASE 
        WHEN unique_employees > 0 
        THEN ROUND(total_sick_days::NUMERIC / unique_employees::NUMERIC, 1)
        ELSE 0 
      END
    )
    ORDER BY month_start DESC
  )
  INTO monthly_data
  FROM monthly_stats;

  result := jsonb_build_object(
    'months_back', months_back,
    'data', COALESCE(monthly_data, '[]'::jsonb),
    'generated_at', now()
  );

  -- Log access
  PERFORM public.log_security_event_safe(
    'sick_leave_historical_trends_accessed',
    format('Admin accessed historical sick leave trends (%s months)', months_back),
    jsonb_build_object(
      'months_back', months_back,
      'accessed_by', auth.uid()
    ),
    'info'
  );

  RETURN result;
END;
$$;

-- 3. Create function to clear all sick leave data
CREATE OR REPLACE FUNCTION public.clear_sick_leave_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Security check
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'administrator'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can clear sick leave data';
  END IF;

  -- Count records before deletion
  SELECT COUNT(*) INTO deleted_count 
  FROM public.sick_leave_records;

  -- Delete all sick leave records (notifications will cascade)
  DELETE FROM public.sick_leave_records;

  -- Log the action
  PERFORM public.log_security_event_safe(
    'sick_leave_data_cleared',
    format('Admin cleared all sick leave data (%s records deleted)', deleted_count),
    jsonb_build_object(
      'deleted_count', deleted_count,
      'cleared_by', auth.uid(),
      'timestamp', now()
    ),
    'warning'
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'message', format('Successfully deleted %s sick leave record(s)', deleted_count)
  );
END;
$$;