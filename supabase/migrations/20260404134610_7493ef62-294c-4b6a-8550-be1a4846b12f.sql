
-- =============================================================
-- SECURITY HARDENING MIGRATION
-- =============================================================

-- Issue 1: Drop overly permissive profiles SELECT policy
-- The "secure_profile_access_unified" policy already enforces own-profile + admin/skadeleder access
DROP POLICY IF EXISTS "Authenticated users can view profiles (authenticated only)" ON public.profiles;

-- Also drop the "Users can view all profiles" policy which uses USING (true)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Issue 2: Restrict Realtime publication to only needed tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE
  public.assignments,
  public.cars,
  public.warehouse_items,
  public.profiles,
  public.on_call_duties,
  public.vacations,
  public.notifications;

-- Issue 3: Drop overly permissive storage SELECT policy
-- The restrictive "Users can read assignment files they have access to" policy remains
DROP POLICY IF EXISTS "Authenticated users can view assignment files" ON storage.objects;

-- Issue 4: Drop duplicate notification INSERT policy
-- "Notifications insert: owner or admin" already enforces user_id = auth.uid() OR is_admin_or_skadeleder()
DROP POLICY IF EXISTS "Users can insert their notifications" ON public.notifications;

-- Issue 5: Fix 4 functions missing SET search_path
CREATE OR REPLACE FUNCTION public.get_auth_uid()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SET search_path = ''
AS $$ SELECT auth.uid()::uuid $$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SET search_path = ''
AS $$ SELECT auth.role()::text $$;

CREATE OR REPLACE FUNCTION public.get_auth_jwt()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path = ''
AS $$ SELECT auth.jwt()::jsonb $$;

CREATE OR REPLACE FUNCTION public.is_admin_from_jwt()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT (auth.jwt() ->> 'app_metadata')::jsonb ? 'is_admin' $$;
