
ALTER TABLE public.profiles ADD COLUMN home_postcode text;

ALTER TABLE public.profiles ADD CONSTRAINT postcode_format_check 
CHECK (home_postcode IS NULL OR home_postcode ~ '^\d{4}$');
