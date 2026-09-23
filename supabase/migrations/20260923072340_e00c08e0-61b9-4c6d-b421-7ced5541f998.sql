ALTER TABLE public.web_vitals_metrics
  ADD COLUMN IF NOT EXISTS attribution_target text,
  ADD COLUMN IF NOT EXISTS attribution_detail text;