
-- Create the Test department
INSERT INTO public.departments (name, code, is_active) 
VALUES ('Test Afdeling', 'TEST', true);

-- Get the Test department ID and Demo User ID for the updates
DO $$
DECLARE
  test_dept_id uuid;
  demo_user_id uuid;
  kasper_user_id uuid;
BEGIN
  -- Get the Test department ID
  SELECT id INTO test_dept_id FROM public.departments WHERE code = 'TEST';
  
  -- Find Demo User by email pattern
  SELECT id INTO demo_user_id FROM public.profiles 
  WHERE email ILIKE '%demo%' OR name ILIKE '%demo%' 
  LIMIT 1;
  
  -- Find Kasper's user ID
  SELECT id INTO kasper_user_id FROM public.profiles 
  WHERE email ILIKE '%kasper%schmidt%johansen%' OR name ILIKE '%kasper%schmidt%johansen%' 
  LIMIT 1;
  
  -- Update Demo User's department to Test department
  IF demo_user_id IS NOT NULL AND test_dept_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET department_id = test_dept_id 
    WHERE id = demo_user_id;
    
    -- Update Demo User's role to Test department
    UPDATE public.user_roles 
    SET department_id = test_dept_id 
    WHERE user_id = demo_user_id;
    
    -- Add Demo User to Test department in user_departments
    INSERT INTO public.user_departments (user_id, department_id, is_primary) 
    VALUES (demo_user_id, test_dept_id, true)
    ON CONFLICT (user_id, department_id) DO UPDATE SET is_primary = true;
  END IF;
  
  -- Add Kasper to Test department (non-primary)
  IF kasper_user_id IS NOT NULL AND test_dept_id IS NOT NULL THEN
    INSERT INTO public.user_departments (user_id, department_id, is_primary) 
    VALUES (kasper_user_id, test_dept_id, false)
    ON CONFLICT (user_id, department_id) DO NOTHING;
    
    -- Give Kasper admin role in Test department
    INSERT INTO public.user_roles (user_id, role, department_id)
    VALUES (kasper_user_id, 'administrator', test_dept_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
