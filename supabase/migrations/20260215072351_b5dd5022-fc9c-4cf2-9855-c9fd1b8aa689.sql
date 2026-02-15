-- Fase 6: Oprydning af logs-støj (317k rækker / ~180 MB)
-- Sletter de 3 største støjkategorier der ikke har diagnostisk værdi.
DELETE FROM logs WHERE event_type IN ('vacation_realtime_change', 'enhanced_error_timeout', 'enhanced_error_database');