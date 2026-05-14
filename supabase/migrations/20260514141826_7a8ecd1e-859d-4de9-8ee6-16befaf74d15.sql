-- Revoke EXECUTE on all SECURITY DEFINER functions in public schema from anon role.
-- Safe: authenticated, service_role and postgres retain access.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT n.nspname, p.proname,
           pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, PUBLIC',
                   rec.nspname, rec.proname, rec.args);
  END LOOP;
END $$;

-- Extra hardening: explicitly revoke high-risk diagnostic / maintenance functions
-- from authenticated as well (they should only be callable by service_role / admins
-- via SECURITY DEFINER wrappers that perform their own role check).
DO $$
DECLARE
  fn TEXT;
  funcs TEXT[] := ARRAY[
    'schedule_maintenance_tasks',
    'validate_database_health',
    'test_query_performance',
    'validate_data_integrity',
    'final_database_optimization',
    'generate_database_summary'
  ];
BEGIN
  FOREACH fn IN ARRAY funcs LOOP
    -- revoke from authenticated for every overload of the function name
    PERFORM 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = fn;
    IF FOUND THEN
      EXECUTE format(
        'DO $inner$ DECLARE r RECORD; BEGIN
           FOR r IN SELECT pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
                    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = ''public'' AND p.proname = %L
           LOOP
             EXECUTE format(''REVOKE EXECUTE ON FUNCTION public.%I(%%s) FROM authenticated'', r.args);
           END LOOP;
         END $inner$;', fn, fn);
    END IF;
  END LOOP;
END $$;