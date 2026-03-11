
-- Backfill locations from existing warehouse_items.hall values
INSERT INTO public.department_settings (department_id, setting_key, setting_value)
SELECT 
  sub.department_id,
  'locations',
  sub.locations_json
FROM (
  SELECT 
    wi.department_id,
    (
      SELECT json_agg(json_build_object('key', h, 'label', initcap(replace(h, '_', ' '))))::text
      FROM (SELECT DISTINCT hall AS h FROM public.warehouse_items wi2 WHERE wi2.department_id = wi.department_id AND wi2.hall IS NOT NULL ORDER BY h) halls
    ) AS locations_json
  FROM public.warehouse_items wi
  WHERE wi.hall IS NOT NULL AND wi.department_id IS NOT NULL
  GROUP BY wi.department_id
) sub
WHERE sub.locations_json IS NOT NULL
ON CONFLICT (department_id, setting_key) DO NOTHING;
