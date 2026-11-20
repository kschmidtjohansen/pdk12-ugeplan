-- Rollback af 005: fjerner statistikken for delte links. Linkene virker videre.
begin;
drop table if exists public.p360_link_views;
commit;
