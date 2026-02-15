-- Fase 9b: Giv demo-bruger adgang til 02 - Storkøbenhavn med alle 3 underafdelinger
INSERT INTO public.user_access (user_id, department_id, sub_department_id)
VALUES 
  ('165cdbc9-6722-4c96-97d2-1a87185c8133', 'de10b9d0-bd39-4c20-81d8-a12719beb53b', '5931531c-0bb0-4e97-b5dd-03283ee1865c'),
  ('165cdbc9-6722-4c96-97d2-1a87185c8133', 'de10b9d0-bd39-4c20-81d8-a12719beb53b', '8a63e216-388e-4f83-a19c-623c1f5352ed'),
  ('165cdbc9-6722-4c96-97d2-1a87185c8133', 'de10b9d0-bd39-4c20-81d8-a12719beb53b', '21bf50af-6a84-4bea-853a-ddbe15f9a54f');