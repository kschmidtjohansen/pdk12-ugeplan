
-- ============================================================
-- Fase 9d: Add is_demo column for demo-data isolation
-- ============================================================

-- 1. Add is_demo columns
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.warehouse_items ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.vacations ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.on_call_duties ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.assignments_employees ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 2. Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_assignments_is_demo ON public.assignments(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_cars_is_demo ON public.cars(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo ON public.profiles(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_warehouse_items_is_demo ON public.warehouse_items(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_vacations_is_demo ON public.vacations(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_on_call_duties_is_demo ON public.on_call_duties(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_notifications_is_demo ON public.notifications(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_assignments_employees_is_demo ON public.assignments_employees(is_demo) WHERE is_demo = true;

-- 3. RESTRICTIVE RLS policies: live users never see demo data
-- These use AND logic with existing PERMISSIVE policies
CREATE POLICY "hide_demo_data_assignments" ON public.assignments
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR auth.uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133');

CREATE POLICY "hide_demo_data_cars" ON public.cars
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR auth.uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133');

CREATE POLICY "hide_demo_data_profiles" ON public.profiles
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR auth.uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133');

CREATE POLICY "hide_demo_data_warehouse" ON public.warehouse_items
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR auth.uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133');

CREATE POLICY "hide_demo_data_vacations" ON public.vacations
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR auth.uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133');

CREATE POLICY "hide_demo_data_duties" ON public.on_call_duties
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR auth.uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133');

CREATE POLICY "hide_demo_data_notifications" ON public.notifications
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR auth.uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133');

CREATE POLICY "hide_demo_data_assignments_employees" ON public.assignments_employees
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_demo = false OR auth.uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133');

-- 4. RPC: reset_demo_data() - manual cleanup
CREATE OR REPLACE FUNCTION public.reset_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  cnt integer;
BEGIN
  DELETE FROM public.assignments_employees WHERE is_demo = true;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('assignments_employees', cnt);

  DELETE FROM public.notifications WHERE is_demo = true;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('notifications', cnt);

  DELETE FROM public.assignments WHERE is_demo = true;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('assignments', cnt);

  DELETE FROM public.vacations WHERE is_demo = true;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('vacations', cnt);

  DELETE FROM public.on_call_duties WHERE is_demo = true;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('on_call_duties', cnt);

  DELETE FROM public.warehouse_items WHERE is_demo = true;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('warehouse_items', cnt);

  DELETE FROM public.cars WHERE is_demo = true;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('cars', cnt);

  -- Don't delete demo profile itself, just reset
  -- DELETE FROM public.profiles WHERE is_demo = true AND id != '165cdbc9-6722-4c96-97d2-1a87185c8133';
  -- GET DIAGNOSTICS cnt = ROW_COUNT;
  -- result := result || jsonb_build_object('profiles', cnt);

  RETURN result;
END;
$$;

-- 5. RPC: cleanup_demo_data_ttl() - automatic TTL cleanup
CREATE OR REPLACE FUNCTION public.cleanup_demo_data_ttl()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  cnt integer;
  cutoff timestamptz := NOW() - INTERVAL '15 minutes';
BEGIN
  DELETE FROM public.assignments_employees WHERE is_demo = true
    AND assignment_id IN (SELECT id FROM public.assignments WHERE is_demo = true AND created_at < cutoff);
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('assignments_employees', cnt);

  DELETE FROM public.notifications WHERE is_demo = true AND created_at < cutoff;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('notifications', cnt);

  DELETE FROM public.assignments WHERE is_demo = true AND created_at < cutoff;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('assignments', cnt);

  DELETE FROM public.vacations WHERE is_demo = true AND created_at < cutoff;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('vacations', cnt);

  DELETE FROM public.on_call_duties WHERE is_demo = true AND created_at < cutoff;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('on_call_duties', cnt);

  DELETE FROM public.warehouse_items WHERE is_demo = true AND created_at < cutoff;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('warehouse_items', cnt);

  DELETE FROM public.cars WHERE is_demo = true AND created_at < cutoff;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  result := result || jsonb_build_object('cars', cnt);

  RETURN result;
END;
$$;
