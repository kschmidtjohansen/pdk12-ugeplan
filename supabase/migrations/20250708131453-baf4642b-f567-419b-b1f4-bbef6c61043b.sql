-- Create demo user account for testing the demo system
-- This user will be used to showcase the application functionality

-- Insert demo user into auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@polygongroup.com',
  crypt('TesterbrugerPlan123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '{}',
  '{"name": "Demo User"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID we just created (or existing one)
DO $$
DECLARE
    demo_user_id UUID;
    profile_exists BOOLEAN;
    role_exists BOOLEAN;
BEGIN
    SELECT id INTO demo_user_id FROM auth.users WHERE email = 'test@polygongroup.com';
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = demo_user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Insert profile for demo user
        INSERT INTO public.profiles (
          id,
          email,
          name,
          status,
          job_title,
          created_at,
          updated_at
        ) VALUES (
          demo_user_id,
          'test@polygongroup.com',
          'Demo User',
          'active'::employee_status,
          'System Administrator',
          now(),
          now()
        );
    ELSE
        -- Update existing profile
        UPDATE public.profiles SET
          name = 'Demo User',
          job_title = 'System Administrator',
          updated_at = now()
        WHERE id = demo_user_id;
    END IF;

    -- Check if role exists
    SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = demo_user_id) INTO role_exists;
    
    IF NOT role_exists THEN
        -- Insert role for demo user
        INSERT INTO public.user_roles (
          user_id,
          role,
          created_at,
          updated_at
        ) VALUES (
          demo_user_id,
          'administrator'::user_role,
          now(),
          now()
        );
    ELSE
        -- Update existing role
        UPDATE public.user_roles SET
          role = 'administrator'::user_role,
          updated_at = now()
        WHERE user_id = demo_user_id;
    END IF;

    -- Log the demo user creation
    INSERT INTO public.logs (
      event_type,
      message,
      details
    ) VALUES (
      'demo_user_setup',
      'Demo user account created/updated for system testing',
      jsonb_build_object(
        'email', 'test@polygongroup.com',
        'role', 'administrator',
        'user_id', demo_user_id,
        'created_at', now()
      )
    );
END $$;