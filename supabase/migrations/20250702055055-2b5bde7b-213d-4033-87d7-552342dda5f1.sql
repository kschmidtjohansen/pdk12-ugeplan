
-- Phase 1: Fix User Roles Database
-- First, let's identify the correct user profiles and assign proper roles

-- Clear all existing roles to start fresh
DELETE FROM public.user_roles;

-- Insert correct roles based on user names
-- Administrators: Kasper, Morten, Bjarke
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'administrator'::user_role
FROM public.profiles p
WHERE p.name ILIKE '%kasper%' 
   OR p.name ILIKE '%morten%' 
   OR p.name ILIKE '%bjarke%';

-- Skadeledere: Anders, Betina, Nick
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'skadeleder'::user_role
FROM public.profiles p
WHERE p.name ILIKE '%anders%' 
   OR p.name ILIKE '%betina%' 
   OR p.name ILIKE '%nick%';

-- All other users get servicemedarbejder role
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'servicemedarbejder'::user_role
FROM public.profiles p
WHERE p.id NOT IN (
  SELECT ur.user_id 
  FROM public.user_roles ur
);
