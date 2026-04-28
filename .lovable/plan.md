# Dashboard & Weekly Planner Enhancements

## 1. Vacation Notifications Panel (Dashboard)
New component `src/components/Dashboard/VacationNotificationsPanel.tsx`, placed in the right column of `DashboardCockpit` (admins/skadeleder only).
- **Pending tab**: lists vacations with `status='pending'` for the selected department, with inline **Godkend** / **Afvis** buttons. Reuses `useVacationApprovalActions`.
- **History tab**: shows last 10 approved/rejected entries, color-coded (green/red), with approver name + timestamp from `updated_at`.
- Empty states + loading skeleton consistent with `CompactKpiStack`.

## 2. Weekly Planner — Create / Edit / Delete from Dashboard
Enhance `WeeklyAssignments.tsx`:
- Add **"Opret opgave"** primary button in header (admins/skadeleder only). Opens `AssignmentDialogManager` prefilled with `assignment_date = monday of selectedWeek` (or today if current week).
- Each assignment row gets a context menu (`...`) with **Rediger** and **Slet** actions (admins/skadeleder only). Uses existing `useAssignmentActions` for create/update/delete.
- Delete confirms via `AlertDialog`, with optimistic UI + toast (matches existing undo pattern).
- All operations dispatch `planner_change_log` via existing `plannerChangeLogger`.

## 3. Day-of-week Filter (Weekly Assignments)
Add a segmented control above the list: **Alle | Man | Tir | Ons | Tor | Fre | Lør | Søn** with live counts. Persisted as local component state. Filter applied after week filter.

## 4. Sync Cars/Employees Modals with Dashboard Week
Currently `effectiveDate` defaults to today when current week is selected. Update `DashboardCockpit` to always pass Monday (or today if in current week) — already done. Also pass `selectedWeek` / `selectedYear` to:
- `EmployeeAvailabilityDialog`, `CarAvailabilityModal`, `AbsentEmployeesModal`
- Add a small **week badge** in each modal header: "Uge {n}, {year}" so users see context.
- Filter availability calculations using all 7 days of the selected week (not just `selectedDate`) so overlap detection matches the dashboard's week.

## 5. More Color (Brand Vibrance Pass)
Reintroduce visible color across the UI without breaking the minimal feel:
- **Buttons**: `default` variant uses solid `bg-primary` with subtle gradient; add new `brand` variant (cyan-to-blue gradient) for primary CTAs (Opret opgave, Godkend ferie, etc.).
- **Cards**: `brand-card-header` utility upgraded from flat tint to subtle `linear-gradient(135deg, primary/8, primary/3)` with a 2px left accent border on key cards (KPI, Vacation panel, Weekly Assignments).
- **KPI rows**: Larger colored icon chips (12x12 instead of 8x8) with stronger backgrounds (`/15` instead of `/10`).
- **Sidebar**: Active nav item uses solid `bg-primary text-primary-foreground` instead of tint.
- **Badges**: Status badges (pending/approved/rejected) get filled color variants instead of outline.
- **Tabs**: Active tab gets primary underline + bold weight.

## 6. Translation Fixes (DA + EN)
| Key | DA | EN |
|---|---|---|
| `dashboard.metrics.title` | **Dagens overblik** | Daily overview |
| `dashboard.upcomingVacations` | Kommende fridage | Upcoming vacations |
| `dashboard.noUpcomingVacations` | Ingen kommende fridage | No upcoming vacations |
| `dashboard.vacationNotifications` | Ferieanmodninger | Vacation requests |
| `dashboard.pendingRequests` | Afventer godkendelse | Pending approval |
| `dashboard.approvalHistory` | Historik | History |
| `dashboard.dayFilter.all` | Alle | All |
| `employees.onLeaveSegment` | **Fraværende** | Absent |
| `employees.activeSegment` | **Tilgængelige** | Available |
| `common.searchPlaceholder` | **Søgefelt** | Search |
| `planner.createAssignment` | Opret opgave | Create assignment |
| `planner.editAssignment` | Rediger opgave | Edit assignment |
| `planner.deleteAssignment` | Slet opgave | Delete assignment |

Update `EmployeesPage` to use `employees.activeSegment` for the "Aktiv" segment label.

## Files Touched
- **New**: `src/components/Dashboard/VacationNotificationsPanel.tsx`, `src/components/Dashboard/DayOfWeekFilter.tsx`
- **Edited**: `DashboardCockpit.tsx`, `WeeklyAssignments.tsx`, `CompactKpiStack.tsx`, `EmployeeAvailabilityDialog/*`, `CarAvailabilityModal.tsx`, `AbsentEmployeesModal.tsx`
- **UI**: `src/index.css`, `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/tabs.tsx`, `src/components/Layout/AppSidebar.tsx`
- **Translations**: `src/translations/{da,en}/{dashboard,employees,common,planner}.ts`
- **Pages**: `EmployeesPage.tsx` (segment label key)
- **Docs**: `CHANGELOG.md`

Approve to implement.