-- SECURITY FIX: Restrict access to cars table and protect fuel card codes
-- Replace the overly permissive cars_public_info_policy with proper authentication

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "cars_public_info_policy" ON public.cars;

-- Create new restrictive policies for cars table
CREATE POLICY "cars_authenticated_select_policy" 
ON public.cars 
FOR SELECT 
TO authenticated
USING (true);

-- Create policy for car modifications (admin/skadeleder only)
CREATE POLICY "cars_admin_modify_policy" 
ON public.cars 
FOR ALL 
TO authenticated
USING (is_admin_or_skadeleder())
WITH CHECK (is_admin_or_skadeleder());

-- Update the conditional access function to be more secure
CREATE OR REPLACE FUNCTION public.get_car_with_conditional_access(car_row cars)
 RETURNS TABLE(
   id uuid, 
   name text, 
   car_number text, 
   number_plate text, 
   has_trailer_hitch boolean, 
   is_available boolean, 
   notes text, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone, 
   fuel_card_code text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  can_view_fuel boolean;
  user_authenticated boolean;
BEGIN
  -- Check if user is authenticated
  SELECT auth.uid() IS NOT NULL INTO user_authenticated;
  
  -- If not authenticated, return empty result
  IF NOT user_authenticated THEN
    RETURN;
  END IF;
  
  -- Check if current user can view fuel codes
  SELECT public.can_view_fuel_codes() INTO can_view_fuel;
  
  -- Log access attempt for fuel card codes
  IF can_view_fuel THEN
    PERFORM public.log_security_event_safe(
      'fuel_card_access',
      format('User accessed fuel card code for car %s', car_row.name),
      jsonb_build_object(
        'car_id', car_row.id,
        'car_name', car_row.name,
        'user_id', auth.uid()
      ),
      'info'
    );
  END IF;
  
  RETURN QUERY SELECT 
    car_row.id,
    car_row.name,
    car_row.car_number,
    car_row.number_plate,
    car_row.has_trailer_hitch,
    car_row.is_available,
    car_row.notes,
    car_row.created_at,
    car_row.updated_at,
    CASE 
      WHEN can_view_fuel THEN car_row.fuel_card_code
      ELSE '***RESTRICTED***'::text
    END as fuel_card_code;
END;
$function$;

-- Create function to safely fetch cars with conditional access
CREATE OR REPLACE FUNCTION public.get_cars_with_security()
 RETURNS TABLE(
   id uuid, 
   name text, 
   car_number text, 
   number_plate text, 
   has_trailer_hitch boolean, 
   is_available boolean, 
   notes text, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone, 
   fuel_card_code text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to access vehicle data';
  END IF;
  
  -- Log the data access attempt
  PERFORM public.log_security_event_safe(
    'cars_data_access',
    'User accessed cars data',
    jsonb_build_object(
      'user_id', auth.uid(),
      'access_type', 'bulk_cars_fetch'
    ),
    'info'
  );
  
  RETURN QUERY 
  SELECT (public.get_car_with_conditional_access(c)).*
  FROM public.cars c
  ORDER BY c.name;
END;
$function$;

-- Enhanced security logging for unauthorized access attempts
CREATE OR REPLACE FUNCTION public.log_unauthorized_car_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Log unauthorized access attempts
  PERFORM public.log_security_event_safe(
    'unauthorized_car_access_attempt',
    'Unauthorized attempt to access car data',
    jsonb_build_object(
      'attempted_car_id', COALESCE(NEW.id, OLD.id),
      'user_id', auth.uid(),
      'operation', TG_OP
    ),
    'warning'
  );
  
  -- Block the operation for non-authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for security logging
DROP TRIGGER IF EXISTS cars_security_log_trigger ON public.cars;
CREATE TRIGGER cars_security_log_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.cars
  FOR EACH ROW
  WHEN (auth.uid() IS NULL OR NOT is_admin_or_skadeleder())
  EXECUTE FUNCTION public.log_unauthorized_car_access();

-- Strengthen profile access logging
CREATE OR REPLACE FUNCTION public.log_profile_access_attempt(profile_id uuid, access_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  current_user_id uuid;
  is_authorized boolean := false;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if access is authorized
  IF current_user_id = profile_id OR is_admin_or_skadeleder() THEN
    is_authorized := true;
  END IF;
  
  -- Log the access attempt
  PERFORM public.log_security_event_safe(
    'profile_access_attempt',
    format('Profile access attempt: %s for profile %s', access_type, profile_id),
    jsonb_build_object(
      'target_profile_id', profile_id,
      'accessing_user_id', current_user_id,
      'access_type', access_type,
      'authorized', is_authorized
    ),
    CASE WHEN is_authorized THEN 'info' ELSE 'warning' END
  );
END;
$function$;