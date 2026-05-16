## Plan: Add week-navigation prefetch on hover in PlannerPage

**What**
Add `onMouseEnter` prefetch handlers to the previous-week and next-week arrow buttons in `PlannerPage.tsx`. When the user hovers over either arrow, the app proactively fetches assignment data so week navigation feels instant.

**How**
1. **Export a reusable fetcher** from `src/hooks/useOptimizedAssignments.ts`
   - Extract the `fetchAssignmentsFn` body into an exported async function `fetchAllAssignmentsForQuery` that accepts `user`, `filter`, `selectedDepartmentId`, `selectedSubDepartmentId`, and `allEmployees` as explicit arguments and returns `Promise<Assignment[]>`.
   - Update the hook's internal `queryFn` to call this exported function.

2. **Wire up prefetch in PlannerPage**
   - Import `useQueryClient` from `@tanstack/react-query` and the new `fetchAllAssignmentsForQuery` helper.
   - Import `useEmployeeData` to obtain `allEmployees` (needed for the conversion step).
   - Get `queryClient` via `useQueryClient()`.
   - Create a `handlePrefetch` helper that builds the exact query key `['assignments', user?.id, user?.role, 'all', selectedDepartmentId, selectedSubDepartmentId]` and calls `queryClient.prefetchQuery({ queryKey, queryFn: () => fetchAllAssignmentsForQuery(...), staleTime: 2 * 60 * 1000 })`.
   - Add `onMouseEnter={handlePrefetch}` to both the `<Button variant="ghost" ...>` elements for previous and next week.

**Key detail:** `useOptimizedAssignments('all')` loads all assignments (not per-week), so the adjacent-week prefetch uses the identical query key. The benefit is ensuring the cache stays warm if it has expired, making navigation instant.
