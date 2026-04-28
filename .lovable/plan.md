## Plan: Conflict indicator, smaller navbar, mobile polish & glass-style chips

### 1. Conflict detection (employee + car double-booking) in week view
**New file:** `src/utils/assignmentConflicts.ts` — pure helpers:

```ts
export type ConflictKind = 'employee' | 'car';
export interface AssignmentConflict {
  kind: ConflictKind;
  resourceId: string;       // employee or car id
  resourceName: string;
  withAssignmentId: string; // the other clashing assignment
  withTitle: string;
  overlap: { from: string; to: string };
}

// timesOverlap("08:00","12:00","11:00","13:00") => true (touching is NOT overlap)
export function timesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean;

// Returns conflicts grouped by assignment id, computed for the entire input set
export function computeWeekConflicts(
  weekAssignments: Assignment[],
  employees: { id: string; name: string }[],
  cars: { id: string; name: string }[]
): Map<string, AssignmentConflict[]>;
```

Algorithm: for each (date, resourceId) bucket, sort by `fromTime`, sweep neighbours, push a conflict pair on overlap. Resource extraction reuses the same logic already in `AssignmentDetails.getCarIds` and `assignedEmployees`/legacy `employees` ID array. Sub‑1ms even for 200 assignments.

**New hook:** `src/hooks/useWeekConflicts.ts` — wraps `useUnifiedData()` + memoizes by week assignments. Returns `(assignmentId) => AssignmentConflict[]`.

**UI integration:**
- `src/components/Planner/AssignmentCard.tsx`: add a `ConflictBadge` next to the title — `Badge` with `AlertTriangle`, red glass style, tooltip listing each conflict (`Mads Fournaise: 08:00–12:00 ↔ 12-013832 (10:00–14:00)`). Card gets `border-l-destructive` left bar when in conflict (overrides published/unpublished color).
- `src/components/Planner/CompactAssignmentRow.tsx`: small ⚠ icon in the "Time" cell with same tooltip.
- `src/components/Dashboard/WeeklyAssignments.tsx`: reuse the same hook so conflict pills show on the dashboard week list too.

No DB changes, purely client-side over already-fetched week data.

### 2. Smaller, denser top navbar
File: `src/components/Layout/AppTopBar.tsx`
- `header` height `h-14` → `h-11` (44px). Update `AppSidebar` header from `h-14` to `h-11` to match.
- Title: `text-sm` → `text-[13px]`, drop the vertical separator on small screens (already hidden, keep).
- Reduce icon button sizes inside `NotificationsDropdown`, `VacationOverviewDropdown`, `ChangeLogDropdown`, `UserMenu` from `h-9 w-9` to `h-8 w-8` and icons `h-4 w-4` → `h-[15px] w-[15px]`. UserMenu avatar `h-8 w-8` → `h-7 w-7`.
- `brand-stripe` height `h-[2px]` → `h-px`.
- Adjust `lg:top-20` sticky offsets in `DashboardCockpit` aside to `lg:top-14`.

### 3. Mobile polish (global)
**Sidebar auto-close on navigation:**
- `src/components/Layout/AppSidebar.tsx`: in `renderItem`, the `<NavLink>` already exists. Add `onClick={() => { if (isMobile) setOpenMobile(false); }}` using `useSidebar()`'s `isMobile` + `setOpenMobile`. Apply to both regular and footer (admin) items.

**Top navbar mobile:**
- Hide route title `<h1>` on `< sm` (already 1 line of text after burger). Replace with the brand "P" logo so user sees branding. The `SidebarTrigger` (burger) stays — first element, larger tap target `h-9 w-9` on mobile.
- Make the action cluster compact: gap `gap-1` on mobile, `gap-1.5` on `sm`.

**Page paddings:** Several pages use `p-6` / `gap-6`. Audit and switch to `p-3 sm:p-4 lg:p-6` and `gap-3 sm:gap-4` in:
- `src/pages/DashboardPage.tsx`
- `src/pages/PlannerPage.tsx` (top toolbar & search bar)
- `src/pages/CarsPage.tsx`, `EmployeesPage.tsx`, `VacationPage.tsx`, `DutyPage.tsx`, `WarehousePage.tsx`
- `src/components/shared/ListPageShell.tsx` to set the responsive padding centrally.

