ALTER TABLE public.sub_departments
  ADD COLUMN IF NOT EXISTS visible_roles public.user_role[] NOT NULL
    DEFAULT ARRAY['skadeleder','fugttekniker','servicemedarbejder']::public.user_role[];