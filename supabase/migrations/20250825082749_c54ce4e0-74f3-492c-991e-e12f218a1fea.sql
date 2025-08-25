-- Add 'vikar' role to the user_role enum
ALTER TYPE user_role ADD VALUE 'vikar';

-- Add temporary user fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_temporary boolean DEFAULT false,
ADD COLUMN expires_at timestamp with time zone;

-- Create function to cleanup expired temporary users
CREATE OR REPLACE FUNCTION public.cleanup_expired_temporary_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Delete expired temporary users from all related tables
  -- First delete from assignments_employees where user is expired temp user
  DELETE FROM public.assignments_employees 
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE is_temporary = true 
    AND expires_at < NOW()
  );
  
  -- Delete from user_roles for expired temp users
  DELETE FROM public.user_roles 
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE is_temporary = true 
    AND expires_at < NOW()
  );
  
  -- Delete from auth.users for expired temp users (cascade will handle profiles)
  DELETE FROM auth.users 
  WHERE id IN (
    SELECT id FROM public.profiles 
    WHERE is_temporary = true 
    AND expires_at < NOW()
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  PERFORM public.log_security_event_safe(
    'temporary_user_cleanup',
    format('Cleaned up %s expired temporary users', deleted_count),
    jsonb_build_object(
      'deleted_count', deleted_count,
      'cleanup_type', 'automated'
    ),
    'info'
  );
END;
$$;

-- Create a trigger to automatically set expires_at to 30 days from creation for temporary users
CREATE OR REPLACE FUNCTION public.set_temporary_user_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- If this is a temporary user and no expiration is set, set it to 30 days from now
  IF NEW.is_temporary = true AND NEW.expires_at IS NULL THEN
    NEW.expires_at = NOW() + INTERVAL '30 days';
  END IF;
  
  -- If user is no longer temporary, clear expiration
  IF NEW.is_temporary = false THEN
    NEW.expires_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic expiration setting
CREATE TRIGGER set_temporary_user_expiration_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_temporary_user_expiration();