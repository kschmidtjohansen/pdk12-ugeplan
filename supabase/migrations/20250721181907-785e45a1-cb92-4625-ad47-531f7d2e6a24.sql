
-- Phase 1: Clean up Kasper's department associations
-- Remove Kasper's TEST department association, keep only AFD12
DELETE FROM public.user_departments 
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com')
  AND department_id = (SELECT id FROM public.departments WHERE code = 'TEST');

-- Ensure Kasper's AFD12 association is primary
UPDATE public.user_departments 
SET is_primary = true
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'kasper.johansen@polygongroup.com')
  AND department_id = (SELECT id FROM public.departments WHERE code = 'AFD12');

-- Ensure all AFD12 users have proper department associations
INSERT INTO public.user_departments (user_id, department_id, is_primary)
SELECT 
  p.id as user_id,
  p.department_id,
  true as is_primary
FROM public.profiles p
WHERE p.department_id = (SELECT id FROM public.departments WHERE code = 'AFD12')
  AND p.name != 'Demo User'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_departments ud 
    WHERE ud.user_id = p.id AND ud.department_id = p.department_id
  );

-- Update existing AFD12 user department associations to be primary
UPDATE public.user_departments 
SET is_primary = true
WHERE department_id = (SELECT id FROM public.departments WHERE code = 'AFD12')
  AND user_id IN (
    SELECT id FROM public.profiles 
    WHERE department_id = (SELECT id FROM public.departments WHERE code = 'AFD12')
    AND name != 'Demo User'
  );
