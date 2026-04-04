

## Plan: Fix 6 Security Scan Findings

### Root Cause

Three `hide_demo_data_*` policies were written with `roles: {public}` and conditions like `is_demo = false`, which **exposes all non-demo production data to unauthenticated users**. Because Postgres OR's all PERMISSIVE policies together, these override every restrictive policy on the same table.

### Findings & Fixes

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 1 | **Profiles publicly readable** — `hide_demo_data_profiles` has `roles:{public}` with `is_demo = false` qual, exposing all real profiles | ERROR | Drop policy. Recreate with `roles: {authenticated}` and proper auth check |
| 2 | **User roles publicly readable** — `Anyone can view user roles` has `qual: true` and `roles:{public}` | ERROR | Drop policy. The existing `user_roles_select_policy` (authenticated) is sufficient |
| 3 | **Cars publicly readable** — `hide_demo_data_cars` has `roles:{public}` | ERROR | Drop policy. Recreate with `roles: {authenticated}` |
| 4 | **Warehouse items publicly readable** — `hide_demo_data_warehouse` has `roles:{public}` with `is_demo = false` qual | ERROR | Drop policy. Recreate with `roles: {authenticated}` |
| 5 | **Realtime channels unrestricted** — No RLS on `realtime.messages` | ERROR | We cannot modify the `realtime` schema (Supabase-reserved). The Realtime publication was already restricted to 7 tables, and RLS on those tables filters rows. Document as accepted risk. |
| 6 | **assignments_employees too broad for servicemedarbejder** | WARN | Tighten `assignments_employees_select_policy` to add `user_id = get_auth_uid()` for servicemedarbejder role |

### Migration SQL

One migration that:

1. **DROP** `hide_demo_data_profiles` → **CREATE** replacement with `FOR authenticated` and same demo-filtering logic
2. **DROP** `Anyone can view user roles`
3. **DROP** `hide_demo_data_cars` → **CREATE** replacement with `FOR authenticated`
4. **DROP** `hide_demo_data_warehouse` → **CREATE** replacement with `FOR authenticated`
5. **DROP + CREATE** `assignments_employees_select_policy` with added `user_id` restriction for servicemedarbejder

Additionally, change profiles-related policies that use `roles: {public}` to `roles: {authenticated}`:
- `Users can update own profile`
- `secure_profile_access_unified`
- `secure_profile_updates`

### Realtime Finding (Accepted Risk)

The `realtime.messages` table is in a Supabase-reserved schema — we cannot add RLS policies there. Mitigation is already in place: the `supabase_realtime` publication is restricted to 7 specific tables, and each table has its own RLS that filters rows. This is the maximum protection available without Supabase enterprise features.

### Code Changes

- `CHANGELOG.md` — document fixes

### No breaking changes expected

All policies keep the same access logic but require authentication. The app already requires login, so authenticated users see the same data as before.

