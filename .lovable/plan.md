## Planner week badge in AppTopBar

### Goal
Show a small "Uge {N}" badge next to the page title in `AppTopBar`, but only when on `/planner`. The badge reflects the currently selected week from `PlannerPage` state.

### Current state
- `AppTopBar` uses `useLocation()` and a `ROUTE_TITLES` map to render the title.
- `PlannerPage` keeps `selectedWeek` / `selectedYear` in local `useState`, persisted to `localStorage` (`plannerSelectedWeek`).
- There is no shared store, no URL param, and Zustand is not installed.
- Other components (`PlannerContent`, `DutyWeekWidget`) receive the week via props from `PlannerPage`.

### What will be built

**1. New tiny store** `src/stores/plannerWeekStore.ts`
- Module-level state `{ week: number; year: number }` initialised from `localStorage` (matching the existing key) or current ISO week.
- `setPlannerWeek(week, year)` updates state and notifies subscribers.
- `usePlannerWeek()` hook built on `useSyncExternalStore` returns the current `{ week, year }`.
- No new dependencies.

**2. Wire `PlannerPage`**
- After `setSelectedWeek` / `setSelectedYear` are updated (in the existing `useEffect` that already syncs `localStorage`), also call `setPlannerWeek(selectedWeek, selectedYear)` so the topbar stays in sync.

**3. Update `AppTopBar`**
- Import `usePlannerWeek`.
- When `location.pathname === '/planner'`, render a span next to the title:
  - Text: `${t('planner.week') || 'Uge'} {week}`
  - Classes: `inline-flex items-center bg-primary/10 text-primary text-[12px] rounded-full px-2 py-0.5 font-medium`
- Hidden on every other route.

### Out of scope
- No removal of the existing week selector inside `PlannerPage`.
- No change to the existing localStorage persistence; the new store reads/writes the same key for continuity.

### Files changed
- `src/stores/plannerWeekStore.ts` (new)
- `src/pages/PlannerPage.tsx`
- `src/components/Layout/AppTopBar.tsx`
