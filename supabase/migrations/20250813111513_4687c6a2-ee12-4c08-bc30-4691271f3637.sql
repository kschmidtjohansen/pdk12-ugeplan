-- Ensure authenticated can use the public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Restore privileges on core tables so RLS can do its job
-- Cars: app reads and admins write (RLS restricts writes)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cars TO authenticated;

-- Profiles: app reads profiles (RLS still applies)
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- Assignments: app reads and admins write (RLS restricts writes to admins/responsible)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.assignments TO authenticated;

-- Assignments/Employees link table: app reads/writes (RLS restricts per-row)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.assignments_employees TO authenticated;

-- Ensure service_role has full privileges (edge functions / maintenance)
GRANT ALL PRIVILEGES ON TABLE public.cars, public.profiles, public.assignments, public.assignments_employees TO service_role;