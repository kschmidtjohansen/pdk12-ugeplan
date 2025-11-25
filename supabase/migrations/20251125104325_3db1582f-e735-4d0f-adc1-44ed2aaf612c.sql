-- Migration: Add baseline demo duty data for the next 14 days
-- Description: Inserts demo on-call duties to populate the duty calendar in demo mode

-- Insert demo on-call duties for the next 14 days
DO $$
DECLARE
  demo_skadeleder_ids uuid[];
  demo_all_employee_ids uuid[];
  day_offset integer;
  selected_employee_id uuid;
  selected_duty_type text;
BEGIN
  -- Get demo employee IDs - skadeledere and admins for skadeleder_vagt
  SELECT array_agg(p.id) INTO demo_skadeleder_ids
  FROM demo.profiles p
  JOIN demo.user_roles ur ON p.id = ur.user_id
  WHERE p.status = 'active' 
    AND ur.role IN ('administrator', 'skadeleder');
  
  -- Get all active demo employee IDs for kørevagt
  SELECT array_agg(id) INTO demo_all_employee_ids
  FROM demo.profiles
  WHERE status = 'active';

  -- Only proceed if we have demo employees
  IF array_length(demo_all_employee_ids, 1) > 0 THEN
    -- Create duties for the next 14 days
    FOR day_offset IN 0..13 LOOP
      -- Alternate between duty types
      selected_duty_type := CASE 
        WHEN day_offset % 2 = 0 THEN 'skadeleder_vagt'
        ELSE 'kørevagt'
      END;
      
      -- Select appropriate employee based on duty type
      IF selected_duty_type = 'skadeleder_vagt' AND array_length(demo_skadeleder_ids, 1) > 0 THEN
        -- For skadeleder_vagt, only select from administrators or skadeledere
        selected_employee_id := demo_skadeleder_ids[1 + floor(random() * array_length(demo_skadeleder_ids, 1))::int];
      ELSE
        -- For kørevagt, any active employee can be selected
        selected_employee_id := demo_all_employee_ids[1 + floor(random() * array_length(demo_all_employee_ids, 1))::int];
      END IF;
      
      -- Insert the duty
      INSERT INTO demo.on_call_duties (
        id,
        duty_date,
        employee_id,
        duty_type,
        notes,
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        (CURRENT_DATE + (day_offset || ' days')::interval)::date,
        selected_employee_id,
        selected_duty_type::duty_type,
        'Demo vagtplan',
        selected_employee_id,
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING; -- Skip if duty already exists for this date
    END LOOP;
    
    RAISE NOTICE 'Successfully created 14 days of demo duty data';
  ELSE
    RAISE NOTICE 'No demo employees found, skipping duty data creation';
  END IF;
END $$;