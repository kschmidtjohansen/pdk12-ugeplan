

## Plan: Audit Trail Timeline in Booking Edit Dialog

### Problem
There is no per-booking history view. The `planner_change_log` table already stores CREATE/UPDATE/DELETE/PUBLISH events with `assignment_id`, timestamps, user names, and change details — but this data is not surfaced in the booking modal.

### Solution
Add a "Historik" (History) tab to the booking edit dialog that queries `planner_change_log` for the current assignment's ID (and its `group_id` siblings if part of a series) and displays entries as a chronological timeline.

### Changes

| File | Change |
|------|--------|
| `src/components/Planner/AssignmentHistoryTab.tsx` | **New.** Fetches `planner_change_log` entries where `assignment_id` matches the current assignment (or any assignment sharing its `group_id`). Renders a vertical timeline with timestamp, operation badge (color-coded), user name, and human-readable change summary. Uses existing Supabase client. |
| `src/components/Planner/AssignmentDialogManager.tsx` | Wrap `AssignmentForm` + `AssignmentHistoryTab` in a `<Tabs>` component. Show "Detaljer" (Details) tab containing the form, and "Historik" (History) tab containing the timeline. Only show the History tab when editing (i.e. `currentAssignment` is not null). |
| `src/translations/da/planner.ts` | Add keys: `history.tab`, `history.noEntries`, `history.created`, `history.updated`, `history.deleted`, `history.published`, `history.changedBy`, `history.fieldChanged` |
| `src/translations/en/planner.ts` | Same keys in English |
| `CHANGELOG.md` | Document the audit trail feature |

### AssignmentHistoryTab details

**Data fetching:** On mount, query `planner_change_log` filtered by `assignment_id = currentAssignment.id`. If the assignment has a `groupId`, also fetch logs for all sibling assignment IDs (query assignments table for matching `group_id`, then fetch logs for all those IDs). Results ordered by `created_at DESC`.

**Timeline rendering:** Each entry renders as:
- Timestamp (formatted with `date-fns`, locale-aware)
- Color-coded operation badge (green=CREATE, blue=UPDATE, red=DELETE, orange=PUBLISH)
- User first name (`changed_by_first_name`)
- Change summary: parse `change_details.changes` to show field-level diffs (e.g. "Titel: 'A' → 'B'", "Medarbejdere: +Anders, -Marie")

**UI pattern:** Vertical timeline with a left border line and dots, using Tailwind utilities. Skeleton loading state while fetching. Empty state message when no history exists.

### No database changes needed
The `planner_change_log` table already has all required columns (`assignment_id`, `operation`, `changed_by_first_name`, `change_details`, `created_at`) and appropriate RLS policies for admin/skadeleder access.

