-- Phase 1 Database Support: Add enhanced monitoring function
CREATE OR REPLACE FUNCTION public.get_enhanced_system_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  recent_errors integer := 0;
  critical_errors integer := 0;
  avg_response_time numeric := 0;
BEGIN
  -- Count recent errors (last 24 hours)
  SELECT count(*) INTO recent_errors
  FROM public.logs 
  WHERE created_at > now() - INTERVAL '24 hours'
    AND event_type LIKE '%error%';
  
  -- Count critical errors (last 24 hours)  
  SELECT count(*) INTO critical_errors
  FROM public.logs 
  WHERE created_at > now() - INTERVAL '24 hours'
    AND (event_type LIKE '%critical%' OR details->>'severity' IN ('error', 'critical'));
  
  result := jsonb_build_object(
    'recent_errors', recent_errors,
    'critical_errors', critical_errors,
    'error_rate_per_hour', CASE WHEN recent_errors > 0 THEN round(recent_errors::numeric / 24, 2) ELSE 0 END,
    'system_health_score', CASE 
      WHEN critical_errors = 0 AND recent_errors < 5 THEN 100
      WHEN critical_errors = 0 AND recent_errors < 20 THEN 85
      WHEN critical_errors < 3 AND recent_errors < 50 THEN 70
      ELSE 50
    END,
    'monitoring_enhanced', true,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;