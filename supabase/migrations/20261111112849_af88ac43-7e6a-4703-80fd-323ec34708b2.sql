INSERT INTO public.p360_depts (id, doc)
SELECT d.id::text,
       jsonb_build_object('name', left(d.name, 40), 'color', '#00AEEF',
         'order', (row_number() OVER (ORDER BY d.name))::int)
FROM public.departments d
WHERE NOT EXISTS (SELECT 1 FROM public.p360_depts p WHERE lower(p.doc->>'name') = lower(left(d.name, 40)))
ON CONFLICT (id) DO NOTHING;