-- Update end_sick_leave function to automatically mark employee as available
CREATE OR REPLACE FUNCTION public.end_sick_leave(
  p_record_id UUID,
  p_end_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_start_date DATE;
BEGIN
  -- Security check
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator') THEN
    RAISE EXCEPTION 'Access denied: Only administrators can end sick leave';
  END IF;

  -- Get sick leave record details
  SELECT user_id, start_date INTO v_user_id, v_start_date
  FROM public.sick_leave_records 
  WHERE id = p_record_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sick leave record not found';
  END IF;

  IF p_end_date < v_start_date THEN
    RAISE EXCEPTION 'End date cannot be before start date';
  END IF;

  -- Update sick leave record
  UPDATE public.sick_leave_records 
  SET end_date = p_end_date, updated_at = now() 
  WHERE id = p_record_id;

  -- NEW: Automatically mark employee as available again
  UPDATE public.profiles
  SET 
    on_leave = false,
    updated_at = now()
  WHERE id = v_user_id;

  -- Log the action
  PERFORM public.log_security_event_safe(
    'sick_leave_ended',
    format('Admin ended sick leave for user: %s and marked as available', v_user_id),
    jsonb_build_object(
      'sick_leave_id', p_record_id, 
      'user_id', v_user_id, 
      'end_date', p_end_date, 
      'ended_by', auth.uid(),
      'auto_marked_available', true
    ),
    'info'
  );

  RETURN TRUE;
END;
$$;