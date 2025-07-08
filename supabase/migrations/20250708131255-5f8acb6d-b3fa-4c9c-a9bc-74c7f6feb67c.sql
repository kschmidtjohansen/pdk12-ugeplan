
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
  email_confirmed_at,
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
  now(),
  '{}',
  '{"name": "Demo User"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID we just created (or existing one)
WITH demo_user AS (
  SELECT id FROM auth.users WHERE email = 'test@polygongroup.com'
)

-- Insert profile for demo user
INSERT INTO public.profiles (
  id,
  email,
  name,
  status,
  job_title,
  created_at,
  updated_at
)
SELECT 
  id,
  'test@polygongroup.com',
  'Demo User',
  'active'::employee_status,
  'System Administrator',
  now(),
  now()
FROM demo_user
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  job_title = EXCLUDED.job_title,
  updated_at = now();

-- Assign administrator role to demo user
WITH demo_user AS (
  SELECT id FROM auth.users WHERE email = 'test@polygongroup.com'
)
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at,
  updated_at
)
SELECT 
  id,
  'administrator'::user_role,
  now(),
  now()
FROM demo_user
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = now();

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
    'created_at', now()
  )
);
