
-- Del 1: Tilføj super_admin rolle (skal committes separat)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
