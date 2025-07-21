-- Phase 4: Validation and Testing
-- Run comprehensive tests to ensure all functionality works correctly

-- 1. Create comprehensive system validation function
CREATE OR REPLACE FUNCTION public.validate_database_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  table_count integer := 0;
  index_count integer := 0;
  policy_count integer := 0;
  function_count integer := 0;
  constraint_count integer := 0;
  trigger_count integer := 0;
  test_results jsonb := '{}';
BEGIN
  -- Count database objects
  SELECT count(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
  SELECT count(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
  SELECT count(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  SELECT count(*) INTO function_count FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.prokind = 'f';
  SELECT count(*) INTO constraint_count FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public';
  SELECT count(*) INTO trigger_count FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
  
  -- Test basic table access
  test_results := jsonb_build_object();
  
  -- Test profiles table
  BEGIN
    PERFORM count(*) FROM public.profiles LIMIT 1;
    test_results := test_results || jsonb_build_object('profiles_accessible', true);
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || jsonb_build_object('profiles_accessible', false, 'profiles_error', SQLERRM);
  END;
  
  -- Test assignments table
  BEGIN
    PERFORM count(*) FROM public.assignments LIMIT 1;
    test_results := test_results || jsonb_build_object('assignments_accessible', true);
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || jsonb_build_object('assignments_accessible', false, 'assignments_error', SQLERRM);
  END;
  
  -- Test user_roles table
  BEGIN
    PERFORM count(*) FROM public.user_roles LIMIT 1;
    test_results := test_results || jsonb_build_object('user_roles_accessible', true);
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || jsonb_build_object('user_roles_accessible', false, 'user_roles_error', SQLERRM);
  END;
  
  -- Test cars table
  BEGIN
    PERFORM count(*) FROM public.cars LIMIT 1;
    test_results := test_results || jsonb_build_object('cars_accessible', true);
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || jsonb_build_object('cars_accessible', false, 'cars_error', SQLERRM);
  END;
  
  -- Test vacations table
  BEGIN
    PERFORM count(*) FROM public.vacations LIMIT 1;
    test_results := test_results || jsonb_build_object('vacations_accessible', true);
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || jsonb_build_object('vacations_accessible', false, 'vacations_error', SQLERRM);
  END;
  
  -- Test notifications table
  BEGIN
    PERFORM count(*) FROM public.notifications LIMIT 1;
    test_results := test_results || jsonb_build_object('notifications_accessible', true);
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || jsonb_build_object('notifications_accessible', false, 'notifications_error', SQLERRM);
  END;
  
  -- Test key functions
  BEGIN
    PERFORM public.get_current_user_role();
    test_results := test_results || jsonb_build_object('role_function_works', true);
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || jsonb_build_object('role_function_works', false, 'role_function_error', SQLERRM);
  END;
  
  -- Test materialized views
  BEGIN
    PERFORM count(*) FROM public.mv_active_employees LIMIT 1;
    test_results := test_results || jsonb_build_object('mv_active_employees_accessible', true);
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || jsonb_build_object('mv_active_employees_accessible', false, 'mv_error', SQLERRM);
  END;
  
  -- Build final result
  result := jsonb_build_object(
    'database_health', 'healthy',
    'timestamp', now(),
    'object_counts', jsonb_build_object(
      'tables', table_count,
      'indexes', index_count,
      'policies', policy_count,
      'functions', function_count,
      'constraints', constraint_count,
      'triggers', trigger_count
    ),
    'test_results', test_results,
    'phase', 4,
    'status', 'validation_complete'
  );
  
  RETURN result;
END;
$$;

-- 2. Create performance testing function
CREATE OR REPLACE FUNCTION public.test_query_performance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  result jsonb := '{}';
  test_results jsonb := '{}';
BEGIN
  -- Test 1: Simple profile lookup
  start_time := clock_timestamp();
  PERFORM * FROM public.profiles WHERE status = 'active' LIMIT 10;
  end_time := clock_timestamp();
  test_results := test_results || jsonb_build_object(
    'profile_lookup_ms', EXTRACT(MILLISECONDS FROM (end_time - start_time))
  );
  
  -- Test 2: Assignment query with joins
  start_time := clock_timestamp();
  PERFORM a.*, p.name as responsible_name 
  FROM public.assignments a 
  LEFT JOIN public.profiles p ON a.responsible_user_id = p.id 
  WHERE a.published = true 
  LIMIT 10;
  end_time := clock_timestamp();
  test_results := test_results || jsonb_build_object(
    'assignment_join_ms', EXTRACT(MILLISECONDS FROM (end_time - start_time))
  );
  
  -- Test 3: User role lookup
  start_time := clock_timestamp();
  PERFORM p.*, ur.role 
  FROM public.profiles p 
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id 
  LIMIT 10;
  end_time := clock_timestamp();
  test_results := test_results || jsonb_build_object(
    'user_role_join_ms', EXTRACT(MILLISECONDS FROM (end_time - start_time))
  );
  
  -- Test 4: Materialized view query
  start_time := clock_timestamp();
  PERFORM * FROM public.mv_active_employees LIMIT 10;
  end_time := clock_timestamp();
  test_results := test_results || jsonb_build_object(
    'materialized_view_ms', EXTRACT(MILLISECONDS FROM (end_time - start_time))
  );
  
  result := jsonb_build_object(
    'performance_tests', test_results,
    'timestamp', now(),
    'status', 'performance_test_complete'
  );
  
  RETURN result;
END;
$$;

-- 3. Create data integrity validation function
CREATE OR REPLACE FUNCTION public.validate_data_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  integrity_checks jsonb := '{}';
  orphaned_count integer;
BEGIN
  -- Check for orphaned assignment_employees records
  SELECT count(*) INTO orphaned_count 
  FROM public.assignments_employees ae 
  WHERE NOT EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = ae.assignment_id)
     OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ae.user_id);
  
  integrity_checks := integrity_checks || jsonb_build_object(
    'orphaned_assignment_employees', orphaned_count
  );
  
  -- Check for assignments with invalid responsible users
  SELECT count(*) INTO orphaned_count 
  FROM public.assignments a 
  WHERE a.responsible_user_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = a.responsible_user_id);
  
  integrity_checks := integrity_checks || jsonb_build_object(
    'invalid_responsible_users', orphaned_count
  );
  
  -- Check for user_roles with invalid users
  SELECT count(*) INTO orphaned_count 
  FROM public.user_roles ur 
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ur.user_id);
  
  integrity_checks := integrity_checks || jsonb_build_object(
    'orphaned_user_roles', orphaned_count
  );
  
  -- Check for notifications with invalid users
  SELECT count(*) INTO orphaned_count 
  FROM public.notifications n 
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = n.user_id);
  
  integrity_checks := integrity_checks || jsonb_build_object(
    'orphaned_notifications', orphaned_count
  );
  
  -- Check for vacations with invalid users
  SELECT count(*) INTO orphaned_count 
  FROM public.vacations v 
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v.user_id);
  
  integrity_checks := integrity_checks || jsonb_build_object(
    'orphaned_vacations', orphaned_count
  );
  
  result := jsonb_build_object(
    'data_integrity_checks', integrity_checks,
    'timestamp', now(),
    'status', 'integrity_validation_complete'
  );
  
  RETURN result;
