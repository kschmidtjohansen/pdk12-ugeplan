## Goal

Address six related polish items across Dashboard, Planner, Duty, Cars, Layout and translations.

---

## 1. CompactKpiStack modals receive correct data + states

**File:** `src/components/Dashboard/CompactKpiStack.tsx`, `src/hooks/useDashboardMetrics.ts`

- The stack already pulls `assignments` and `vacations` from `useDashboardMetrics`, but the modals are always anchored to "today". Make the date driven by a prop (`selectedDate`) so the cockpit can later sync it with the dashboard week navigation. Default remains today.
- Pass `assignments` (filtered to selectedDate) and `vacations` (filtered to overlap selectedDate) to each modal.
- Add explicit error state below the existing skeleton (red inline card using `t('common.errorLoadingData')`) when `useDashboardMetrics` returns `error`.
- Show a small spinner inside each modal trigger button while loading instead of a value of `0` flicker (use `loading` from the hook).
- `AbsentEmployeesModal` and `CarAvailabilityModal` get the same `selectedDate`, `assignments`, `vacations` props for consistency (extend their interfaces minimally; they currently only show today's data).

## 2. Week-number navigation on Dashboard

**Files:** `src/pages/DashboardPage.tsx`, `src/components/Dashboard/DashboardCockpit.tsx`, new wrapper around `WeeklyAssignments` (already exists but unused).

- Lift `selectedWeek` / `selectedYear` state into `DashboardPage` (persisted in `localStorage` under `dashboardSelectedWeek` / `dashboardSelectedYear`, defaulting to current ISO week via `getISOWeek` / `getISOWeekYear`).
- Pass them to `DashboardCockpit`, which renders the existing `WeeklyAssignments` component in the LEFT column (above `MineOpgaver`) with `onPreviousWeek` / `onNextWeek` handlers using `addWeeks` like `PlannerPage`.
- Filter assignments for the selected week using the same ISO-week predicate as `PlannerPage` and feed `WeeklyAssignments`.
- Sync `selectedDate` for `CompactKpiStack` to the Monday of the selected week (so KPI modals reflect the chosen week's first day; "today" still wins when current week is selected).

## 3. DutyPage stray wrapper tag

**File:** `src/pages/DutyPage.tsx`

- The component opens `<div className="min-h-screen…">` then `<div className="w-full px-…">` and inside that a `<div className="mb-1">` for the header. The header's inner content closes `</div>` on line 148 but the outer `<div className="w-full…">` only closes on line 241 — meanwhile `<Tabs>` and dialogs sit at the root indentation as if they were outside. Inspect closely: the indentation jumps because the JSX is structurally fine but visually misleading (Tabs/dialogs are still siblings inside `w-full`). The actual issue: the `<DataFetchErrorBoundary>` wraps a `<div>` that wraps a `<div>` — this duplicates min-h-screen padding from `AppShell`/`MainLayout` and breaks horizontal spacing on small breakpoints.
- Fix: remove the inner `min-h-screen w-full bg-background` wrapper (already provided by `AppShell`'s `<main>`), keep only the padded container (`w-full px-… py-5 space-y-4`). Verify all closing tags balance.

## 4. CarsPage SegmentedFilterBar end-to-end

**File:** `src/pages/CarsPage.tsx` (already wired) plus translation keys.

- Wiring is already in place. Polish:
  - Add missing translation keys: `cars.pageDescription`, `cars.searchPlaceholder`, `common.all` (DA + EN).
  - Bug: search filter looks at `c.license_plate` but the schema field is `number_plate`. Fix to `c.number_plate`.
  - Ensure dialogs (`CarDialogs`, mark-available/unavailable) still use the unfiltered `cars` array (already correct).
  - When `filteredCars` is empty after filtering, show an empty state inside the list area instead of a blank panel (use `t('cars.noResults')`, add key).

## 5. Move vacation toast into AppTopBar / remove from TopNavbar

**Files:** `src/components/Layout/AppTopBar.tsx`, `src/components/Layout/TopNavbar.tsx`

- Logic is already present in `AppTopBar` (lines 36–56). `TopNavbar` is no longer rendered anywhere (`AppShell` only uses `AppTopBar`), but the file still contains the duplicate `useEffect`.
- Delete the duplicate `useEffect` block from `TopNavbar.tsx` (lines 41–81) and the now-unused `useVacationRequestsStatus` import. Leave the file otherwise intact since it may still be referenced by tests/legacy entry points (verify with `rg`; if no references besides self, delete the file entirely).
- Verify trigger: `useVacationRequestsStatus` re-evaluates via realtime/`useVacations` cache; toast resets when `hasPendingRequests` becomes false (already implemented). No additional change needed.

## 6. Global translation consistency sweep

**Files:** `src/translations/da/*.ts`, `src/translations/en/*.ts`

- Audit all 18 translation files (DA vs EN) and ensure every key present in DA has an EN counterpart and vice versa. Build a small script (run once during implementation) to diff keys per file and patch missing ones.
- Specifically add/verify:
  - `common.all`, `common.errorLoadingData`, `common.noResults`
  - `cars.pageDescription`, `cars.searchPlaceholder`, `cars.noResults`
  - `dashboard.week`, `dashboard.metrics.title`, `dashboard.metrics.availableEmployees/availableCars/absentEmployees/warehouseItems`
  - `vacation.pendingRequestsTitle`, `vacation.pendingRequestsDescription`, `vacation.openVacationPage`
  - `navigation.*` for all routes used in `AppTopBar` ROUTE_TITLES
- Replace any remaining hardcoded Danish strings discovered in `AppTopBar`, `AppSidebar`, `CompactKpiStack`, `DashboardCockpit`, `WeeklyAssignments` (e.g. fallback `|| 'Nøgletal'`) with proper `t()` keys + ensure both DA and EN entries exist.

---

## Technical notes

- KPI date sync uses `startOfISOWeek(weekStart)` for a deterministic anchor; if the selected week contains today, anchor stays at today.
- DutyPage fix is purely structural — no behaviour change beyond removing the duplicate `min-h-screen` wrapper.
- TopNavbar removal must be guarded by a final `rg "TopNavbar"` check; if zero non-self references, the file is deleted; otherwise only the toast logic is removed.
- After translation sweep, run `tsc` (auto by harness) to catch any newly-introduced missing keys.

## Out of scope

- Visual redesign of WeeklyAssignments card (only data wiring + week nav).
- Refactor of `useDashboardMetrics` beyond surfacing `selectedDate` plumbing.
- Restructuring `DutyPage` tabs/calendar UX.

## Files touched

- `src/pages/DashboardPage.tsx`
- `src/components/Dashboard/DashboardCockpit.tsx`
- `src/components/Dashboard/CompactKpiStack.tsx`
- `src/components/Dashboard/AbsentEmployeesModal.tsx`
- `src/components/Dashboard/CarAvailabilityModal.tsx`
- `src/hooks/useDashboardMetrics.ts` (minor: accept selectedDate)
- `src/pages/DutyPage.tsx`
- `src/pages/CarsPage.tsx`
- `src/components/Layout/TopNavbar.tsx` (cleanup or delete)
- `src/translations/da/*.ts`, `src/translations/en/*.ts`
- `CHANGELOG.md`, `docs/implementation-plan/tasks.md`
