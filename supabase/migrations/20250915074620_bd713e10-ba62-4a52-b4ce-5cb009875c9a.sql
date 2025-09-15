-- First drop the existing function, then recreate it with show_in_planner field
DROP FUNCTION IF EXISTS public.get_car_with_conditional_access(cars);

CREATE OR REPLACE FUNCTION public.get_car_with_conditional_access(car_row cars)
 RETURNS TABLE(id uuid, name text, car_number text, number_plate text, has_trailer_hitch boolean, is_available boolean, show_in_planner boolean, notes text, created_at timestamp with time zone, updated_at timestamp with time zone, fuel_card_code text)
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
    car_row.show_in_planner,
    car_row.notes,
    car_row.created_at,
    car_row.updated_at,
    CASE 
      WHEN can_view_fuel THEN car_row.fuel_card_code
      ELSE '***RESTRICTED***'::text
    END as fuel_card_code;
END;
$function$;