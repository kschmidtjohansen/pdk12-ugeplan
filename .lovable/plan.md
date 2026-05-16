No changes needed — this work is already complete in the codebase.

### Verified

- **`src/components/shared/ListSkeleton.tsx`** exists and matches the spec: accepts `rowCount` (default 8), renders rows with a 40×40 (`h-10 w-10`) rounded avatar square, two stacked lines at 70% / 40% width, and a short right-side line, all using `bg-muted animate-pulse`.
- **`src/pages/WarehousePage.tsx`** — `{loading ? <ListSkeleton /> : …}` (line 61).
- **`src/pages/CarsPage.tsx`** — `{loading ? <ListSkeleton /> : …}` (line 91).
- **`src/pages/EmployeesPage.tsx`** — loading is delegated to `EmployeesTable`, which renders `<ListSkeleton />` when `loading` is true.
- **`src/pages/VacationPage.tsx`** — loading is delegated through `VacationPageContainer → VacationTabContent → VacationList → VacationTable`, which renders `<ListSkeleton />` when `isLoading` is true.

### Optional cleanup (only if you want it)

`WarehousePage.tsx` still imports `LoadingSpinner` on line 12 even though it is no longer used. I can remove that dead import if you'd like — otherwise nothing to do.