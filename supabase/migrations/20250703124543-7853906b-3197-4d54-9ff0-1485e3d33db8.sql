-- Phase 4: Data Integrity Cleanup
-- Check for and clean up orphaned records due to foreign key issues

-- 1. Clean up orphaned assignments_employees records
-- Remove records where user_id doesn't exist in profiles
DELETE FROM public.assignments_employees 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Remove records where assignment_id doesn't exist in assignments
DELETE FROM public.assignments_employees 
WHERE assignment_id NOT IN (SELECT id FROM public.assignments);

-- 2. Clean up assignments with invalid references
-- Set responsible_user_id to NULL where user doesn't exist in profiles
UPDATE public.assignments 
SET responsible_user_id = NULL 
WHERE responsible_user_id IS NOT NULL 
AND responsible_user_id NOT IN (SELECT id FROM public.profiles);

-- Set car_id to NULL where car doesn't exist in cars
UPDATE public.assignments 
SET car_id = NULL 
WHERE car_id IS NOT NULL 
AND car_id NOT IN (SELECT id FROM public.cars);

-- 3. Ensure all profiles have user_roles entries
-- Insert default servicemedarbejder role for profiles without roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'servicemedarbejder'::user_role
FROM public.profiles p
WHERE p.id NOT IN (SELECT user_id FROM public.user_roles);

-- 4. Clean up user_roles for non-existent profiles
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 5. Clean up notifications for non-existent users
DELETE FROM public.notifications 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 6. Clean up vacations for non-existent users
DELETE FROM public.vacations 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 7. Log the cleanup results
DO $$
DECLARE
    orphaned_assignments_employees INTEGER;
    invalid_responsible_users INTEGER;
    invalid_car_refs INTEGER;
    missing_user_roles INTEGER;
    orphaned_user_roles INTEGER;
    orphaned_notifications INTEGER;
    orphaned_vacations INTEGER;
BEGIN
    -- Get counts for logging (these will be 0 after cleanup, but we can still log the action)
    SELECT COUNT(*) INTO orphaned_assignments_employees FROM public.assignments_employees 
    WHERE user_id NOT IN (SELECT id FROM public.profiles) 
    OR assignment_id NOT IN (SELECT id FROM public.assignments);
    
    SELECT COUNT(*) INTO invalid_responsible_users FROM public.assignments 
    WHERE responsible_user_id IS NOT NULL 
    AND responsible_user_id NOT IN (SELECT id FROM public.profiles);
    
    SELECT COUNT(*) INTO invalid_car_refs FROM public.assignments 
    WHERE car_id IS NOT NULL 
    AND car_id NOT IN (SELECT id FROM public.cars);
    
    SELECT COUNT(*) INTO missing_user_roles FROM public.profiles p
    WHERE p.id NOT IN (SELECT user_id FROM public.user_roles);
    
    SELECT COUNT(*) INTO orphaned_user_roles FROM public.user_roles 
    WHERE user_id NOT IN (SELECT id FROM public.profiles);
    
    SELECT COUNT(*) INTO orphaned_notifications FROM public.notifications 
    WHERE user_id NOT IN (SELECT id FROM public.profiles);
    
    SELECT COUNT(*) INTO orphaned_vacations FROM public.vacations 
    WHERE user_id NOT IN (SELECT id FROM public.profiles);
    
    INSERT INTO public.logs (event_type, message, details)
    VALUES (
      'data_integrity_cleanup_phase4',
      'Phase 4: Data integrity cleanup completed - all orphaned records removed',
      jsonb_build_object(
        'phase', 4,
        'action', 'data_integrity_cleanup',
        'cleanup_summary', jsonb_build_object(
          'orphaned_assignments_employees_cleaned', orphaned_assignments_employees,
          'invalid_responsible_users_cleaned', invalid_responsible_users,
          'invalid_car_refs_cleaned', invalid_car_refs,
          'missing_user_roles_added', missing_user_roles,
          'orphaned_user_roles_cleaned', orphaned_user_roles,
          'orphaned_notifications_cleaned', orphaned_notifications,
          'orphaned_vacations_cleaned', orphaned_vacations
        ),
        'timestamp', now()
      )
    );
END $$;