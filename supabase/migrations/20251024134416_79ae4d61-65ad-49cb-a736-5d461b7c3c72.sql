-- Fix Petrie's expiration date to be 6 months from now
UPDATE public.profiles
SET expires_at = (NOW() + INTERVAL '6 months')
WHERE name = 'Petrie' AND is_temporary = true;