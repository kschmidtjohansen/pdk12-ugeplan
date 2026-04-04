

## Plan: Context Menu Publish + Midnight Auto-Publish

### 4 requests identified

1. **Test multi-day booking series dialog** — Manual testing task; no code changes needed. The user should right-click or click Edit/Delete on a booking with a `groupId` to verify the `SeriesActionDialog` appears.

2. **Verify context menu works** — Manual testing task; no code changes needed. Right-click a booking card in planner to see Edit/Duplicate/Delete.

3. **Add "Publish" to context menu** — Code change needed.

4. **Auto-publish at midnight (00:00) instead of 16:00** — Code change needed.

---

### Change 1: Add "Publicer" to context menu

| File | Change |
|------|--------|
| `src/components/Planner/AssignmentCard.tsx` | Add a "Publicer" `ContextMenuItem` (with `Send` icon) after Duplicate, only when `!assignment.published && onPublish && canEdit`. |
| `src/components/Planner/CompactAssignmentRow.tsx` | Same change. |
| `src/translations/da/planner.ts` | Add `contextMenu.publish: 'Publicer'` |
| `src/translations/en/planner.ts` | Add `contextMenu.publish: 'Publish'` |

The menu item calls the existing `onPublish` prop (already available on both components).

### Change 2: Auto-publish at midnight (dagsskifte)

| File | Change |
|------|--------|
| `src/hooks/useAutoPublishAssignments.ts` | Change the publish trigger from 16:00 to **00:00**. At midnight, find all unpublished assignments where `assignment.date` equals **yesterday's date** (the day that just ended) and publish them. This ensures that e.g. Tuesday's assignments get published at midnight Tuesday→Wednesday if they weren't already. |

Logic change:
```
// Current: publishes today's assignments at 16:00
// New: at 00:00, publish previous day's assignments
const yesterday = format(subDays(now, 1), 'yyyy-MM-dd');
const unpublished = assignments.filter(a => a.date === yesterday && !a.published);
```

### Change 3: Update CHANGELOG.md

Document both changes.

### Testing notes (items 1 & 2)
These are manual verification tasks — no code changes. The user should:
- Create a multi-day booking, then try to edit/delete one of the days to see the series dialog
- Right-click a booking card to see the context menu

