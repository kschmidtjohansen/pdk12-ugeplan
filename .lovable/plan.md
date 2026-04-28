## Plan

Three small, focused refinements: consistent week numbering, real Polygon logo in the collapsed sidebar tile, and dashboard right-rail reordering so KPI metrics sit above "Mine Opgaver".

### 1. Consistent selected-week display

Make the **selected** week (not "current week") show everywhere a week number appears.

- `src/components/Dashboard/MineOpgaver.tsx`
  - Currently the card title hard-codes `Uge {getCurrentWeekInfo().week}`. This is misleading when the dashboard is paged to a different week.
  - Accept optional `selectedWeek` / `selectedYear` props (fall back to current week info if not passed). Use them in the heading and in the week-filter logic instead of `getCurrentWeekInfo()` + `getWeekDates(currentWeek, currentYear)`.
- `src/components/Dashboard/DashboardCockpit.tsx`
  - Pass `selectedWeek` and `selectedYear` down to `MineOpgaver` (added in step 3 below) so the same week shown in the WeeklyAssignments header drives the personal task list.
- `src/components/Dashboard/CompactKpiStack.tsx`
  - Already accepts `selectedDate`; add a small heading suffix `Uge {isoWeek(selectedDate)}` in the card header so the metric stack visibly reflects the selected week (KPIs themselves already use `selectedDate`).
- `src/pages/PlannerPage.tsx`
  - Header already shows `Uge {selectedWeek}` and the week-range subtitle — no logic change needed, just verify the subtitle uses `selectedWeek`/`selectedYear` (it does).
- Any other component rendering "Uge X" derived from `new Date()` (search `getCurrentWeekInfo`, `getISOWeek(new Date())`, `Uge ${`) gets the same treatment if it lives inside a dashboard/planner widget.

### 2. Replace the "P" tile with the Polygon icon logo

The uploaded image is the Polygon icon mark (triangular swirl). Use it for the collapsed sidebar tile instead of the blue "P" square.

- Save the uploaded asset to `src/assets/polygon-icon.png` (copied from `user-uploads://Polygon_logo_png_-_Kopi.png`).
- `src/components/Layout/AppSidebar.tsx`
  - In the collapsed branch of `SidebarHeader`, replace the `<div class="bg-primary"><span>P</span></div>` block with an `<img>` of the imported icon, sized `h-8 w-8 object-contain`, no background tile, transparent.
  - Keep the expanded branch (full Polygon wordmark) unchanged.

### 3. Reorder dashboard: KPI stack above "Mine Opgaver"

The user's bottom metrics row (Ugeplan / Fridage / Vagt / Medarbejdere / Biler) is the right-rail `CompactKpiStack` plus auxiliary widgets. They want it stacked **above** the personal "Mine Opgaver" widget on the right side.

- `src/components/Dashboard/DashboardCockpit.tsx`
  - Right rail (`<aside>`) order becomes:
    1. `CompactKpiStack` (when `showMetrics`)
    2. `MineOpgaver` (new — moved here, with `selectedWeek`/`selectedYear` props)
    3. `VacationNotificationsPanel` (when admin)
    4. `DutySummaryWidget` (when duty enabled)
    5. `UpcomingVacationsWidget`
  - Remove any duplicate `MineOpgaver` rendering elsewhere in the cockpit.
  - Keep the left column (`WeeklyAssignments` + `QuickAccessGrid`) unchanged.

### Documentation

- Append a concise entry in `CHANGELOG.md` describing the three changes.
- Tick any matching item in `docs/implementation-plan/tasks.md` if present.

### Files touched

- `src/assets/polygon-icon.png` (new, copied from upload)
- `src/components/Layout/AppSidebar.tsx`
- `src/components/Dashboard/DashboardCockpit.tsx`
- `src/components/Dashboard/MineOpgaver.tsx`
- `src/components/Dashboard/CompactKpiStack.tsx`
- `CHANGELOG.md` (and possibly `docs/implementation-plan/tasks.md`)

No DB, RLS, or routing changes. Pure UI / props plumbing.