**Tables → cards on mobile:**
- Lists already have `MobileEmployeeCard` / `MobileCarCard` / `MobileWarehouseCard` — verify each list page renders them on `< md` and hides the table. Where missing, wrap the desktop `<Table>` in `hidden md:block` and the mobile card list in `md:hidden`.

**Planner toolbar on mobile:**
- The view-toggle is already `hidden sm:flex`. Move the "Vis på Skærm" + "Ny opgave" buttons into a single row that wraps cleanly; reduce label visibility on `< sm` (icon-only).

**Touch targets:** every button used in cards (`h-6 w-6`) is bumped to `h-8 w-8` on `< sm` via responsive class.

**Dialogs:** verify `DialogContent` uses `max-h-[90dvh]` and `w-[calc(100%-1rem)] sm:w-auto`. Patch `src/components/ui/dialog.tsx` if missing.

### 4. Glass-style color polish
The current chips use flat tint backgrounds (`bg-amber-50`, `bg-emerald-50`). Upgrade to translucent layered glass.

**New utilities in `src/index.css`** (under `@layer utilities`):

```css
.chip-glass {
  background: linear-gradient(180deg, hsl(var(--card)/.7) 0%, hsl(var(--card)/.55) 100%);
  border: 1px solid hsl(var(--border)/.7);
  backdrop-filter: saturate(140%) blur(8px);
  -webkit-backdrop-filter: saturate(140%) blur(8px);
  box-shadow: inset 0 1px 0 0 hsl(0 0% 100%/.5), 0 1px 2px hsl(222 20% 14%/.04);
}
.chip-glass-primary  { /* same base + primary tint overlay */ }
.chip-glass-amber    { ... }
.chip-glass-emerald  { ... }
.chip-glass-indigo   { ... }
.chip-glass-destructive { ... }
```

Each tinted variant uses the same translucent card base + a 12% color overlay + 1px colored inner ring (`box-shadow: inset 0 0 0 1px hsl(var(--primary)/.25)`), giving a frosted-glass look that adapts to light/dark.

**Apply in:**
- `src/components/Planner/AssignmentDetails.tsx` — replace the icon container + badge classes for time/cars/employees with `chip-glass-primary`, `chip-glass-amber`, `chip-glass-emerald`.
- `src/components/Dashboard/MineOpgaver.tsx` — same chip classes for time/cars/employees/sagsansvarlig.
- `AssignmentStatusBadge.tsx` — published/unpublished use `chip-glass-emerald` / `chip-glass-amber`.
- The new `ConflictBadge` uses `chip-glass-destructive`.

Card hover: add `.brand-card-hover` utility (`hover:shadow-md hover:-translate-y-px transition` with `bg-card/80 backdrop-blur-sm`) on `AssignmentCard` and `MineOpgaver` rows.

### Files touched
- New: `src/utils/assignmentConflicts.ts`, `src/hooks/useWeekConflicts.ts`, `src/components/Planner/ConflictBadge.tsx`
- `src/index.css` (chip-glass utilities + brand-card-hover)
- `src/components/Layout/AppTopBar.tsx`, `AppSidebar.tsx`, `AppShell.tsx` (heights, sticky offsets, mobile auto-close)
- `src/components/Layout/NavComponents/{NotificationsDropdown,ChangeLogDropdown,UserMenu,VacationOverviewDropdown}.tsx` (button sizes)
- `src/components/Planner/AssignmentCard.tsx`, `CompactAssignmentRow.tsx`, `AssignmentDetails.tsx`, `AssignmentStatusBadge.tsx`
- `src/components/Dashboard/MineOpgaver.tsx`, `WeeklyAssignments.tsx`, `DashboardCockpit.tsx` (sticky offset)
- `src/components/shared/ListPageShell.tsx`, `src/components/ui/dialog.tsx` (mobile width/height)
- All list pages for responsive padding + ensure mobile card variants render
- `CHANGELOG.md`, `docs/implementation-plan/tasks.md`

### Out of scope
- No DB / RLS / migration changes (all logic is client-side over existing data).
- No new translation keys beyond `planner.conflicts.*` reused from existing `AssignmentForm` keys (already present per the grep above).
