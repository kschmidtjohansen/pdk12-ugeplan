-- First migration: Add superadmin enum value only
DO $$
BEGIN
  -- Check if superadmin already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'superadmin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'superadmin';
  END IF;
END
$$;