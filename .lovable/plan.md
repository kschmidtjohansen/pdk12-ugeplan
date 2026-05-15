## Plan: Conditional row virtualisation for desktop EmployeesTable

### Threshold
- Desktop, `employees.length > 50` → virtualised body (no pagination).
- Desktop, `employees.length ≤ 50` → existing `SimplePagination` path unchanged.
- Mobile path → unchanged (out of scope).

### Install
- `bun add @tanstack/react-virtual` (~3 kB).

### Implementation in `src/components/Employees/EmployeesTable.tsx`

**Shared**
- Add `aria-rowcount={employees.length + 1}` (rows + header) on the `<Table>` element so it always reflects total filtered count, in both paginated and virtualised paths.

**Virtualised path** (rendered when `!isMobile && employees.length > 50`)
- Wrap `<Table>` in a fixed-height scroll container ref (`parentRef`), e.g. `className="max-h-[calc(100vh-260px)] overflow-auto"`. The shadcn `<Table>` already adds an inner `overflow-auto` div — pass `className="!overflow-visible"`-ish override or render the raw table directly. To keep things clean, wrap the `<Table>` inside a `<div ref={parentRef} className="max-h-[...] overflow-auto">` and override the inner wrapper with `className=""` (Table's wrapper still works, but we virtualise based on the outer scroller).
- `useVirtualizer({ count: employees.length, getScrollElement: () => parentRef.current, estimateSize: () => 56, overscan: 8 })`.
- Inside `<TableBody>`:
  - First row: `<tr style={{ height: virtualizer.getVirtualItems()[0]?.start ?? 0 }} />` spacer.
  - Map only `virtualizer.getVirtualItems()` to `<EmployeeTableRow>` keyed by `employee.id`. Pass `aria-rowindex={virtualItem.index + 2}` (1 = header).
  - Trailing spacer row: `<tr style={{ height: totalSize - lastEnd }} />`.
- Sticky header already supported (`thead ... sticky top-0`).
- Hide `<SimplePagination>` in this branch.

**Paginated path** (≤50)
- No layout change, just add the `aria-rowcount` attribute.

### Caveats / acceptable trade-offs
- Native column auto-sizing across all rows is lost (only visible rows participate). Acceptable for >50 rows where consistent visual density matters more than perfect per-cell auto-fit. If a column collapses, we can pin widths in a follow-up.
- Fixed scroll viewport replaces window scrolling for big lists. This is standard behaviour for virtualised tables.

### Out of scope
- Refactor of `EmployeeTableRow` cells (no width changes needed for the threshold to function).
- Mobile virtualisation.
- Other tables (Cars, Warehouse) — same pattern can be applied later.

### Files touched
- `package.json` (+ `@tanstack/react-virtual`)
- `src/components/Employees/EmployeesTable.tsx`
- `CHANGELOG.md`