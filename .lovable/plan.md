## Two fixes

### A) Super Admin treated as Admin everywhere

`usePermissions().isAdmin` and `AuthContext` already include `super_admin`, but several places do strict `role === 'administrator'` checks that exclude super_admins. Update each to include `'super_admin'`.

Files to fix:

1. `src/services/optimizedAssignmentService.ts:406` — `isAdmin` in `fetchAssignmentsFallback` → add `role === 'super_admin'`. Without this, super-admins viewing data through the fallback path only see `published = true` assignments.
2. `src/components/Admin/UserManagement.tsx:55` — local `isAdmin` uses strict equality; replace with `['administrator','super_admin'].includes(authUser?.role)`.
3. `src/components/Planner/UnassignedResourcesSection.tsx:154` — extend the role filter to include `'super_admin'`.
4. `src/components/Duty/DutyEditDialog.tsx:57` — extend `role !== 'administrator' && role !== 'skadeleder'` guard to also allow `'super_admin'`.
5. `src/hooks/notifications/vacationNotifications.ts:17, 105, 243` — replace `user.role !== 'administrator'` / `=== 'administrator'` with admin-or-super-admin checks so super-admins get vacation notifications.
6. `src/hooks/useNotifications.ts:55, 74` — same: admin notifications should fire for super-admins too.

For consistency, introduce a tiny helper `isAdminRole(role)` in `src/utils/roles.ts` returning `role === 'administrator' || role === 'super_admin'`, and use it from each site (keeps the rule in one place so this doesn't regress again).

Already correct (verified, no change): `AuthContext`, `WarehousePage`, `DutySwapDialog`, `ResponsibleUserSelector`, `DutyAssignmentDialog`, `DutyEmployeeSelector`, `AssignmentActionButtons`, `AdminPage`, `DashboardPage`, `QuickAccessGrid`, `useAutoPublishLog`, `AssignmentMessagesPanel`, `SubDepartmentManagement`.

### B) BulkActionBar — swap "Publicér valgte" for "Tildel køretøj"

- `src/components/Planner/BulkActionBar.tsx` — remove the Publish button + `onPublish` prop, add `onAssignCar` button (label "Tildel køretøj", icon `Car` from lucide-react). New button order: `Tildel medarbejder`, `Tildel køretøj`, `Slet valgte`, `Fjern valg`.
- New `src/components/Planner/BulkAssignCarDialog.tsx` — mirrors `BulkAssignEmployeeDialog`, lists cars from `useCars()` (search by `registration_number` / `make` / `model`), confirms with the selected `carId`.
- `src/pages/PlannerPage.tsx`:
  - Drop `handleBulkPublish` and the `onPublish` prop on `BulkActionBar`.
  - Add `bulkAssignCarOpen` state + `handleBulkAssignCar(carId)` that updates the selected assignments via `supabase.from('assignments').update({ car_id: carId }).in('id', [...selectedIds])`, then `refetch()` + `clearSelection()` + toast.
  - Render `<BulkAssignCarDialog />` next to `<BulkAssignEmployeeDialog />`.
  - `publishAssignmentsByIds` mutation stays in the hook (other features may need it) but is no longer wired into the bar.

### Out of scope
- No DB or RLS changes (RLS on `assignments` already permits admin/skadeleder/super-admin updates).
- No changes to compact view (still no bulk select there — same as before).
- No memory update required; the admin-role rule is already documented in Core memory.
