# Plan: Refine Haversine sort memoization

## Finding
The Haversine distance + sort logic is **not** in `src/hooks/employee/` — it lives in `src/components/Planner/EmployeeSelector.tsx` (lines 51–77). It is the only place `haversineDistanceKm` is used for employee suggestions.

It is already wrapped in `useMemo` with the correct deps (`[employees, caseLat, caseLng]` for `distanceMap`, and the same plus `distanceMap` for `sortedEmployees`). So most of the request is already satisfied.

Two small refinements remain to match the spec:

1. **Early-return unsorted list when assignment has no GPS coords.** Today, when `caseLat`/`caseLng` are null, the code still runs an alphabetical `[...employees].sort(...)`. The spec says return the unsorted list immediately. We'll change the `else` branch to `return employees;` (no copy, no sort).
2. **Add the requested comment** above the memo block: `// Haversine sort — deps: employee list + assignment GPS coords`.

## Changes
**File:** `src/components/Planner/EmployeeSelector.tsx`

- Replace the comment on line 51 with the requested wording.
- In `sortedEmployees` (lines 63–77), keep the existing memoized sort when coords are present; when `caseLat == null || caseLng == null`, `return employees` directly (skip the alphabetical sort).

## Out of scope
- No new hook under `src/hooks/employee/` — moving the logic out of the component would be a larger refactor and would touch rendering deps (`distanceMap`, `top3NearbyIds`). Flag if you want me to extract it anyway.
- No behavior change to `distanceMap` or `top3NearbyIds`.
- No changelog entry needed for a 2-line tweak unless you want one.

## Note on existing behavior
Previously, the no-coords branch sorted employees alphabetically. After this change the list will appear in whatever order `employees` arrives from the parent. Confirm that's acceptable — if you still want alphabetical fallback when coords are missing, say so and I'll keep the sort in that branch.
