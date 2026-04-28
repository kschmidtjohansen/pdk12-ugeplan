## Plan: Logo, single My Tasks widget, vacation dropdown visibility, premium chip redesign

### 1. Polygon logo in topbar (replaces "P" tile)
- Replace the blue `P` square in `AppSidebar` SidebarHeader with the existing official Polygon logo from `src/components/Layout/NavComponents/Logo.tsx` (uses `https://www.polygongroup.com/UI/build/svg/polygon-logo.svg`).
- When sidebar is collapsed: show only a compact icon-only mark (keep the 28×28 blue rounded tile with "P" — this is the brand mark in icon-rail mode). When expanded: show the full Polygon SVG logo (h-6 wide ~110px).
- This guarantees the wide horizontal Polygon wordmark is visible right next to the sidebar trigger when the sidebar is open, matching the user's screenshot reference.

### 2. Remove duplicate "Mine Opgaver" — keep one widget at top
The dashboard currently renders:
- Top: `WeeklyAssignments` (titled "Mine Opgaver" via `dashboard.myAssignments`) showing the entire week.
- Bottom: `<MineOpgaver />` showing user-personal tasks.

User wants the **top** card to be the personal one, and the bottom one removed.

In `src/components/Dashboard/DashboardCockpit.tsx`:
- Remove the `<MineOpgaver />` render and its import.
- Add a memo `personalWeekAssignments` that filters `weekAssignments` to those where the current user is responsible (`responsibleUser.id` / `responsibleUserId === user.id`) OR an assigned employee (new shape `assignedEmployees[].id` or legacy `employees[]` containing `user.id`). Strict ID-only match — never name match.
- Pass `personalWeekAssignments` to `WeeklyAssignments` only when `showMyTasks` is true; otherwise pass full `weekAssignments` (admins/skadeleders still see everything).

`MineOpgaver.tsx` itself stays in the codebase (still used in `ServicemedarbejderDashboard.tsx`) — only the duplicate render in `DashboardCockpit` is removed.

### 3. Ferieoversigt visible in topbar
The dropdown is currently rendered in `AppTopBar` but only when `isEffectiveAdmin || isSkadeleder`. Two issues to fix:

**a) Defensive rendering**: `VacationOverviewDropdown` calls `vacations.filter(...)` — if `vacations` is `undefined` (initial load before department resolved) the component throws and the trigger never paints. Wrap with `(vacations ?? [])`.

**b) Discoverability**: Even when rendered the trigger is just a 32×32 icon with no badge when there are 0 pending — easy to miss. Make it more prominent:
- Always show a subtle filled chip background (`chip-glass-primary` or `bg-primary/10`) for the trigger so it's visually anchored next to the user menu.
- Show pending count badge at all times (small `0` is fine, or hide only when undefined). Tooltip: "Ferieoversigt".
- Add `aria-haspopup="menu"`.

This guarantees the icon is rendered and clearly visible.

### 4. Premium chip redesign (truly premium, not "cheap")
Current frosted-glass chips look noisy in grid view because every detail (time, car, employee, responsible) becomes a colored pill stacked vertically. Cleaner design:

**A. New token: chip styling becomes monochrome by default with a single accent dot/icon.**
- One unified `.chip` utility: `bg-card border border-border/60 rounded-md px-2 py-0.5 text-xs font-medium text-foreground inline-flex items-center gap-1.5`. Subtle inset highlight, no per-row color floods.
- Icons keep their semantic color (`text-primary` for time, `text-amber-600` for car, `text-emerald-600` for users, `text-indigo-600` for responsible) — but the chip body stays neutral. This reads as a premium SaaS app (Linear / Notion / Height) instead of rainbow stickers.
- Remove `chip-glass-primary/amber/emerald/indigo` from `AssignmentDetails`, `MineOpgaver`, and `AssignmentCard` — replace with the single neutral `.chip`. Only `chip-glass-destructive` (used for `ConflictBadge` and shared-car warning) keeps a colored body.

**B. Restructure assignment card grid view content**
Current grid view (`AssignmentDetails`) shows: time chip / car chips / employee chips in a 2-column grid + the responsible user separately in `AssignmentCard`. This piles up.

New layout for `AssignmentDetails` (used in `AssignmentCard`):
```
[ 08:00–14:00 ]   ·   Bil 12   Bil 14            (single row, wraps)
[ 👥 3 medarbejdere ▾ ]   [ 🧑‍💼 Mads (sagsansvarlig) ]
```
- Row 1: time chip + small bullet separator + car names as plain neutral chips (icon‑only Car icon prefix on the row, not on each chip).
- Row 2: employees collapsed into a single chip "👥 3 medarbejdere" with a hover popover listing names. If ≤ 2 employees, show their first names inline. Responsible user gets its own chip with `UserCheck` icon.
- This fits in one tidy block per assignment, even on grid view.

**C. AssignmentCard polish**
- Replace harsh left border (`border-l-[3px] border-l-emerald-500`) with a softer 2px accent + status dot in the header row (green dot = published, amber dot = draft). Conflict still uses `border-l-destructive` + ring.
- Card background: subtle gradient `bg-gradient-to-br from-card to-card/60` with `border-border/60` and `shadow-xs`. Hover lifts via existing `.brand-card-hover`.
- Title row spacing tightened (gap-1.5).

**D. CompactAssignmentRow grid/table**
- Remove per-cell colored icons; use uniform `text-muted-foreground` icons sized `h-3.5 w-3.5`. Status column uses the new dot pattern. Conflict ⚠ stays red.

### Files touched
- `src/components/Layout/AppSidebar.tsx` (logo)
- `src/components/Dashboard/DashboardCockpit.tsx` (remove MineOpgaver, personal filter)
- `src/components/Layout/NavComponents/VacationOverviewDropdown.tsx` (defensive `vacations`, prominent trigger)
- `src/index.css` (new neutral `.chip` utility, retire colored variants except destructive)
- `src/components/Planner/AssignmentDetails.tsx` (new compact layout, popover for employees)
- `src/components/Planner/AssignmentCard.tsx` (status dot header, softer accent, gradient)
- `src/components/Planner/CompactAssignmentRow.tsx` (neutral chips, status dot)
- `src/components/Dashboard/MineOpgaver.tsx` (use new neutral chips)
- `CHANGELOG.md`

### Out of scope
- No DB changes. No translation changes (all keys already exist).
- `MineOpgaver.tsx` is not deleted — still used by `ServicemedarbejderDashboard`.
