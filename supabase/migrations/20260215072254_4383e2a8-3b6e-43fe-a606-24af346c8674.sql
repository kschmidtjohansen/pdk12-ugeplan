-- Fase 6: Fjern 14 redundante indexes
-- Disse indexes er enten subsets af eksisterende composite indexes,
-- duplikerer primary keys, eller er ineffektive på TEXT-kolonner.

DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS notifications_user_id_idx;
DROP INDEX IF EXISTS notifications_created_at_idx;
DROP INDEX IF EXISTS idx_profiles_id;
DROP INDEX IF EXISTS idx_profiles_status;
DROP INDEX IF EXISTS idx_profiles_status_name;
DROP INDEX IF EXISTS idx_assignments_published_date;
DROP INDEX IF EXISTS idx_assignments_date_range_user;
DROP INDEX IF EXISTS idx_assignments_date_time;
DROP INDEX IF EXISTS idx_logs_created_at;
DROP INDEX IF EXISTS idx_logs_event_type;
DROP INDEX IF EXISTS idx_case_folder_mappings_case_number;
DROP INDEX IF EXISTS idx_vacations_status_dates;
DROP INDEX IF EXISTS logs_message_idx;