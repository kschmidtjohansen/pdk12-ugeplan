
-- Add Kasper to TEST department with administrator role
DO $$
DECLARE
  test_dept_id uuid;
  kasper_user_id uuid;
BEGIN
  -- Get the Test department ID
  SELECT id INTO test_dept_id FROM public.departments WHERE code = 'TEST';
  
  -- Find Kasper's user ID
  SELECT id INTO kasper_user_id FROM public.profiles 
  WHERE email ILIKE '%kasper%' OR name ILIKE '%kasper%' 
  LIMIT 1;
  
  -- Add Kasper to TEST department in user_departments (non-primary since AFD12 should remain primary)
  IF kasper_user_id IS NOT NULL AND test_dept_id IS NOT NULL THEN
    INSERT INTO public.user_departments (user_id, department_id, is_primary) 
    VALUES (kasper_user_id, test_dept_id, false)
    ON CONFLICT (user_id, department_id) DO NOTHING;
    
    -- Give Kasper administrator role in TEST department
    INSERT INTO public.user_roles (user_id, role, department_id)
    VALUES (kasper_user_id, 'administrator', test_dept_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Verify department isolation by checking current data distribution
-- This is just for verification - no changes made
SELECT 
  d.name as department_name,
  d.code as department_code,
  COUNT(DISTINCT a.id) as assignment_count,
  COUNT(DISTINCT p.id) as profile_count,
  COUNT(DISTINCT c.id) as car_count
FROM public.departments d
LEFT JOIN public.assignments a ON d.id = a.department_id
LEFT JOIN public.profiles p ON d.id = p.department_id  
LEFT JOIN public.cars c ON d.id = c.department_id
GROUP BY d.id, d.name, d.code
ORDER BY d.name;
