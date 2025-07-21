
-- Phase 1: Critical RLS Policy Implementation for Vacations Table
-- Enable RLS on vacations table (if not already enabled)
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;

-- Drop any existing vacation policies to avoid conflicts
DROP POLICY IF EXISTS "vacation_select_policy" ON public.vacations;
DROP POLICY IF EXISTS "vacation_insert_policy" ON public.vacations;
DROP POLICY IF EXISTS "vacation_update_policy" ON public.vacations;
DROP POLICY IF EXISTS "vacation_delete_policy" ON public.vacations;

-- Create comprehensive RLS policies for vacations table
CREATE POLICY "vacation_select_policy"
ON public.vacations FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "vacation_insert_policy"
ON public.vacations FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "vacation_update_policy"
ON public.vacations FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid() AND status = 'pending')
  OR public.is_admin_or_skadeleder()
)
WITH CHECK (
  (user_id = auth.uid() AND status = 'pending')
  OR public.is_admin_or_skadeleder()
);

CREATE POLICY "vacation_delete_policy"
ON public.vacations FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid() AND status = 'pending')
  OR public.is_admin_or_skadeleder()
);

-- Phase 3: Add database-level constraints for security
-- Add reasonable length limits for text fields
ALTER TABLE public.vacations 
ADD CONSTRAINT vacation_reason_length_check 
CHECK (char_length(reason) <= 1000);

ALTER TABLE public.vacations 
ADD CONSTRAINT vacation_notes_length_check 
CHECK (char_length(notes) <= 2000);

ALTER TABLE public.assignments 
ADD CONSTRAINT assignment_description_length_check 
CHECK (char_length(description) <= 1000);

ALTER TABLE public.assignments 
ADD CONSTRAINT assignment_title_length_check 
CHECK (char_length(title) <= 200);

ALTER TABLE public.cars 
ADD CONSTRAINT car_notes_length_check 
CHECK (char_length(notes) <= 2000);

ALTER TABLE public.profiles 
ADD CONSTRAINT profile_notes_length_check 
CHECK (char_length(notes) <= 2000);

-- Ensure user_id is not nullable where it's used for RLS (vacations already correct)
-- Add indexes to support RLS policy performance
CREATE INDEX IF NOT EXISTS idx_vacations_user_id_status ON public.vacations (user_id, status);
CREATE INDEX IF NOT EXISTS idx_vacations_status_updated_at ON public.vacations (status, updated_at);

-- Create enhanced security logging function
CREATE OR REPLACE FUNCTION public.log_vacation_security_event(
  event_type TEXT,
  vacation_id UUID,
  details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.log_security_event_safe(
    'vacation_' || event_type,
    format('Vacation security event: %s for vacation %s', event_type, vacation_id),
    jsonb_build_object(
      'vacation_id', vacation_id,
      'user_id', auth.uid(),
      'additional_details', COALESCE(details, '{}'::jsonb)
    ),
    'warning'
  );
END;
$$;
