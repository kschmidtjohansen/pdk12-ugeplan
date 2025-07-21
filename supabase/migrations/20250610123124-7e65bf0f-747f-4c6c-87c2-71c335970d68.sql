
-- Drop the problematic performance_metrics view that's causing SECURITY DEFINER errors
DROP VIEW IF EXISTS public.performance_metrics;
