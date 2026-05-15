-- Web Vitals telemetry table
CREATE TABLE public.web_vitals_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  metric_name text NOT NULL CHECK (metric_name IN ('LCP','INP','CLS','FCP','TTFB')),
  metric_value double precision NOT NULL,
  rating text CHECK (rating IN ('good','needs-improvement','poor')),
  route text NOT NULL,
  user_id uuid,
  department_id uuid,
  device_type text,
  connection_type text,
  user_agent text,
  session_id text
);

CREATE INDEX idx_web_vitals_route_metric_created ON public.web_vitals_metrics (route, metric_name, created_at DESC);
CREATE INDEX idx_web_vitals_created ON public.web_vitals_metrics (created_at DESC);

ALTER TABLE public.web_vitals_metrics ENABLE ROW LEVEL SECURITY;

-- INSERT: any authenticated user may insert their own measurement (or anonymous-tagged)
CREATE POLICY "web_vitals_insert"
ON public.web_vitals_metrics
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- SELECT: only admins / skadeleder
CREATE POLICY "web_vitals_admin_select"
ON public.web_vitals_metrics
FOR SELECT
TO authenticated
USING (public.is_admin_or_skadeleder());
