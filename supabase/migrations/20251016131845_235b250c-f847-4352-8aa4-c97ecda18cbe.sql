-- Add hall column to warehouse_items table
ALTER TABLE public.warehouse_items 
ADD COLUMN hall TEXT CHECK (hall IN ('hal_1', 'sort_hal'));

COMMENT ON COLUMN public.warehouse_items.hall IS 'Storage hall location: hal_1 (Hal 1) or sort_hal (Sort Hal)';