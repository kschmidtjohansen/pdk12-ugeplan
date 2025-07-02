
-- Update user roles to match the organizational structure
-- Anders Axelsen: servicemedarbejder → skadeleder
UPDATE public.user_roles 
SET role = 'skadeleder'::user_role, updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE name ILIKE '%anders%axelsen%'
);

-- Bjarke Højland: servicemedarbejder → administrator
UPDATE public.user_roles 
SET role = 'administrator'::user_role, updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE name ILIKE '%bjarke%højland%'
);

-- Betina Poulsen: servicemedarbejder → skadeleder
UPDATE public.user_roles 
SET role = 'skadeleder'::user_role, updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE name ILIKE '%betina%poulsen%'
);

-- Morten Stokholm: servicemedarbejder → administrator
UPDATE public.user_roles 
SET role = 'administrator'::user_role, updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE name ILIKE '%morten%stokholm%'
);

-- Sisse Rud Hansen: servicemedarbejder → skadeleder
UPDATE public.user_roles 
SET role = 'skadeleder'::user_role, updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE name ILIKE '%sisse%rud%hansen%'
);

-- Verify the role assignments
SELECT p.name, ur.role 
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY 
  CASE ur.role 
    WHEN 'administrator' THEN 1
    WHEN 'skadeleder' THEN 2
    WHEN 'servicemedarbejder' THEN 3
  END,
  p.name;
