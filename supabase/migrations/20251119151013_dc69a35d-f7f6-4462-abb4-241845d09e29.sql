-- Grant USAGE on demo schema to all necessary roles
GRANT USAGE ON SCHEMA demo TO anon, authenticated, service_role;

-- Grant ALL privileges on all existing tables in demo schema
GRANT ALL ON ALL TABLES IN SCHEMA demo TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA demo TO anon;

-- Grant privileges on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA demo TO authenticated, service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA demo TO anon;

-- Grant privileges on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA demo TO authenticated, service_role, anon;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA demo 
GRANT ALL ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA demo 
GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA demo 
GRANT ALL ON SEQUENCES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA demo 
GRANT SELECT ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA demo 
GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role, anon;

-- Clean up the orphaned duty from public schema
DELETE FROM public.on_call_duties 
WHERE id = '8962c0ff-a482-4332-9085-f7b9ee3627cb';

COMMENT ON SCHEMA demo IS 
'Demo schema with proper role permissions for isolated demo user data';