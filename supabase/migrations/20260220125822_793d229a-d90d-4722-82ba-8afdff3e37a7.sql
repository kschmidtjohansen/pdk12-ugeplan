
-- Fix the two NULL department_id assignments created today (12-013466, created around 12:34)
-- These were created before the frontend guard was active
UPDATE public.assignments
SET department_id = '8c542620-9156-4155-b686-564b14a4ca62' -- 12 - Fredericia
WHERE id IN (
  '4abf7a57-a3e0-4277-a580-cbea97574f2d',
  '8e8aee67-380b-40d8-b266-15c9bcab393b'
)
AND department_id IS NULL
AND title = '12-013466';
