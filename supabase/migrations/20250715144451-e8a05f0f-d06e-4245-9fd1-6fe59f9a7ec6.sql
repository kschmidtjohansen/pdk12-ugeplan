-- Create sample vacation records for the demo user
INSERT INTO public.vacations (user_id, start_date, end_date, status, reason, request_type, created_at, updated_at)
VALUES 
  -- Demo user's own vacation requests
  ('165cdbc9-6722-4c96-97d2-1a87185c8133', '2025-08-15', '2025-08-22', 'approved', 'Summer vacation', 'full_day', now(), now()),
  ('165cdbc9-6722-4c96-97d2-1a87185c8133', '2025-09-10', '2025-09-10', 'pending', 'Personal day', 'full_day', now(), now()),
  ('165cdbc9-6722-4c96-97d2-1a87185c8133', '2025-07-01', '2025-07-03', 'rejected', 'Already covered period', 'full_day', now() - interval '10 days', now() - interval '10 days');