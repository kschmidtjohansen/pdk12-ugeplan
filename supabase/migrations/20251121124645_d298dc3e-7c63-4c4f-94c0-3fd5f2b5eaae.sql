-- =====================================================
-- GDPR COMPLIANCE: Fjern al sygemeld-funktionalitet
-- =====================================================
-- VIGTIGT: Dette fjerner personfølsomme sundhedsdata permanent
-- Backup er anbefalet før kørsel af denne migration

-- 1. Drop RPC Functions
DROP FUNCTION IF EXISTS public.record_sick_leave(UUID, DATE, TEXT);
DROP FUNCTION IF EXISTS public.end_sick_leave(UUID, DATE);
DROP FUNCTION IF EXISTS public.get_sick_leave_statistics(TEXT, DATE);
DROP FUNCTION IF EXISTS public.get_historical_sick_leave_trends(INTEGER);

-- 2. Drop Tables (cascade will handle foreign keys)
DROP TABLE IF EXISTS public.sick_leave_notifications_sent CASCADE;
DROP TABLE IF EXISTS public.sick_leave_records CASCADE;

-- 3. Clean up any system_cleanup_tracking entries related to sick leave
DELETE FROM public.system_cleanup_tracking 
WHERE cleanup_type ILIKE '%sick%';

-- 4. Log the removal for audit purposes
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'gdpr_compliance',
  'Sick leave functionality removed for GDPR compliance',
  jsonb_build_object(
    'timestamp', NOW(),
    'tables_removed', ARRAY['sick_leave_records', 'sick_leave_notifications_sent'],
    'functions_removed', ARRAY['record_sick_leave', 'end_sick_leave', 'get_sick_leave_statistics', 'get_historical_sick_leave_trends'],
    'reason', 'GDPR compliance - sensitive health data may not be stored'
  )
);