

## Plan: Undo-able Delete with Delayed Database Deletion

### Problem
Deletions are immediate and irreversible. The user wants a 5-second grace period with an "Undo" button in a toast notification.

### Solution
Modify `deleteAssignment` and `deleteAssignmentsByGroupId` in `useOptimizedAssignments.ts` to:
1. Remove assignment(s) from UI immediately (optimistic)
2. Show a toast with an "Undo" action button
3. Set a 5-second timeout before executing the actual database deletion
4. If "Undo" is clicked, cancel the timeout, restore the assignment(s) to local state, and dismiss the toast

### Changes

| File | Change |
|------|--------|
| `src/hooks/useOptimizedAssignments.ts` | Refactor `deleteAssignment` and `deleteAssignmentsByGroupId` to use a pending-delete pattern with `setTimeout` + undo |
| `src/translations/da/planner.ts` | Add `undo` key |
| `src/translations/en/planner.ts` | Add `undo` key |
| `CHANGELOG.md` | Document the undo-delete feature |

### Technical detail

**`deleteAssignment` new flow:**
```typescript
const deleteAssignment = useCallback(async (id: string) => {
  const original = assignments.find(a => a.id === id);
  if (!original) return;

  // 1. Optimistic removal
  setAssignments(prev => prev.filter(a => a.id !== id));

  // 2. Set up delayed deletion
  let cancelled = false;
  const timeoutId = setTimeout(async () => {
    if (cancelled) return;
    try {
      await OptimizedAssignmentService.deleteAssignment(id, user.email);
      OptimizedAssignmentService.clearCache();
    } catch (error) {
      // Restore on failure
      setAssignments(prev => [...prev, original].sort(...));
      toast({ variant: 'destructive', ... });
    }
  }, 5000);

  // 3. Show toast with Undo
  toast({
    title: t('planner.assignmentDeleted'),
    description: original.case_number ? ... : ...,
    action: <ToastAction altText="Undo" onClick={() => {
      cancelled = true;
      clearTimeout(timeoutId);
      setAssignments(prev => [...prev, original].sort(...));
    }}>{t('planner.undo')}</ToastAction>,
    duration: 6000,
  });
}, [...]);
```

**`deleteAssignmentsByGroupId` — same pattern** but stores all removed assignments and restores the full set on undo.

**Toast duration**: Set to 6000ms (slightly longer than the 5s delete delay) so the Undo button remains visible for the full grace period. The existing `TOAST_AUTO_CLOSE_DELAY` (5000ms) in `use-toast.ts` will be overridden per-toast via the `duration` prop on `ToastPrimitives.Root` — Radix Toast already supports this prop natively.

**No changes to `PlannerPage.tsx`** — the handlers there call `deleteAssignment` and `deleteAssignmentsByGroupId` which are being modified in-place.

### Import needed
`ToastAction` from `@/components/ui/toast` will be imported in `useOptimizedAssignments.ts` to create the Undo button element.

