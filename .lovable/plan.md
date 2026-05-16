## Bulk multi-select for planner assignments

Add hover-checkbox selection on `AssignmentCard` and a floating `BulkActionBar` driven by selection state held in `PlannerPage`.

### 1. Selection state in `PlannerPage`
- `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())`.
- Helpers `toggleSelect(id)`, `clearSelection()`, `isSelected(id)`.
- `useEffect([selectedWeek, selectedYear])` → `clearSelection()` so changing week wipes selection.

### 2. Prop drilling
Pass `selectedIds`, `selectionActive` (= `selectedIds.size > 0`), and `onToggleSelect` through:
- `PlannerContent` → existing day-rendering wrappers → `DaySection` / `VirtualizedAssignmentCards` → `AssignmentCard`.
Only the new props are added; existing handlers stay untouched.

### 3. `AssignmentCard` changes
- Accept `selected: boolean`, `selectionActive: boolean`, `onToggleSelect?: (id, ev) => void`.
- Wrap content in `group` and render a `Checkbox` (shadcn) absolutely positioned top-left.
  - Visible when `selected || selectionActive` (always shown) OR `group-hover` (CSS `opacity-0 group-hover:opacity-100`, plus forced `opacity-100` when `selected || selectionActive`).
  - `onClick` stops propagation and calls `onToggleSelect(assignment.id, e)`. Supports shift-click later (out of scope now; pass event through anyway).
- When `selected`, add ring style (`ring-2 ring-primary`) on the `Card`.
- Card body click is unchanged — selection only happens via the checkbox to avoid breaking edit-on-click. (Optional: when `selectionActive`, a card body click toggles selection instead of opening edit. We'll include this behavior since it matches typical bulk-select UX.)

### 4. New `BulkActionBar` component
`src/components/Planner/BulkActionBar.tsx`
- Fixed position: `fixed bottom-4 left-1/2 -translate-x-1/2 z-40` with `pb-[env(safe-area-inset-bottom)]`; on mobile (`<sm`) lifted above bottom nav via `bottom-20`.
- Pill container: `bg-background border shadow-lg rounded-full px-3 py-2 flex items-center gap-2`.
- Content: `"{count} valgt"` label, then buttons:
  - **Publicér valgte** → `onPublishSelected()`
  - **Slet valgte** → `onDeleteSelected()` (confirm via existing toast/AlertDialog pattern used in PlannerPage)
  - **Tildel medarbejder** → `onAssignEmployee()` opens a new lightweight `BulkAssignEmployeeDialog` (employee picker → calls `assignEmployeeToAssignments(ids, userId)`)
  - **Fjern valg** (ghost) → `onClear()`
- Disables action buttons while a bulk mutation is in-flight.
- Animates in with `data-[state=open]` slide-from-bottom (Tailwind `animate-in slide-in-from-bottom-4`).

Rendered from `PlannerPage` directly (not inside `PlannerContent`) so it floats over the entire layout.

### 5. Bulk handlers in `PlannerPage`
- `handleBulkPublish`: extend `OptimizedAssignmentService.publishAssignmentsByDate` with a sibling method `publishAssignmentsByIds(ids: string[], userEmail?)` that does `.update({ published: true }).in('id', ids)`, clears cache, and is exposed through `useOptimizedAssignments` + `useAssignmentsConsolidated` as `publishAssignmentsByIds`. Then `await publishAssignmentsByIds([...selectedIds])` and `clearSelection()`.
- `handleBulkDelete`: loop `await deleteAssignment(id)` for each (existing mutation already handles cache invalidation). Wrap in `Promise.all` for parallelism but cap with try/catch. Show single toast at the end. Confirm via existing `AlertDialog` pattern.
- `handleBulkAssignEmployee(userId)`: insert rows into `assignments_employees` for every selected id that doesn't already have that user. Use existing assignment-employee mutation if available; otherwise add a small Supabase call inside the new dialog handler. Clear selection on success.

### 6. Files
**New**
- `src/components/Planner/BulkActionBar.tsx`
- `src/components/Planner/BulkAssignEmployeeDialog.tsx`

**Edited**
- `src/pages/PlannerPage.tsx` — selection state, week-change reset, bulk handlers, render `<BulkActionBar />`.
- `src/components/Planner/PlannerContent.tsx` — pass through selection props.
- `src/components/Planner/DaySection.tsx` — pass through selection props to both standard and virtualized card renders.
- `src/components/Planner/AssignmentCard.tsx` — checkbox + selected ring + selectionActive click behavior.
- `src/services/optimizedAssignmentService.ts` — add `publishAssignmentsByIds`.
- `src/hooks/useOptimizedAssignments.ts` + `src/hooks/useAssignmentsConsolidated.ts` — expose `publishAssignmentsByIds`.

### Out of scope
- Shift-click range selection (event is forwarded so it can be added later).
- Persisting selection across reloads.
- Bulk edit of fields beyond employee assignment.
- Cars / sub-dept changes from the bulk bar.
- RLS changes (existing policies on `assignments`, `assignments_employees` already cover admin/skadeleder bulk operations).
