
-- ============================================================
-- Security Hardening Migration
-- - Removes overly permissive RLS policies on profiles, cars
-- - Adds RLS gating on realtime.messages
-- - Locks down 7 SECURITY DEFINER diagnostic functions to admins
-- - Removes anonymous GraphQL/PostgREST exposure
-- - Scopes avatar listing to authenticated users
-- ============================================================

-- ---------- 1. profiles: drop over-permissive policies ----------
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;  -- public-role duplicate
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;  -- public-role duplicate

-- Re-create authenticated-only insert/update so owners keep working
-- (authenticated-role versions already exist per schema; these are no-ops if so)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE TO authenticated
      USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ---------- 2. cars: drop over-permissive policies ----------
DROP POLICY IF EXISTS "Users can view all cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can manage cars" ON public.cars;

-- ---------- 3. realtime.messages: gate to authenticated ----------
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_receive_broadcasts" ON realtime.messages;
CREATE POLICY "authenticated_can_receive_broadcasts"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_can_send_broadcasts" ON realtime.messages;
CREATE POLICY "authenticated_can_send_broadcasts"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: Underlying postgres_changes events are still filtered by each table's
-- RLS, so authenticated users only receive rows they can actually read.

-- ---------- 4. storage.objects: scope avatar listing ----------
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
CREATE POLICY "Authenticated users can view avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
-- Public CDN URLs (getPublicUrl) keep working because the bucket itself is public.

-- ---------- 5. Lock down SECURITY DEFINER diagnostic functions ----------
-- Add admin guard inside each function and revoke public execute.

CREATE OR REPLACE FUNCTION public.check_system_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  SELECT jsonb_build_object(
    'tables', (SELECT count(*) FROM pg_tables WHERE schemaname='public'),
    'functions', (SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace),
    'policies', (SELECT count(*) FROM pg_policies WHERE schemaname='public'),
    'checked_at', now()
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_database_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  SELECT jsonb_build_object(
    'status', 'ok',
    'tables', (SELECT count(*) FROM pg_tables WHERE schemaname='public'),
    'indexes', (SELECT count(*) FROM pg_indexes WHERE schemaname='public'),
    'policies', (SELECT count(*) FROM pg_policies WHERE schemaname='public'),
    'functions', (SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace),
    'checked_at', now()
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.test_query_performance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  start_ts timestamptz;
  result jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  start_ts := clock_timestamp();
  PERFORM count(*) FROM public.assignments;
  result := jsonb_build_object(
    'status', 'ok',
    'duration_ms', extract(milliseconds FROM (clock_timestamp() - start_ts)),
    'checked_at', now()
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_data_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  orphan_assignments_employees int;
  result jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  SELECT count(*) INTO orphan_assignments_employees
  FROM public.assignments_employees ae
  LEFT JOIN public.assignments a ON a.id = ae.assignment_id
  WHERE a.id IS NULL;

  result := jsonb_build_object(
    'status', 'ok',
    'orphan_assignments_employees', orphan_assignments_employees,
    'checked_at', now()
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.schedule_maintenance_tasks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  PERFORM public.validate_data_integrity();
  result := jsonb_build_object(
    'status', 'ok',
    'maintenance_run_at', now()
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.final_database_optimization()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  result := jsonb_build_object(
    'status', 'ok',
    'optimized_at', now(),
    'monitoring', 'Use public.validate_database_health() for health checks',
    'performance', 'Use public.test_query_performance() for performance monitoring'
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_database_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  SELECT jsonb_build_object(
    'database', current_database(),
    'tables', (SELECT count(*) FROM pg_tables WHERE schemaname='public'),
    'functions', (SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace),
    'policies', (SELECT count(*) FROM pg_policies WHERE schemaname='public'),
    'generated_at', now()
  ) INTO result;
  RETURN result;
END;
$$;

-- Revoke public execute on diagnostic functions
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'check_system_health()',
    'validate_database_health()',
    'test_query_performance()',
    'validate_data_integrity()',
    'schedule_maintenance_tasks()',
    'final_database_optimization()',
    'generate_database_summary()'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', fn);
  END LOOP;
END $$;

-- ---------- 6. Revoke anon SELECT on public schema (GraphQL exposure) ----------
-- App uses authenticated JWTs; anon role does not need table read access.
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM anon;

-- Keep authenticated SELECT on app tables; revoke only on internal log tables
REVOKE SELECT ON public.logs FROM authenticated;
REVOKE SELECT ON public.logs_partitioned FROM authenticated;
REVOKE SELECT ON public.logs_y2025m07 FROM authenticated;
REVOKE SELECT ON public.logs_y2025m08 FROM authenticated;
REVOKE SELECT ON public.system_cleanup_tracking FROM authenticated;
-- RLS on these tables already restricts to admins; this just hides them from
-- GraphQL discovery for non-admin authenticated users.
