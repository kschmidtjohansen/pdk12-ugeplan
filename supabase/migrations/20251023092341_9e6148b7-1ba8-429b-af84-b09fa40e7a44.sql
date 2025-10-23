-- Add sample employees to demo schema (baseline data) with proper UUIDs
INSERT INTO demo.profiles (id, name, email, phone, job_title, status, on_leave, is_temporary, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Lars Nielsen', 'lars.demo@polygongroup.com', '+45 20 12 34 56', 'Servicemedarbejder', 'active', false, false, '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000002', 'Maria Hansen', 'maria.demo@polygongroup.com', '+45 20 23 45 67', 'Skadeleder', 'active', false, false, '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000003', 'Peter Jensen', 'peter.demo@polygongroup.com', '+45 20 34 56 78', 'Servicemedarbejder', 'active', false, false, '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000004', 'Anne Pedersen', 'anne.demo@polygongroup.com', '+45 20 45 67 89', 'Servicemedarbejder', 'active', false, false, '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00');

INSERT INTO demo.user_roles (user_id, role, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'servicemedarbejder', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000002', 'skadeleder', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000003', 'servicemedarbejder', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
  ('00000000-0000-0000-0000-000000000004', 'servicemedarbejder', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00');

-- Add sample assignments using these employees
INSERT INTO demo.assignments (id, title, description, assignment_date, from_time, to_time, location, responsible_user_id, case_number, published, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0001-000000000001', 'Vandskade - Privat Bolig', 'Tørring og oprydning efter vandskade i køkken', CURRENT_DATE, '08:00', '16:00', 'København K, Nørregade 12', '165cdbc9-6722-4c96-97d2-1a87185c8133', 'DEMO-001', true, '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
  ('00000000-0000-0000-0001-000000000002', 'Brandsag - Erhverv', 'Skadeopgørelse og dokumentation efter mindre brand', CURRENT_DATE + 1, '09:00', '15:00', 'Aarhus C, Vestergade 45', '00000000-0000-0000-0000-000000000002', 'DEMO-002', true, '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00');

-- Add employees to the assignments (only assignment_id and user_id columns exist)
INSERT INTO demo.assignments_employees (assignment_id, user_id)
VALUES 
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000003');