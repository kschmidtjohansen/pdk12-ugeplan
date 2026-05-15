## Status: Guard already in place — proposing comment refinement only

Both edit and delete handlers in `src/pages/PlannerPage.tsx` already guard on `findSeriesSiblings(assignment).length > 1` before opening `SeriesActionDialog`. Lone assignments fall through to direct edit/delete.

### Trace
- **`findSeriesSiblings`** (lines 229–240): returns sibling assignments by `groupId`, or legacy `case_number`/`title` match. Returns `[assignment]` (length 1) when no key.
- **Edit — `handleOpenEditDialog`** (lines 242–251):
  ```ts
  const siblings = findSeriesSiblings(assignment);
  if (siblings.length > 1) setSeriesAction({ assignment, mode: 'edit' });
  else openEditDialogDirect(assignment);
  ```
  Existing comment: *"Only prompt for series action if there are actually multiple sibling assignments. A lone groupId (e.g. after siblings were deleted) should not trigger the prompt."*
- **Delete — `handleDeleteAssignment`** (lines 406–416):
  ```ts
  if (siblings.length > 1) setSeriesAction({ assignment, mode: 'delete' });
  else await deleteAssignment(id);
  ```
  Existing comment: *"Only prompt if this is genuinely a multi-day series."*
- **`SeriesActionDialog`** render (line 724) is gated on `open={!!seriesAction}`, which is only set inside the two `> 1` branches above.

### Proposed change
The guard is correct and has comments, but the user wants it explicitly marked as *intentional behaviour*. I will tighten the two comments to use a shared, unambiguous marker so future contributors don't "fix" it:

1. **Line 244–245** → replace with:
   ```ts
   // INTENTIONAL: only prompt SeriesActionDialog when siblings.length > 1.
   // A lone assignment (incl. orphaned groupId after sibling deletion) edits directly.
   ```
2. **Line 410** → replace with:
   ```ts
   // INTENTIONAL: only prompt SeriesActionDialog when siblings.length > 1.
   // A lone assignment deletes directly without the series prompt.
   ```

No logic changes. No changes to `AssignmentDialogManager.tsx` (separate dialog flow, out of scope).

### Files touched
- `src/pages/PlannerPage.tsx` (2 comment edits)
- `CHANGELOG.md` (1 entry per project workflow)