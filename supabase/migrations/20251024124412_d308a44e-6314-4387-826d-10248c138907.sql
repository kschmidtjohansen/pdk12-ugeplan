-- Drop the existing function first
DROP FUNCTION IF EXISTS public.cleanup_expired_temporary_users();

-- Update Petrie's expiration date to past for testing auto-cleanup
UPDATE profiles 
SET expires_at = NOW() - INTERVAL '1 day',
    updated_at = NOW()
WHERE email LIKE '%vikar%@temp.local'
  AND name = 'Petrie'
  AND is_temporary = true;

-- Create improved cleanup function with better logging
CREATE OR REPLACE FUNCTION public.cleanup_expired_temporary_users()
RETURNS TABLE(
  deleted_count integer,
  deleted_user_ids uuid[],
  message text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer := 0;
  v_deleted_ids uuid[] := ARRAY[]::uuid[];
  v_expired_users RECORD;
BEGIN
  -- Log the cleanup attempt
  RAISE NOTICE 'Starting cleanup of expired temporary users at %', NOW();
  
  -- Find all expired temporary users
  FOR v_expired_users IN
    SELECT id, name, email, expires_at
    FROM public.profiles
    WHERE is_temporary = true 
      AND expires_at < NOW()
  LOOP
    RAISE NOTICE 'Found expired user: ID=%, Name=%, Email=%, Expires=%', 
      v_expired_users.id, v_expired_users.name, v_expired_users.email, v_expired_users.expires_at;
    
    -- Delete from assignments_employees first (foreign key constraint)
    DELETE FROM public.assignments_employees WHERE user_id = v_expired_users.id;
    RAISE NOTICE 'Deleted assignment links for user %', v_expired_users.id;
    
    -- Delete from user_roles
    DELETE FROM public.user_roles WHERE user_id = v_expired_users.id;
    RAISE NOTICE 'Deleted role for user %', v_expired_users.id;
    
    -- Delete from profiles
    DELETE FROM public.profiles WHERE id = v_expired_users.id;
    RAISE NOTICE 'Deleted profile for user %', v_expired_users.id;
    
    -- Delete from auth.users (if exists - temporary users might not have auth entry)
    BEGIN
      DELETE FROM auth.users WHERE id = v_expired_users.id;
      RAISE NOTICE 'Deleted auth user %', v_expired_users.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No auth user found for % (this is normal for temporary users)', v_expired_users.id;
    END;
    
    v_deleted_count := v_deleted_count + 1;
    v_deleted_ids := array_append(v_deleted_ids, v_expired_ids);
  END LOOP;
  
  IF v_deleted_count = 0 THEN
    RAISE NOTICE 'No expired temporary users found';
  ELSE
    RAISE NOTICE 'Cleanup complete: Deleted % users', v_deleted_count;
  END IF;
  
  -- Return results
  RETURN QUERY SELECT 
    v_deleted_count,
    v_deleted_ids,
    CASE 
      WHEN v_deleted_count = 0 THEN 'No expired temporary users found'
      ELSE format('Successfully deleted %s expired temporary user(s)', v_deleted_count)
    END;
END;
$$;