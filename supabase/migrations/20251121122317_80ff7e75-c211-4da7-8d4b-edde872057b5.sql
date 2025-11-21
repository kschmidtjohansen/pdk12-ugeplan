-- Fix clear_sick_leave_data function to reliably clear sick leave data for admins
-- Uses TRUNCATE with SECURITY DEFINER to bypass RLS after admin verification

CREATE OR REPLACE FUNCTION public.clear_sick_leave_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Sikkerhedstjek: kun administratorer må rydde data
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can clear sick leave data';
  END IF;

  -- Tæl hvor mange records der findes, inden vi sletter
  SELECT COUNT(*) INTO deleted_count
  FROM public.sick_leave_records;

  -- Ryd alle relaterede data i én operation
  -- Hvis der er FK med ON DELETE CASCADE fra sick_leave_notifications_sent
  -- til sick_leave_records, er det nok kun at rydde sick_leave_records.
  -- For sikkerheds skyld kan vi også eksplicit rydde notifications-tabellen først.
  BEGIN
    TRUNCATE TABLE public.sick_leave_notifications_sent RESTART IDENTITY;
  EXCEPTION
    WHEN undefined_table THEN
      -- Hvis tabellen ikke findes i alle miljøer, ignorerer vi dette
      NULL;
  END;

  TRUNCATE TABLE public.sick_leave_records RESTART IDENTITY CASCADE;

  -- Log handlingen
  PERFORM public.log_security_event_safe(
    'sick_leave_data_cleared',
    format(
      'Admin cleared all sick leave data (%s records deleted)',
      deleted_count
    ),
    jsonb_build_object(
      'deleted_count', deleted_count,
      'cleared_by', auth.uid(),
      'timestamp', now()
    ),
    'warning'
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'message', format(
      'Successfully deleted %s sick leave record(s)',
      deleted_count
    )
  );
END;
$$;

COMMENT ON FUNCTION public.clear_sick_leave_data() IS
'Deletes all sick leave data. Only accessible to admins (via is_admin_user()). Uses SECURITY DEFINER; relies on owner privileges and TRUNCATE with CASCADE.';