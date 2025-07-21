-- Create demo user account for testing the demo system
-- This user will be used to showcase the application functionality

DO $$
DECLARE
    demo_user_id UUID;
    user_exists BOOLEAN;
BEGIN
    -- Check if demo user already exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'test@polygongroup.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Generate a new UUID for the demo user
        demo_user_id := gen_random_uuid();
        
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
          demo_user_id,
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
        );
        
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

        -- Log the demo user creation
        INSERT INTO public.logs (
          event_type,
          message,
          details
        ) VALUES (
          'demo_user_setup',
          'Demo user account created for system testing',
          jsonb_build_object(
            'email', 'test@polygongroup.com',
            'role', 'administrator',
            'user_id', demo_user_id,
            'created_at', now()
          )
        );
    ELSE
        -- User already exists, just ensure profile and role are correct
        SELECT id INTO demo_user_id FROM auth.users WHERE email = 'test@polygongroup.com';
        
        -- Update or insert profile
        IF EXISTS(SELECT 1 FROM public.profiles WHERE id = demo_user_id) THEN
            UPDATE public.profiles SET
              name = 'Demo User',
              job_title = 'System Administrator',
              updated_at = now()
            WHERE id = demo_user_id;
        ELSE
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
        END IF;
        
        -- Update or insert role
        IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = demo_user_id) THEN
            UPDATE public.user_roles SET
              role = 'administrator'::user_role,
              updated_at = now()
            WHERE user_id = demo_user_id;
        ELSE
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
        END IF;
        
        -- Log the demo user update
        INSERT INTO public.logs (
          event_type,
          message,
          details
        ) VALUES (
          'demo_user_setup',
          'Demo user account updated for system testing',
          jsonb_build_object(
            'email', 'test@polygongroup.com',
            'role', 'administrator',
            'user_id', demo_user_id,
            'updated_at', now()
          )
        );
    END IF;
END $$;