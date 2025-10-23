-- Create demo.cars table with sample data
CREATE TABLE IF NOT EXISTS demo.cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  car_number text NOT NULL,
  number_plate text NOT NULL,
  fuel_card_code text NOT NULL,
  has_trailer_hitch boolean DEFAULT false,
  is_available boolean DEFAULT true,
  show_in_planner boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create demo.vacations table
CREATE TABLE IF NOT EXISTS demo.vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status vacation_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  start_time time,
  end_time time,
  is_same_day boolean DEFAULT true,
  reason text,
  request_type text DEFAULT 'full_day',
  notes text
);

-- Create demo.warehouse_items table
CREATE TABLE IF NOT EXISTS demo.warehouse_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  quantity integer DEFAULT 0 NOT NULL,
  case_number text,
  notes text,
  hall text,
  is_cleaned text DEFAULT 'nej' NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Insert sample cars
INSERT INTO demo.cars (id, name, car_number, number_plate, fuel_card_code, has_trailer_hitch, is_available, show_in_planner)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Demo Bil 1', 'CAR-001', 'AB12345', 'FUEL-001', true, true, true),
  ('22222222-2222-2222-2222-222222222222', 'Demo Bil 2', 'CAR-002', 'CD67890', 'FUEL-002', false, true, true),
  ('33333333-3333-3333-3333-333333333333', 'Demo Varevogn', 'VAN-001', 'EF11223', 'FUEL-003', true, true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample vacations (referencing demo employees)
INSERT INTO demo.vacations (id, user_id, start_date, end_date, status, request_type)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-02-15', '2025-02-20', 'approved', 'full_day'),
  ('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2025-03-10', '2025-03-10', 'pending', 'full_day')
ON CONFLICT (id) DO NOTHING;

-- Insert sample warehouse items (without hall field to avoid constraint issues)
INSERT INTO demo.warehouse_items (id, address, quantity, case_number, is_cleaned)
VALUES 
  ('66666666-6666-6666-6666-666666666666', 'Demovej 123, 2100 København Ø', 5, 'DEMO-2025-001', 'ja'),
  ('77777777-7777-7777-7777-777777777777', 'Testvej 456, 8000 Aarhus C', 3, 'DEMO-2025-002', 'nej'),
  ('88888888-8888-8888-8888-888888888888', 'Prøvegade 789, 5000 Odense C', 8, 'DEMO-2025-003', 'ja')
ON CONFLICT (id) DO NOTHING;