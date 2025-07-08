-- Update demo user profile name from email to "Demo User"
UPDATE public.profiles 
SET name = 'Demo User', updated_at = now()
WHERE email = 'test@polygongroup.com';