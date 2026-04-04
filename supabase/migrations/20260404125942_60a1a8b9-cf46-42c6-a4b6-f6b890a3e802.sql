ALTER TABLE public.assignments ADD COLUMN group_id uuid DEFAULT NULL;
CREATE INDEX idx_assignments_group_id ON public.assignments (group_id) WHERE group_id IS NOT NULL;