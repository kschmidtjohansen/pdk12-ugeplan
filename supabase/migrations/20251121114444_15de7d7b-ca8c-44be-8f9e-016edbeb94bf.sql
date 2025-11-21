-- Fix 1: Update record_sick_leave function to prevent duplicates
CREATE OR REPLACE FUNCTION public.record_sick_leave(
  p_user_id UUID,
  p_start_date DATE,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_record_id UUID;
  v_existing_id UUID;
BEGIN
  -- Security check
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'administrator') THEN
    RAISE EXCEPTION 'Access denied: Only administrators can record sick leave';
  END IF;

  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;

  -- NEW: Check if employee already has an active sick leave
  SELECT id INTO v_existing_id
  FROM public.sick_leave_records
  WHERE user_id = p_user_id AND end_date IS NULL
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Employee already has an active sick leave (ID: %)', v_existing_id;
  END IF;

  -- Create new sick leave record
  INSERT INTO public.sick_leave_records (user_id, start_date, notes, created_by)
  VALUES (p_user_id, p_start_date, p_notes, auth.uid())
  RETURNING id INTO v_record_id;

  -- Log the action
  PERFORM public.log_security_event_safe(
    'sick_leave_recorded',
    format('Admin recorded sick leave for user: %s', p_user_id),
    jsonb_build_object('sick_leave_id', v_record_id, 'user_id', p_user_id, 'start_date', p_start_date, 'recorded_by', auth.uid()),
    'info'
  );

  RETURN v_record_id;
END;
$$;

-- Fix 2: Clean up duplicate sick leave records (keep the oldest one for each user)
WITH duplicates AS (
  SELECT 
    id,
    user_id,
    start_date,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM public.sick_leave_records
  WHERE end_date IS NULL
)
DELETE FROM public.sick_leave_records
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);