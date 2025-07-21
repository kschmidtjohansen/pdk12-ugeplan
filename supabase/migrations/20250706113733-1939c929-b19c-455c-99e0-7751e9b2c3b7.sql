-- Phase 1 Legacy Cleanup: Remove problematic logs and optimize system
-- Clean up data_fetch_failure logs with [object Object] errors that provide no value
DELETE FROM public.logs 
WHERE event_type = 'data_fetch_failure' 
  AND (message LIKE '%[object Object]%' OR details::text LIKE '%[object Object]%');

-- Clean up assignment_data_fetch_failure logs with poor error serialization
DELETE FROM public.logs 
WHERE event_type = 'assignment_data_fetch_failure' 
  AND (message LIKE '%[object Object]%' OR details::text LIKE '%[object Object]%');

-- Clean up old generic error logs that don't provide actionable information
DELETE FROM public.logs 
WHERE event_type IN ('error', 'system_error') 
  AND created_at < now() - INTERVAL '7 days'
  AND (message = 'Error' OR message = 'Unknown error' OR message LIKE '%[object Object]%');

-- Keep only the most recent 2000 logs to prevent database bloat
DELETE FROM public.logs 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, created_at,
      CASE 
        WHEN event_type IN ('security_error', 'unauthorized_access', 'auth_failure') THEN 1
        WHEN event_type LIKE '%enhanced%' THEN 2
        WHEN event_type IN ('critical_data_fetch_failure', 'vacation_realtime_change') THEN 3
        ELSE 4
      END as priority
    FROM public.logs 
    ORDER BY priority ASC, created_at DESC 
    LIMIT 2000
  ) prioritized_logs
);

-- Log the cleanup operation for monitoring
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'phase1_legacy_cleanup',
  'Phase 1 legacy cleanup completed - removed problematic logs and optimized system',
  jsonb_build_object(
    'cleanup_phase', 1,
    'timestamp', now(),
    'actions', ARRAY[
      'removed_object_object_errors',
      'cleaned_old_generic_errors', 
      'optimized_log_retention',
      'preserved_critical_logs'
    ],
    'next_phase', 'enhanced_error_handling_active'
  )
);