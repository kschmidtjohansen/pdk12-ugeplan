## Create reusable ListSkeleton and replace page-level loading spinners

### Goal
Add a generic `ListSkeleton` component and swap out the loading spinners on CarsPage, WarehousePage, VacationPage, and EmployeesPage.

### What will be built
- **New component**: `src/components/shared/ListSkeleton.tsx`
  - `rowCount` prop (default 8)
  - Each row: 40x40 rounded rect (avatar/icon placeholder) + two stacked lines (70 % and 40 % width) + a short line on the right
  - Uses `bg-muted` and `animate-pulse`
- **Replacements** (page-level spinners only):
  - `CarsPage.tsx` — replace the inline `animate-spin` div with `<ListSkeleton />`
  - `WarehousePage.tsx` — replace `<LoadingSpinner size="lg" />` with `<ListSkeleton />`
  - `VacationPage.tsx` → `VacationTable.tsx` — replace the inline spinner in `isLoading` branch with `<ListSkeleton />`
  - `EmployeesPage.tsx` — no page-level spinner exists (loading is handled internally by `EmployeesTable`). No change on this page unless you want the internal table skeletons swapped as well.

### Technical details
- Component will be styled with Tailwind utility classes (`bg-muted`, `rounded-md`, `animate-pulse`, flexbox layout)
- No new dependencies

### Files changed
- `src/components/shared/ListSkeleton.tsx` (new)
- `src/pages/CarsPage.tsx`
- `src/pages/WarehousePage.tsx`
- `src/components/Vacation/VacationTable.tsx`
