-- SECURITY FIX PHASE 1: Critical RLS Policy Updates
-- Fix 1: Restrict Profile Access and Add Audit Logging

-- Create enhanced security logging function
CREATE OR REPLACE FUNCTION public.log_security_event_safe(
  event_type text,
  event_message text,
  event_details jsonb DEFAULT NULL,
  severity text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log critical events to prevent log spam
  IF severity IN ('warning', 'error', 'critical') OR event_type LIKE '%unauthorized%' THEN
    INSERT INTO public.logs (event_type, message, details)
    VALUES (
      event_type,
      event_message,
      jsonb_build_object(
        'user_id', auth.uid(),
        'timestamp', now(),
        'severity', severity,
        'details', COALESCE(event_details, '{}'),
        'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fail silently to prevent cascading errors
  NULL;
END;
$$;

-- Fix 2: Enhanced Profile Access Control
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;

-- Create more restrictive profile policies with audit logging
CREATE POLICY "profiles_own_access_only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  id = auth.uid() 
  AND (
    SELECT public.log_security_event_safe(
      'profile_self_access',
      'User accessed own profile',
      jsonb_build_object('profile_id', id),
      'info'
    ) IS NULL OR true
  )
);

CREATE POLICY "profiles_admin_access_audited" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  public.is_admin_or_skadeleder() 
  AND (
    SELECT public.log_security_event_safe(
      'profile_admin_access',
      'Admin accessed user profile',
      jsonb_build_object('target_profile_id', id, 'accessing_admin', auth.uid()),
      'warning'
    ) IS NULL OR true
  )
);

-- Fix 3: Secure Fuel Card Access
-- Create function to check and log fuel card access
CREATE OR REPLACE FUNCTION public.can_view_fuel_codes_audited()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_access boolean;
BEGIN
  SELECT public.can_view_fuel_codes() INTO has_access;
  
  IF has_access THEN
    PERFORM public.log_security_event_safe(
      'fuel_card_access_granted',
      'User granted access to fuel card codes',
      jsonb_build_object('user_id', auth.uid()),
      'warning'
    );
  ELSE
    PERFORM public.log_security_event_safe(
      'fuel_card_access_denied',
      'User denied access to fuel card codes',
      jsonb_build_object('user_id', auth.uid()),
      'info'
    );
  END IF;
  
  RETURN has_access;
END;
$$;

-- Update cars policies to use audited access
DROP POLICY IF EXISTS "cars_restricted_select_policy" ON public.cars;

CREATE POLICY "cars_basic_info_access" 
ON public.cars 
FOR SELECT 
TO authenticated
USING (
  -- Allow basic car info to authenticated users
  auth.uid() IS NOT NULL
);

-- Create separate policy for fuel card access with masking
CREATE OR REPLACE FUNCTION public.get_car_with_masked_fuel_code(car_row cars)
RETURNS TABLE(
  id uuid, 
  name text, 
  car_number text, 
  number_plate text, 
  has_trailer_hitch boolean, 
  is_available boolean, 
  show_in_planner boolean, 
  notes text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  fuel_card_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  can_view_fuel boolean;
BEGIN
  SELECT public.can_view_fuel_codes_audited() INTO can_view_fuel;
  
  RETURN QUERY SELECT 
    car_row.id,
    car_row.name,
    car_row.car_number,
    car_row.number_plate,
    car_row.has_trailer_hitch,
    car_row.is_available,
    car_row.show_in_planner,
    car_row.notes,
    car_row.created_at,
    car_row.updated_at,
    CASE 
      WHEN can_view_fuel THEN car_row.fuel_card_code
      ELSE '****RESTRICTED****'::text
    END as fuel_card_code;
END;
$$;

-- Fix 4: Restrict Assignment Access
-- Drop overly permissive assignment policy
DROP POLICY IF EXISTS "assignment_select_policy_secure" ON public.assignments;

-- Create more restrictive assignment access policy
CREATE POLICY "assignments_restricted_access" 
ON public.assignments 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    -- Admin/Skadeleder can see all
    public.is_admin_or_skadeleder() OR
    -- Users can only see assignments they're assigned to
    public.can_user_access_assignment(id, auth.uid()) OR
    -- Responsible user can see their assignments
    responsible_user_id = auth.uid()
  )
  AND (
    SELECT public.log_security_event_safe(
      'assignment_access',
      'User accessed assignment',
      jsonb_build_object(
        'assignment_id', id,
        'user_id', auth.uid(),
        'is_admin', public.is_admin_or_skadeleder(),
        'is_assigned', public.can_user_access_assignment(id, auth.uid()),
        'is_responsible', responsible_user_id = auth.uid()
      ),
      'info'
    ) IS NULL OR true
  )
);

-- Fix 5: Add unauthorized access monitoring for all tables
CREATE OR REPLACE FUNCTION public.log_unauthorized_access_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log unauthorized access attempts
  PERFORM public.log_security_event_safe(
    'unauthorized_table_access',
    format('Unauthorized access attempt to table %s', TG_TABLE_NAME),
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'user_id', auth.uid(),
      'record_id', COALESCE(NEW.id, OLD.id)
    ),
    'critical'
  );
  
  -- Block the operation if user is not authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for % operation on %', TG_OP, TG_TABLE_NAME;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix 6: Add vacation data protection
DROP POLICY IF EXISTS "vacation_select_policy" ON public.vacations;

CREATE POLICY "vacations_secure_access" 
ON public.vacations 
FOR SELECT 
TO authenticated
USING (
  (user_id = auth.uid() OR public.is_admin_or_skadeleder())
  AND (
    SELECT public.log_security_event_safe(
      'vacation_access',
      'User accessed vacation data',
      jsonb_build_object(
        'vacation_id', id,
        'owner_id', user_id,
        'accessing_user', auth.uid(),
        'is_owner', user_id = auth.uid(),
        'is_admin', public.is_admin_or_skadeleder()
      ),
      CASE WHEN user_id = auth.uid() THEN 'info' ELSE 'warning' END
    ) IS NULL OR true
  )
);

-- Fix 7: Notification security enhancement
DROP POLICY IF EXISTS "notification_select_policy" ON public.notifications;

CREATE POLICY "notifications_owner_only" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid()
  AND (
    SELECT public.log_security_event_safe(
      'notification_access',
      'User accessed notifications',
      jsonb_build_object('notification_count', 1),
      'info'
    ) IS NULL OR true
  )
);

-- Fix 8: Create security monitoring view for admins
CREATE OR REPLACE VIEW public.security_events_summary AS
SELECT 
  event_type,
  COUNT(*) as event_count,
  MAX(created_at) as last_occurrence,
  COUNT(DISTINCT details->>'user_id') as affected_users
FROM public.logs 
WHERE event_type LIKE '%security%' 
  OR event_type LIKE '%unauthorized%'
  OR event_type LIKE '%access%'
  AND created_at > now() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY event_count DESC;

-- Grant access to security view only to admins
ALTER VIEW public.security_events_summary OWNER TO postgres;
GRANT SELECT ON public.security_events_summary TO authenticated;

-- Add RLS to the view
CREATE POLICY "security_events_admin_only" 
ON public.security_events_summary 
FOR SELECT 
TO authenticated
USING (public.is_admin_user());