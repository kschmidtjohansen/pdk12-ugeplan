-- Seed demo.cars table if empty to ensure demo users always see demo vehicles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM demo.cars LIMIT 1) THEN
    INSERT INTO demo.cars (id, name, car_number, number_plate, has_trailer_hitch, is_available, show_in_planner, notes, fuel_card_code, created_at, updated_at)
    VALUES
      (gen_random_uuid(), 'DEMO Varebil 01', 'D01', 'DEMO 01', true, true, true, 'Demo vehicle 1', '0001', now(), now()),
      (gen_random_uuid(), 'DEMO Varebil 02', 'D02', 'DEMO 02', false, true, true, 'Demo vehicle 2', '0002', now(), now()),
      (gen_random_uuid(), 'DEMO Varebil 03', 'D03', 'DEMO 03', true, true, true, 'Demo vehicle 3', '0003', now(), now()),
      (gen_random_uuid(), 'DEMO Varebil 04', 'D04', 'DEMO 04', false, true, true, 'Demo vehicle 4', '0004', now(), now()),
      (gen_random_uuid(), 'DEMO Varebil 05', 'D05', 'DEMO 05', true, true, true, 'Demo vehicle 5', '0005', now(), now());
    
    RAISE NOTICE 'Seeded 5 demo cars';
  END IF;
END $$;

-- Update get_demo_warehouse_items to only return demo-specific items
CREATE OR REPLACE FUNCTION public.get_demo_warehouse_items()
RETURNS TABLE(
  id uuid,
  address text,
  quantity integer,
  case_number text,
  notes text,
  hall text,
  is_cleaned text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_email text;
BEGIN
  -- Get current user's email
  SELECT au.email INTO current_user_email
  FROM auth.users au
  WHERE au.id = auth.uid();

  -- Only allow demo user (test@polygongroup.com) to access demo warehouse items
  IF current_user_email != 'test@polygongroup.com' THEN
    RETURN;
  END IF;

  -- Return only demo warehouse items (filtered by demo patterns)
  RETURN QUERY
  SELECT 
    w.id,
    w.address,
    w.quantity,
    w.case_number,
    w.notes,
    w.hall,
    w.is_cleaned,
    w.created_by,
    w.created_at,
    w.updated_at
  FROM demo.warehouse_items w
  WHERE 
    (w.case_number ILIKE 'DEMO-%') OR 
    (w.address ILIKE 'Demo%')
  ORDER BY w.created_at DESC;
END;
$$;