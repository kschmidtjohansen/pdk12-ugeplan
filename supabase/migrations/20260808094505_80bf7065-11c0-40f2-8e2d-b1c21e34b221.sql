-- 1) Restore EXECUTE for app roles on all public functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2) Kiosk (unauthenticated screen display) needs exactly these three
GRANT EXECUTE ON FUNCTION public.list_screen_display_assignments(uuid, uuid, date) TO anon;
GRANT EXECUTE ON FUNCTION public.list_screen_display_absences(uuid, date) TO anon;
GRANT EXECUTE ON FUNCTION public.list_screen_display_sub_departments(uuid) TO anon;

-- 3) Future functions keep working
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;

-- 4) Realtime for assignment team changes (kiosk auto-refresh)
ALTER TABLE public.assignments_employees REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'assignments_employees'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments_employees';
  END IF;
END;
$$;