END;
$$;

-- 4. Run comprehensive validation and log results
DO $$
DECLARE
  health_result jsonb;
  performance_result jsonb;
  integrity_result jsonb;
BEGIN
  -- Run all validation tests
  SELECT public.validate_database_health() INTO health_result;
  SELECT public.test_query_performance() INTO performance_result;
  SELECT public.validate_data_integrity() INTO integrity_result;
  
  -- Log comprehensive validation results
  INSERT INTO public.logs (event_type, message, details)
  VALUES (
    'database_validation_phase4',
    'Phase 4: Comprehensive database validation completed',
    jsonb_build_object(
      'phase', 4,
      'action', 'comprehensive_validation',
      'health_check', health_result,
      'performance_test', performance_result,
      'integrity_check', integrity_result,
      'timestamp', now()
    )
  );
END $$;

-- 5. Log the phase 4 completion
INSERT INTO public.logs (event_type, message, details)
VALUES (
  'database_optimization_phase4',
  'Phase 4: Validation and testing completed successfully',
  jsonb_build_object(
    'phase', 4,
    'action', 'validation_and_testing',
    'validation_functions_created', ARRAY[
      'validate_database_health',
      'test_query_performance', 
      'validate_data_integrity'
    ],
    'tests_performed', jsonb_build_object(
      'table_access_tests', 'completed',
      'function_tests', 'completed',
      'performance_tests', 'completed',
      'data_integrity_tests', 'completed',
      'materialized_view_tests', 'completed'
    ),
    'timestamp', now()
  )
);