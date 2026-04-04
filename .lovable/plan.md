

## Plan: Series-Aware Edit/Delete with Confirmation Modal

### Problem
Assignments with a shared `groupId` (multi-day series) are currently edited/deleted individually with no awareness of siblings. Users need to choose between modifying a single day or the entire series.

### Solution
1. Create a new `SeriesActionDialog` component that asks "Only this day" vs "Entire series"
2. Intercept edit and delete actions in `usePlannerPage` — when the target assignment has a `groupId`, show the dialog before proceeding
3. Add a `deleteAssignmentsByGroupId` method to delete all records sharing a `group_id`
4. On "Only this day" edit: clear `group_id` from that record (set to `null`) to make it independent, then open the edit dialog as normal
5. On "Entire series" edit: open the edit dialog for the clicked assignment (future enhancement could apply changes to all, but for now it opens the standard edit form for the selected record — the key behavior is the detach-on-single-edit)

### Changes

| File | Change |
|------|--------|
| `src/components/Planner/SeriesActionDialog.tsx` | **New file.** AlertDialog with title, description, two action buttons ("Kun denne dag" / "Hele serien"), and a cancel button. Props: `open`, `onOpenChange`, `mode: 'edit' | 'delete'`, `onSingleDay()`, `onEntireSeries()`. |
| `src/hooks/assignment/useAssignmentActions.ts` | Add `deleteAssignmentsByGroupId(groupId: string)` — queries all assignments with that `group_id`, deletes them and their `assignments_employees` rows. Add `detachFromGroup(id: string)` — updates `group_id = null` for one record. |
| `src/hooks/usePlannerPage.ts` | Add state: `seriesAction: { assignment, mode } | null`. Wrap `handleOpenEditDialog` and `deleteAssignment` to check `assignment.groupId` — if present, set `seriesAction` state instead of proceeding directly. Add handlers `handleSeriesSingleDay` and `handleSeriesEntire` that dispatch to the correct action. Expose `seriesAction` and `setSeriesAction` for the page component. |
| `src/pages/PlannerPage.tsx` | Render `SeriesActionDialog` using `seriesAction` state from the hook. |
| `src/translations/da/planner.ts` | Add keys: `series.title`, `series.description`, `series.onlyThisDay`, `series.entireSeries`, `series.deleteTitle`, `series.deleteDescription`, `series.editTitle`, `series.editDescription` |
| `src/translations/en/planner.ts` | Same keys in English |
| `CHANGELOG.md` | Document the series-aware edit/delete feature |

### Delete flow
- **"Only this day"**: calls existing `deleteAssignment(id)` — removes just that record
- **"Entire series"**: calls new `deleteAssignmentsByGroupId(groupId)` — deletes all assignments + their employee links sharing that `group_id`

### Edit flow
- **"Only this day"**: calls `detachFromGroup(id)` (sets `group_id = null`), then opens the standard edit dialog
- **"Entire series"**: opens the standard edit dialog without detaching — changes apply to the clicked record (series link preserved)

### SeriesActionDialog UI
Uses existing `AlertDialog` components. Two primary buttons side by side, styled distinctly. Delete mode uses destructive styling on "Entire series" button.

