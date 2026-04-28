## Plan: Dashboard color polish, role gating & navbar improvements

### 1. Add color to Mine Opgaver cards (time, employees, car)
File: `src/components/Dashboard/MineOpgaver.tsx`

Today the small info rows (time, employees, cars) all use `text-muted-foreground` so the card looks gray. Apply the brand color system already defined in `index.css`:

- Time row: `text-primary` icon + `text-foreground` text inside a `bg-primary/8 border border-primary/15 rounded-md px-2 py-0.5` chip.
- Employees row: emerald accent — icon `text-emerald-600`, chip `bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20`.
- Cars row: amber accent — icon `text-amber-600`, chip `bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20`.
- Sagsansvarlig already has `text-indigo-600` — keep, but add a soft pill background for consistency.
- Card hover: change to `hover:border-primary/30 hover:shadow-sm` plus `border-l-2 border-l-primary/40` accent stripe for assignments where current user is `responsibleUser`.

The same color treatment is applied in `src/components/Planner/AssignmentCard.tsx` (and `CompactAssignmentRow.tsx`) so weekly cards no longer look gray.

### 2. Color the Planner view-toggle (Standard / Gitter / Kompakt)
File: `src/pages/PlannerPage.tsx` (lines ~558–595)

Replace the flat `bg-muted` ToggleGroup styling with a brand-on-active style:
- Container: `bg-card border border-border` (kept).
- Active item: `data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm` (replaces `bg-background`).
- Icons inherit `currentColor` so they turn white when active.
- "Udvid alle" button: switch to `variant="brand"` outline equivalent (`border-primary/30 text-primary hover:bg-primary/8`).

### 3. Fix Mine Opgaver — show only assignments where the user is responsible OR assigned
File: `src/components/Dashboard/MineOpgaver.tsx` + `src/utils/employeeAssignmentUtils.ts` (helper if missing)

Current bug: legacy `employees?.includes(user.name)` matches by display name, which can collide (e.g. Kasper Schmidt Johansen showing). Replace the check with strict ID-based matching:

```ts
const isAssignedViaNew = assignment.assignedEmployees?.some(e => e.id === user.id) ?? false;
const isAssignedViaLegacy = Array.isArray(assignment.employees)
  && assignment.employees.includes(user.id); // IDs only, not names
const isResponsible =
  (assignment.responsibleUser?.id ?? assignment.responsibleUserId) === user.id;
const isUserInvolved = isResponsible || isAssignedViaNew || isAssignedViaLegacy;
```

Drop the name-based fallback entirely. Add a defensive guard that requires `user?.id` before any inclusion.

### 4. Vacation notifications widget — admin only
File: `src/components/Dashboard/DashboardCockpit.tsx`

Currently rendered for every user that sees metrics. Wrap with `useAuth().isEffectiveAdmin`:

```tsx
{showMetrics && isEffectiveAdmin && <VacationNotificationsPanel />}
```

(Imports `useAuth`. No change to `VacationNotificationsPanel.tsx` itself.)

### 5. Move "Admin" to the bottom of the sidebar
File: `src/components/Layout/AppSidebar.tsx`

The `allItems` array already lists Admin last, but it currently appears among the regular items. Move the Admin entry into the `SidebarFooter` so it sits visually pinned at the bottom (above the "Polygon Ugeplan" caption). Render it with the same `SidebarMenuButton` styling as the main list. Filtering rules (`adminOnly` + `isEffectiveAdmin`) are preserved.

### 6. Add a Vacation overview popover in the top navbar (Skadeleder/Admin/Super Admin only)
Files:
- New: `src/components/Layout/NavComponents/VacationOverviewDropdown.tsx`
- `src/components/Layout/AppTopBar.tsx` — add the trigger between `NotificationsDropdown` and `ChangeLogDropdown`.

Behavior:
- Icon: `CalendarDays` from lucide.
- Visible only when `isEffectiveAdmin` OR role is `skadeleder` (use `usePermissions().canManageVacations` if it exists, otherwise check `user.role` directly).
- Shows a compact list of pending vacation requests (re-uses `useVacations` + `useVacationApprovalActions` already used by `VacationNotificationsPanel`) with inline approve/reject and a footer "Se alle fridage" link to `/vacation`.
- Badge with `pendingCount` when > 0 (red dot if 0 pending hidden).

This replaces the toast notification logic currently inside `AppTopBar` (the toast fired once per session) — remove that `useEffect` block since the data is now always visible in the navbar.

### 7. Sidebar collapsed by default
File: `src/components/Layout/AppShell.tsx`

Change `<SidebarProvider defaultOpen={true}>` → `<SidebarProvider defaultOpen={false}>`. The shadcn sidebar persists user preference via cookie (`sidebar:state`), so the change only affects first visits / users without a saved preference.

### 8. Unify the per-day "Publicer Dagens Opgaver" button with the top "Publicer alle" style
Files:
- `src/components/Planner/DaySection.tsx` (line ~106)
- `src/components/Planner/CompactDaySection.tsx` (line ~86)

Currently the day button uses a hard-coded green (`bg-green-600 hover:bg-green-700`). Replace with the same brand variant used by the top toolbar's create/publish actions and keep the paperplane (`Send`) icon:

```tsx
<Button onClick={handlePublishDay} variant="brand" size="sm">
  <Send className="mr-2 h-4 w-4" />
  {t("planner.publishDayTasks")}
</Button>
```

Same change in compact mode (smaller icon/spacing kept).

### 9. Documentation & changelog
- Update `CHANGELOG.md` with a dated entry summarizing the eight changes above.
- Mark the relevant tasks in `docs/implementation-plan/tasks.md` as `[x]`.

### Files touched
- `src/components/Dashboard/MineOpgaver.tsx`
- `src/components/Dashboard/DashboardCockpit.tsx`
- `src/components/Planner/AssignmentCard.tsx`
- `src/components/Planner/CompactAssignmentRow.tsx`
- `src/components/Planner/DaySection.tsx`
- `src/components/Planner/CompactDaySection.tsx`
- `src/pages/PlannerPage.tsx`
- `src/components/Layout/AppShell.tsx`
- `src/components/Layout/AppSidebar.tsx`
- `src/components/Layout/AppTopBar.tsx`
- `src/components/Layout/NavComponents/VacationOverviewDropdown.tsx` (new)
- `CHANGELOG.md`, `docs/implementation-plan/tasks.md`

### Out of scope
No DB / RLS changes. No translation key additions beyond reuse of existing `dashboard.*` and `vacation.*` keys.
