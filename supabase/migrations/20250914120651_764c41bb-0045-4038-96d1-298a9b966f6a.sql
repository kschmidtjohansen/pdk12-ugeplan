-- Fix critical security issue: Restrict case mapping access to authorized users only
-- Drop all existing policies to avoid conflicts

-- Drop all policies on case_onedrive_mappings
DROP POLICY IF EXISTS "All authenticated users can view OneDrive mappings" ON public.case_onedrive_mappings;
DROP POLICY IF EXISTS "Admin and skadeleder can manage OneDrive mappings" ON public.case_onedrive_mappings;

-- Drop all policies on case_folder_mappings  
DROP POLICY IF EXISTS "All authenticated users can view case folder mappings" ON public.case_folder_mappings;
DROP POLICY IF EXISTS "Admin and skadeleder can manage case folder mappings" ON public.case_folder_mappings;

-- Create function to check if user can access case data
CREATE OR REPLACE FUNCTION public.can_access_case_data(case_number_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Allow admin and skadeleder full access
  IF public.is_admin_or_skadeleder() THEN
    RETURN true;
  END IF;
  
  -- Allow access if user is assigned to any assignment with this case number
  RETURN EXISTS (
    SELECT 1 
    FROM public.assignments a
    JOIN public.assignments_employees ae ON a.id = ae.assignment_id
    WHERE a.case_number = case_number_param 
    AND ae.user_id = auth.uid()
  );
END;
$$;

-- Create new restrictive policies for case_onedrive_mappings
CREATE POLICY "Restricted OneDrive mappings select" 
ON public.case_onedrive_mappings 
FOR SELECT 
TO authenticated
USING (public.can_access_case_data(case_number));

CREATE POLICY "Admin OneDrive mappings management" 
ON public.case_onedrive_mappings 
FOR ALL 
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- Create new restrictive policies for case_folder_mappings
CREATE POLICY "Restricted folder mappings select" 
ON public.case_folder_mappings 
FOR SELECT 
TO authenticated
USING (public.can_access_case_data(case_number));

CREATE POLICY "Admin folder mappings management" 
ON public.case_folder_mappings 
FOR ALL 
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- Create enhanced security audit function
CREATE OR REPLACE FUNCTION public.log_security_event_safe(
  event_type text,
  event_message text,
  event_details jsonb DEFAULT '{}',
  severity text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Enhanced logging with user context
  INSERT INTO public.logs (event_type, message, details)
  VALUES (
    event_type,
    event_message,
    jsonb_build_object(
      'user_id', auth.uid(),
      'user_email', (SELECT email FROM public.profiles WHERE id = auth.uid()),
      'timestamp', now(),
      'severity', severity,
      'details', event_details
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Fail silently to prevent cascading errors
  NULL;
END;
$$;

-- Create security health check function
CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result jsonb := '{}';
  admin_count integer := 0;
  recent_security_events integer := 0;
  failed_accesses integer := 0;
BEGIN
  -- Check admin user count
  SELECT count(*) INTO admin_count 
  FROM public.user_roles 
  WHERE role = 'administrator';
  
  -- Check recent security events (last 24 hours)
  SELECT count(*) INTO recent_security_events
  FROM public.logs 
  WHERE created_at > now() - INTERVAL '24 hours'
    AND event_type LIKE '%security%';
  
  -- Check failed access attempts
  SELECT count(*) INTO failed_accesses
  FROM public.logs 
  WHERE created_at > now() - INTERVAL '24 hours'
    AND (event_type LIKE '%unauthorized%' OR event_type LIKE '%access_denied%');
  
  result := jsonb_build_object(
    'admin_count', admin_count,
    'recent_security_events', recent_security_events,
    'failed_access_attempts', failed_accesses,
    'security_score', CASE 
      WHEN failed_accesses = 0 AND admin_count BETWEEN 1 AND 3 THEN 95
      WHEN failed_accesses < 5 AND admin_count BETWEEN 1 AND 5 THEN 85
      WHEN failed_accesses < 10 THEN 75
      ELSE 60
    END,
    'timestamp', now(),
    'recommendations', CASE 
      WHEN admin_count = 0 THEN jsonb_build_array('No administrators found - security risk!')
      WHEN admin_count > 5 THEN jsonb_build_array('Too many administrators - review access')
      WHEN failed_accesses > 10 THEN jsonb_build_array('High number of failed access attempts - investigate')
      ELSE jsonb_build_array('Security status appears normal')
    END
  );
  
  RETURN result;
END;
$$;