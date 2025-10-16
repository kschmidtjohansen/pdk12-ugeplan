-- Create warehouse_items table
CREATE TABLE public.warehouse_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  case_number TEXT,
  is_cleaned BOOLEAN NOT NULL DEFAULT false,
  quantity INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.warehouse_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can view
CREATE POLICY "warehouse_items_select_policy"
ON public.warehouse_items
FOR SELECT
TO authenticated
USING (true);

-- Only admin and skadeleder can insert
CREATE POLICY "warehouse_items_insert_policy"
ON public.warehouse_items
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_skadeleder());

-- Only admin and skadeleder can update
CREATE POLICY "warehouse_items_update_policy"
ON public.warehouse_items
FOR UPDATE
TO authenticated
USING (public.is_admin_or_skadeleder())
WITH CHECK (public.is_admin_or_skadeleder());

-- Only admin and skadeleder can delete
CREATE POLICY "warehouse_items_delete_policy"
ON public.warehouse_items
FOR DELETE
TO authenticated
USING (public.is_admin_or_skadeleder());

-- Create updated_at trigger
CREATE TRIGGER update_warehouse_items_updated_at
  BEFORE UPDATE ON public.warehouse_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_warehouse_items_case_number ON public.warehouse_items(case_number);
CREATE INDEX idx_warehouse_items_created_at ON public.warehouse_items(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_items;