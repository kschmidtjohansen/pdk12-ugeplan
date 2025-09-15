-- Fix function signature mismatch by updating get_cars_with_security to include show_in_planner
DROP FUNCTION IF EXISTS public.get_cars_with_security();

CREATE OR REPLACE FUNCTION public.get_cars_with_security()
 RETURNS TABLE(id uuid, name text, car_number text, number_plate text, has_trailer_hitch boolean, is_available boolean, show_in_planner boolean, notes text, created_at timestamp with time zone, updated_at timestamp with time zone, fuel_card_code text)
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