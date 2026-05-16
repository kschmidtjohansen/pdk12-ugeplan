## Findings

Several of the dialogs you named do not exist with those literal names, and `AssignmentDetailsDialog` is already lazy-loaded everywhere it is used. Concretely:

- `AssignmentDetailsDialog` — already `React.lazy` in `PlannerContent.tsx`, `WeeklyAssignments.tsx`, and `MineOpgaver.tsx`. **Not used in `DashboardCockpit.tsx`** (Cockpit renders `WeeklyAssignments`, which owns the dialog). Nothing to change for this one.
- `CreateAssignmentDialog`, `EditAssignmentDialog`, `CarDetailsDialog`, `VacationRequestDialog` — these exact components don't exist. Closest matches:
  - Assignment create/edit goes through `AssignmentDialogManager` (used via `PlannerDialogContainer`).
  - Car: `CarFormDialog`, `CarMarkAvailableDialog`, `CarMarkUnavailableDialog`, `DeleteConfirmDialog` (no "CarDetailsDialog").
  - Vacation: `VacationFormDialog`, `AdminVacationFormDialog`, `VacationDialogs` wrapper (no "VacationRequestDialog").

In `PlannerPage.tsx` the only statically-imported, conditionally-rendered dialogs are `BulkAssignEmployeeDialog` and `BulkAssignCarDialog`.

## Proposed plan

Apply the lazy + `<Suspense fallback={null}>` pattern to dialogs that match the intent of your request (statically imported, conditionally rendered, real components in the codebase):

1. **`src/pages/PlannerPage.tsx`**
   - Convert `BulkAssignEmployeeDialog` and `BulkAssignCarDialog` to `React.lazy`.
   - Wrap their JSX usage in a single `<Suspense fallback={null}>`.

2. **`src/components/Vacation/VacationDialogs.tsx`** (if it statically imports `VacationFormDialog` / `AdminVacationFormDialog`)
   - Convert those to `React.lazy` + `<Suspense fallback={null}>`.

3. **`src/components/Cars/CarDialogs.tsx`**
   - Convert `CarFormDialog`, `CarMarkAvailableDialog`, `CarMarkUnavailableDialog`, `DeleteConfirmDialog` to `React.lazy` + `<Suspense fallback={null}>`.

4. **`src/components/Planner/PlannerDialogContainer.tsx`**
   - Convert `AssignmentDialogManager` (which contains the create/edit assignment dialogs) to `React.lazy` + `<Suspense fallback={null}>`.

No changes to `DashboardCockpit.tsx` (no qualifying dialogs there) and no changes to `AssignmentDetailsDialog` callsites (already lazy).

## Questions before I implement

1. Do you want me to proceed with the mapping above (treating `VacationFormDialog` as the "VacationRequestDialog" and the Cars dialog set as the "CarDetailsDialog" target)?
2. Or should I limit the change strictly to the two real candidates I'm certain about: `BulkAssignEmployeeDialog`, `BulkAssignCarDialog` in `PlannerPage.tsx`, plus the no-op confirmation that `AssignmentDetailsDialog` is already lazy everywhere?