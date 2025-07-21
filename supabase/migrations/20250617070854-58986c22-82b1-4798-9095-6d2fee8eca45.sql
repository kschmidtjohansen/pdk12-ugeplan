
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

-- Add database-level constraints for security (only if they don't exist)
DO $$ 
BEGIN
  -- Add reason length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'vacation_reason_length_check'
  ) THEN
    ALTER TABLE public.vacations 
    ADD CONSTRAINT vacation_reason_length_check 
    CHECK (char_length(reason) <= 1000);
  END IF;

  -- Add notes length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'vacation_notes_length_check'
  ) THEN
    ALTER TABLE public.vacations 
    ADD CONSTRAINT vacation_notes_length_check 
    CHECK (char_length(notes) <= 2000);
  END IF;
END $$;

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
