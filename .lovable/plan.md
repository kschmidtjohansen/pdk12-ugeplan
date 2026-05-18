## Plan: Add UPDATE label + dot color to StatusTimeline

`getLabel` already maps `UPDATE`/`UPDATED` to `t('changeLog.operations.UPDATE')` ("Opdateret" / "Updated"), but `getDotColor` falls through to the neutral `bg-muted-foreground`, so changed events look indistinct.

### Changes

**`src/components/Dashboard/StatusTimeline.tsx`**
- In `getDotColor`, add a branch for `UPDATE`/`UPDATED` → `bg-blue-500` (matches the blue used for UPDATE in `AssignmentHistoryTab.tsx`, keeping the timeline visually consistent across the app).
- Keep the existing fallback for unknown ops.

No translation changes needed — `changeLog.operations.UPDATE` already exists in both `da` and `en`.

### Out of scope
- Other operations, query logic, layout, ordering, skeleton.
- `AssignmentHistoryTab` (already handles UPDATE).
