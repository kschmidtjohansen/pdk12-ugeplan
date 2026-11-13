-- 003 Security hardening (12-11-2026). Staged: run by hand after review; rollback in 003_security_hardening_rollback.sql.
-- Every step is additive or narrows access; nothing is deleted. Step 2 adds new screen links next to the old
-- screen addresses, which keep working until 004_screen_display_lockdown.sql is run.

begin;

-- 1. Trainings: no longer readable by every signed-in user across departments.
--    Own trainings, admins/skadeledere (as before), super admins, and colleagues in the same department.
--    Demo rows stay hidden from everyone but the demo account, the owner and admins (as before).
drop policy if exists "__mrg_sel_trainings_1c4eba68" on public.trainings;
create policy "trainings_select_scoped" on public.trainings for select to authenticated using (
  (user_id = (select auth.uid()) or public.is_admin_or_skadeleder())
  or (
    (coalesce(is_demo, false) = false or ((select auth.jwt()) ->> 'email') = 'test@polygongroup.com')
    and (
      public.is_super_admin((select auth.uid()))
      or department_id = any (public.get_user_department_ids((select auth.uid())))
    )
  )
);

-- 2. Screen links: a secret code per screen that an admin can revoke, instead of a department ID anyone can reuse.
create table if not exists public.screen_display_links (
  token text primary key default encode(extensions.gen_random_bytes(24), 'hex'),
  department_id uuid not null references public.departments (id) on delete cascade,
  label text not null default '',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.screen_display_links enable row level security;
revoke all on public.screen_display_links from anon;
grant select, insert, update on public.screen_display_links to authenticated;

create policy "screen_links_admin_select" on public.screen_display_links for select to authenticated using (
  public.is_super_admin((select auth.uid()))
  or (public.is_admin_or_skadeleder() and department_id = any (public.get_user_department_ids((select auth.uid()))))
);
create policy "screen_links_admin_insert" on public.screen_display_links for insert to authenticated with check (
  public.is_super_admin((select auth.uid()))
  or (public.is_admin_or_skadeleder() and department_id = any (public.get_user_department_ids((select auth.uid()))))
);
-- revoking = setting revoked_at; links are never deleted, so the history stays
create policy "screen_links_admin_update" on public.screen_display_links for update to authenticated using (
  public.is_super_admin((select auth.uid()))
  or (public.is_admin_or_skadeleder() and department_id = any (public.get_user_department_ids((select auth.uid()))))
) with check (
  public.is_super_admin((select auth.uid()))
  or (public.is_admin_or_skadeleder() and department_id = any (public.get_user_department_ids((select auth.uid()))))
);

create or replace function public.screen_display_token_ok(p_token text, p_department_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_token is not null and length(p_token) >= 32 and exists (
    select 1 from public.screen_display_links l
    where l.token = p_token and l.department_id = p_department_id and l.revoked_at is null);
$$;
revoke execute on function public.screen_display_token_ok(text, uuid) from public, anon, authenticated;

create or replace function public.list_screen_display_assignments_by_token(p_token text, p_department_id uuid, p_sub_department_id uuid default null, p_date date default null)
returns table(id uuid, title text, description text, assignment_date date, from_time time without time zone, to_time time without time zone,
  location text, type public.assignment_type, published boolean, responsible_user_id uuid, car_id uuid, car_ids uuid[], case_number text,
  created_at timestamptz, updated_at timestamptz, team jsonb, responsible_user jsonb, cars jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.screen_display_token_ok(p_token, p_department_id) then return; end if;
  return query select * from public.list_screen_display_assignments(p_department_id, p_sub_department_id, p_date);
end $$;

create or replace function public.list_screen_display_absences_by_token(p_token text, p_department_id uuid, p_date date)
returns table(id uuid, name text) language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.screen_display_token_ok(p_token, p_department_id) then return; end if;
  return query select * from public.list_screen_display_absences(p_department_id, p_date);
end $$;

create or replace function public.list_screen_display_sub_departments_by_token(p_token text, p_department_id uuid)
returns table(id uuid, name text) language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.screen_display_token_ok(p_token, p_department_id) then return; end if;
  return query select * from public.list_screen_display_sub_departments(p_department_id);
end $$;

grant execute on function public.list_screen_display_assignments_by_token(text, uuid, uuid, date) to anon, authenticated;
grant execute on function public.list_screen_display_absences_by_token(text, uuid, date) to anon, authenticated;
grant execute on function public.list_screen_display_sub_departments_by_token(text, uuid) to anon, authenticated;

-- 3. Small hardening
alter function public.p360_rank(text) set search_path = 'public';
revoke execute on function public.verify_complete_fix() from public, anon, authenticated;   -- old check, not used by the app

commit;
