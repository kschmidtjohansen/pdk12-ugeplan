

## Plan: Supabase Security Hardening (5 Issues)

### Analysis Summary

After auditing all RLS policies, storage policies, functions, and Realtime configuration, here are the exact issues and fixes:

---

### Issue 1: Profiles — Overly Permissive SELECT Policy

**Problem:** The policy `"Authenticated users can view profiles (authenticated only)"` uses `get_auth_uid() IS NOT NULL` — meaning ANY logged-in user can read ALL profile rows. Since Postgres OR's permissive policies together, this overrides the stricter `secure_profile_access_unified` policy entirely.

**Fix:** Drop the overly permissive policy. The existing `secure_profile_access_unified` already allows own-profile + admin/skadeleder access with audit logging, which is the correct behavior.

```sql
DROP POLICY "Authenticated users can view profiles (authenticated only)" ON public.profiles;
```

---

### Issue 2: Realtime — No Table-Level Restrictions

**Problem:** All tables are published to Realtime by default. Any authenticated client can subscribe to `postgres_changes` on any table (RLS filters the rows, but the subscription itself is unrestricted).

**Fix:** Restrict Realtime publication to only the 6 tables the app actually subscribes to (`assignments`, `cars`, `warehouse_items`, `profiles`, `on_call_duties`, `vacations`). Remove all other tables from the Realtime publication.

```sql
-- Drop and recreate the supabase_realtime publication with only needed tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.assignments, public.cars, public.warehouse_items, 
  public.profiles, public.on_call_duties, public.vacations, 
  public.notifications;
```

---

### Issue 3: Storage — Overly Permissive SELECT Policy

**Problem:** `"Authenticated users can view assignment files"` uses only `bucket_id = 'assignment-files'` — any logged-in user can download any file. The stricter `"Users can read assignment files they have access to"` policy is overridden because both are permissive (OR'd).

**Fix:** Drop the overly permissive policy. The existing restrictive policy already checks admin/skadeleder OR file ownership/assignment membership.

```sql
DROP POLICY "Authenticated users can view assignment files" ON storage.objects;
```

---

### Issue 4: Notifications — Admin Can Insert for Other Users

**Problem:** `"Notifications insert: owner or admin"` allows admin/skadeleder to insert notifications with any `user_id`. The user wants `user_id` forced to `auth.uid()`.

**Fix:** Replace the INSERT policy and add a trigger to force `user_id = auth.uid()` on insert. However — the app legitimately sends notifications TO other users (vacation approvals, duty reminders via admin actions). Completely locking this would break admin workflows.

**Proposed compromise:** Keep admin insert ability but add a DB trigger that validates the inserting user is either the target user OR has admin/skadeleder role. Drop the secondary duplicate policy `"Users can insert their notifications"`.

```sql
DROP POLICY "Users can insert their notifications" ON public.notifications;
-- The "Notifications insert: owner or admin" policy already enforces
-- user_id = auth.uid() OR is_admin_or_skadeleder()
-- This is the correct behavior for this app.
```

If strict lockdown is preferred (no admin cross-insert), I'll replace with `user_id = auth.uid()` only — but this will break admin notification workflows.

---

### Issue 5: 4 Functions Missing `search_path`

**Functions:** `get_auth_uid`, `get_auth_role`, `get_auth_jwt`, `is_admin_from_jwt`

**Fix:** Recreate each with `SET search_path = ''` (empty = most secure, since these only call `auth.*` schema functions).

```sql
CREATE OR REPLACE FUNCTION public.get_auth_uid() RETURNS uuid
  LANGUAGE sql STABLE SET search_path = '' AS $$ SELECT auth.uid()::uuid $$;

CREATE OR REPLACE FUNCTION public.get_auth_role() RETURNS text
  LANGUAGE sql STABLE SET search_path = '' AS $$ SELECT auth.role()::text $$;

CREATE OR REPLACE FUNCTION public.get_auth_jwt() RETURNS jsonb
  LANGUAGE sql STABLE SET search_path = '' AS $$ SELECT auth.jwt()::jsonb $$;

CREATE OR REPLACE FUNCTION public.is_admin_from_jwt() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT (auth.jwt() ->> 'app_metadata')::jsonb ? 'is_admin' $$;
```

---

### Migration Summary

One migration with 5 changes:
1. Drop `"Authenticated users can view profiles (authenticated only)"` on profiles
2. Recreate `supabase_realtime` publication with only 7 tables
3. Drop `"Authenticated users can view assignment files"` on storage.objects
4. Drop duplicate notification INSERT policy
5. Fix 4 functions with `SET search_path = ''`

### Code Changes

- Update `src/hooks/notifications/notificationCreate.ts` — no changes needed (already uses `user_id` correctly)
- Update `CHANGELOG.md` with security hardening entry

### No breaking changes expected
All existing functionality relies on the stricter policies that remain in place.

