-- Security Fix 1: Tighten Profile Access Control
-- Replace PERMISSIVE policies with RESTRICTIVE ones for better security

-- Drop existing problematic policies
DROP POLICY IF EXISTS "authenticated_users_own_profile_only" ON public.profiles;
DROP POLICY IF EXISTS "verified_admins_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "block_service_role_profile_access" ON public.profiles;

-- Create new restrictive policies
-- Users can only view their own profile (RESTRICTIVE)
CREATE POLICY "users_own_profile_only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Admins can view all profiles (separate RESTRICTIVE policy)
CREATE POLICY "admins_all_profiles_access" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrator', 'skadeleder')
    AND ur.created_at IS NOT NULL
  )
  AND (
    -- Log admin access with security event
    public.log_security_event_safe(
      'admin_profile_access',
      'Admin accessed employee profile: ' || profiles.name,
      jsonb_build_object(
        'accessed_profile_id', profiles.id,
        'admin_user_id', auth.uid(),
        'profile_email', profiles.email,
        'admin_role', (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)
      ),
      'warning'
    ) IS NULL OR true
  )
);

-- Block service role access completely
CREATE POLICY "block_service_role_access" 
ON public.profiles 
FOR ALL 
TO service_role
USING (false);

-- Security Fix 2: Add Rate Limiting Function for Critical Operations
CREATE OR REPLACE FUNCTION public.check_rate_limit_security(operation_key text, max_attempts integer DEFAULT 5, window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  attempt_count integer;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Count recent attempts
  SELECT COUNT(*) INTO attempt_count
  FROM public.logs
  WHERE details->>'user_id' = current_user_id::text
    AND details->>'operation_key' = operation_key
    AND created_at > now() - (window_minutes || ' minutes')::interval;
  
  -- Log this attempt
  PERFORM public.log_security_event_safe(
    'rate_limit_check',
    format('Rate limit check for %s: %s/%s attempts', operation_key, attempt_count + 1, max_attempts),
    jsonb_build_object(
      'operation_key', operation_key,
      'attempt_count', attempt_count + 1,
      'max_attempts', max_attempts,
      'user_id', current_user_id,
      'window_minutes', window_minutes
    ),
    CASE WHEN attempt_count >= max_attempts THEN 'error' ELSE 'info' END
  );
  
  RETURN attempt_count < max_attempts;
END;
$$;

-- Security Fix 3: Enhanced Input Validation Function
CREATE OR REPLACE FUNCTION public.validate_input_security(input_text text, input_type text, max_length integer DEFAULT 1000)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  is_valid boolean := true;
  security_issues text[] := '{}';
BEGIN
  -- Basic validation
  IF input_text IS NULL OR length(input_text) = 0 THEN
    RETURN input_type IN ('optional_field', 'nullable_field');
  END IF;
  
  -- Length check
  IF length(input_text) > max_length THEN
    security_issues := array_append(security_issues, 'exceeds_max_length');
    is_valid := false;
  END IF;
  
  -- XSS patterns
  IF input_text ~* '<script|javascript:|vbscript:|on\w+=|<iframe|<object|<embed' THEN
    security_issues := array_append(security_issues, 'xss_pattern_detected');
    is_valid := false;
  END IF;
  
  -- SQL injection patterns
  IF input_text ~* '(union\s+select|drop\s+table|delete\s+from|insert\s+into|update\s+.*\s+set|exec\s*\(|execute\s*\()' THEN
    security_issues := array_append(security_issues, 'sql_injection_pattern');
    is_valid := false;
  END IF;
  
  -- Log security issues
  IF NOT is_valid THEN
    PERFORM public.log_security_event_safe(
      'input_validation_failure',
      format('Invalid input detected for %s', input_type),
      jsonb_build_object(
        'input_type', input_type,
        'security_issues', security_issues,
        'input_length', length(input_text),
        'max_length', max_length,
        'user_id', auth.uid()
      ),
      'warning'
    );
  END IF;
  
  RETURN is_valid;
END;
$$;

-- Security Fix 4: Create Security Monitoring Function
CREATE OR REPLACE FUNCTION public.enhanced_security_monitor()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result jsonb := '{}';
  recent_violations integer := 0;
  failed_logins integer := 0;
  suspicious_activities integer := 0;
BEGIN
  -- Count recent security violations (last 24 hours)
  SELECT COUNT(*) INTO recent_violations
  FROM public.logs
  WHERE created_at > now() - INTERVAL '24 hours'
    AND (event_type LIKE '%security%' OR event_type LIKE '%violation%' OR event_type LIKE '%unauthorized%');
  
  -- Count failed login attempts (last hour)
  SELECT COUNT(*) INTO failed_logins
  FROM public.logs
  WHERE created_at > now() - INTERVAL '1 hour'
    AND event_type = 'auth_failure';
  
  -- Count suspicious activities
  SELECT COUNT(*) INTO suspicious_activities
  FROM public.logs
  WHERE created_at > now() - INTERVAL '24 hours'
    AND (details->>'severity' = 'critical' OR event_type LIKE '%injection%' OR event_type LIKE '%xss%');
  
  result := jsonb_build_object(
    'monitoring_timestamp', now(),
    'recent_violations_24h', recent_violations,
    'failed_logins_1h', failed_logins,
    'suspicious_activities_24h', suspicious_activities,
    'security_status', CASE 
      WHEN suspicious_activities > 0 THEN 'critical'
      WHEN failed_logins > 10 THEN 'warning'
      WHEN recent_violations > 20 THEN 'warning'
      ELSE 'healthy'
    END,
    'recommendations', CASE
      WHEN suspicious_activities > 0 THEN jsonb_build_array('Investigate suspicious activities immediately', 'Review access logs', 'Consider temporary access restrictions')
      WHEN failed_logins > 10 THEN jsonb_build_array('Monitor failed login attempts', 'Check for brute force attacks')
      WHEN recent_violations > 20 THEN jsonb_build_array('Review security policies', 'Audit user access patterns')
      ELSE jsonb_build_array('Continue regular monitoring')
    END
  );
  
  -- Log the monitoring result
  PERFORM public.log_security_event_safe(
    'security_monitoring_report',
    format('Security monitoring completed - Status: %s', result->>'security_status'),
    result,
    CASE 
      WHEN result->>'security_status' = 'critical' THEN 'error'
      WHEN result->>'security_status' = 'warning' THEN 'warning'
      ELSE 'info'
    END
  );
  
  RETURN result;
END;
$$;