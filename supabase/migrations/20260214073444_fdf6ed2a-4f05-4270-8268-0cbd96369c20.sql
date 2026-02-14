ALTER TABLE public.departments ADD COLUMN chat_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.departments ADD COLUMN files_enabled BOOLEAN NOT NULL DEFAULT true;