
# Security Hardening Plan

Goal: close all critical/warn findings without breaking existing authenticated flows. All work is additive policy/function changes — no table drops, no data loss.

## 1. Drop overly permissive `{public}` SELECT policies

These permissive duplicates short-circuit the stricter policies via OR-logic. Drop them; the existing `authenticated`-scoped policies already cover legitimate access.

```sql
DROP POLICY "Users can view all cars" ON public.cars;
DROP POLICY "Users can view all warehouse items" ON public.warehouse_items;
DROP POLICY "Users can view all profiles" ON public.profiles;
DROP POLICY "Anyone can view user roles" ON public.user_roles;
DROP POLICY "Anyone can view departments" ON public.departments; -- duplicate of authenticated one
```

Also revoke any leftover `anon` privileges on these tables:
```sql
REVOKE SELECT ON public.cars, public.warehouse_items, public.profiles, public.user_roles FROM anon;
```

Verified safe: `cars_select`, `warehouse_items_select_policy_authenticated`, `secure_profile_access_unified`, and `user_roles_select_policy` all cover authenticated reads. Apps use the authenticated supabase client.

## 2. Tighten `storage.objects` INSERT for `assignment-files`

Replace the loose `auth.uid() IS NOT NULL` policy with membership check:

```sql
DROP POLICY "Storage insert: assignment files or avatars" ON storage.objects;

CREATE POLICY "Storage insert assignment-files (members only)"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files'
  AND (
    public.is_admin_or_skadeleder()
    OR EXISTS (
      SELECT 1 FROM public.assignments_employees ae
      WHERE ae.user_id = auth.uid()
        AND ae.assignment_id::text = (storage.foldername(name))[1]
    )
    OR EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.responsible_user_id = auth.uid()
        AND a.id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Storage insert avatars (own folder)"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

Assumes assignment files are stored under `<assignment_id>/...`. I'll verify the path convention in `useAssignmentFiles.ts` before writing the migration.

## 3. SECURITY DEFINER function lockdown

For all project-owned SECURITY DEFINER helpers (`has_role`, `is_admin_user`, `is_admin_or_skadeleder`, `is_super_admin`, `can_access_vacation`, `can_view_assignment_optimized`, `get_user_department_ids`, `get_current_user_role`, `log_security_event_safe`, etc.):

```sql
REVOKE EXECUTE ON FUNCTION public.<fn>(args) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.<fn>(args) TO authenticated, service_role;
```

`log_security_event_safe` → also grant to `service_role` only (not authenticated) since it should run from triggers/edge fns.

I'll enumerate the actual function signatures via `pg_proc` in the migration to revoke each correctly.

## 4. Super admin access to assignments

Update `can_view_assignment_optimized` (and similar) to include `super_admin`:

```sql
CREATE OR REPLACE FUNCTION public.can_view_assignment_optimized(_assignment_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    public.has_role(_user_id, 'super_admin'::public.user_role)
    OR public.has_role(_user_id, 'administrator'::public.user_role)
    OR public.has_role(_user_id, 'skadeleder'::public.user_role)
    OR EXISTS (SELECT 1 FROM public.assignments_employees ae
               WHERE ae.assignment_id = _assignment_id AND ae.user_id = _user_id)
    OR EXISTS (SELECT 1 FROM public.assignments a
               WHERE a.id = _assignment_id AND a.responsible_user_id = _user_id);
$$;
```

I'll first read the current function body before rewriting to preserve any extra logic.

## 5. Remove logging from RLS USING clause

Rewrite `secure_profile_access_unified` without the inline `log_security_event_safe()` call:

```sql
DROP POLICY secure_profile_access_unified ON public.profiles;

CREATE POLICY secure_profile_access_unified ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrator','skadeleder','super_admin']::public.user_role[])
  )
);
```

If admin-access auditing is still required, add an `AFTER SELECT` is not possible — instead log from the application layer in the admin-list-users edge function (already logs there).

## 6. Edge function error sanitisation

Patch these functions to log full error server-side but return generic message:
- `admin-list-users`
- `admin-user-role`
- `admin-create-user`
- `admin-user-status`
- `cleanup-expired-users`
- `cleanup-change-logs`
- `send-duty-reminders`
- `swap-duties`

Pattern:
```ts
} catch (err) {
  console.error(`[${requestId}]`, err);
  return new Response(
    JSON.stringify({ error: 'Internal server error', requestId }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```
Also replace inline `: error.message` strings in 4xx responses with stable, non-revealing messages (`'Authentication failed'`, `'Permission denied'`, `'Invalid request'`).

## 7. Remove browser admin-API fallback

In `src/hooks/employee/useEmployeeCreation.ts`, delete the `createUserDirectly()` path that calls `supabase.auth.admin.createUser()`. If the edge function fails, surface the error to the user instead of silently falling back.

## 8. Docs

- `CHANGELOG.md` — security hardening entry summarising all changes.
- `docs/technical-specs/architecture.md` — note the policy cleanup.
- `mem://index.md` — add a Core line: "RLS: no `{public}` USING(true) policies; never log inside USING clauses."

## Execution order

1. Read current bodies of `can_view_assignment_optimized`, `secure_profile_access_unified`, storage policies, file-path convention in `useAssignmentFiles.ts`.
2. Single migration covering sections 1–5 (and signature-correct REVOKEs from section 3).
3. Edit edge functions (section 6) and `useEmployeeCreation.ts` (section 7) in the same build step.
4. Update CHANGELOG + memory.
5. Run `supabase--linter` and security scan to confirm findings are cleared.

## Risk / regression checks

- Storage upload tested via existing upload flow (admin + assigned employee + unrelated user).
- `cars`/`warehouse_items`/`profiles`/`user_roles` reads exercised through the app while signed in as servicemedarbejder, skadeleder, admin, and super_admin.
- Super admin can now see assignments list (previously blocked).
- Confirm no edge function callers rely on parsed `error.message` strings (frontend currently shows them via toast — acceptable to switch to generic).

Confirm to switch to build mode and I'll start with the read-back of the function bodies + storage paths, then issue the migration.
