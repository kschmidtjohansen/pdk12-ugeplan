-- Deaktiver kun den bruger-definerede trigger
ALTER TABLE public.cars DISABLE TRIGGER USER;

UPDATE public.cars 
SET department_id = '63d46993-31cb-4921-bb3d-5934984ab6b3'
WHERE id = '27a3e350-3a0e-403d-a8b5-51350351bad9'
  AND department_id IS NULL;

ALTER TABLE public.cars ENABLE TRIGGER USER;