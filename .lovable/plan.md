# Cleanup: remove unused files and dead code

## Goal
Remove confirmed dead code without affecting any live functionality, the running site, or `/docs` (the SSOT "knowledge"). All deletions are based on `knip` analysis cross-checked against actual imports and edge-function invocations.

## Scope guard — what is explicitly NOT touched
- `/docs/**` — SSOT, kept verbatim.
- `supabase/migrations/**` — historical record, kept.
- `src/integrations/supabase/types.ts` — auto-generated.
- `mem://` memory files.
- All shadcn UI primitives that *are* imported anywhere (only the verified-unused ones go).
- Edge functions that are either invoked from frontend or scheduled in `supabase/config.toml` for runtime use.
- `CHANGELOG.md`, `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `ONBOARDING.md`.

## Phase 1 — Duplicate / superseded source files (safe deletes)

Verified zero imports anywhere in `src/`:

**Old Notifications stack** (replaced by `src/components/Layout/NavComponents/Notifications*`):
- `src/components/Notifications/NotificationItem.tsx`
- `src/components/Notifications/NotificationsDropdown.tsx`
- `src/components/Notifications/NotificationsList.tsx`

**Duplicate Employees lists** (active list is `EmployeesTable.tsx`):
- `src/components/Employees/EmployeeList.tsx`
- `src/components/Employees/EmployeesList.tsx`
- `src/components/Employees/EmployeeDialogManager.tsx`
- `src/components/Employees/EmployeeMarkAvailableDialog.tsx`
- `src/components/Employees/EmployeeMarkLeaveDialog.tsx`

**Unused dashboard widgets** (no Dashboard route imports them):
- `src/components/Dashboard/AssignmentDistributionChart.tsx`
- `src/components/Dashboard/DashboardMetrics.tsx`
- `src/components/Dashboard/InteractiveMetricCard.tsx`
- `src/components/Dashboard/MetricCard.tsx`
- `src/components/Dashboard/SystemMetricsOverview.tsx`
- `src/components/Dashboard/VehicleStatusWidget.tsx`

**Other stale components / debug helpers:**
- `src/components/Admin/PasswordResetDebugger.tsx`
- `src/components/AutoPublish/AutoPublishHandler.tsx` (replaced by `send-duty-reminders` edge function + DB cron)
- `src/components/ErrorBoundary.tsx` (a newer one lives in `src/components/ErrorBoundary/`)
- `src/components/Duty/DutyAssignmentForm.tsx`
- `src/components/Duty/DutyReassignDialog.tsx`
- `src/components/Layout/NavComponents/DepartmentSelector.tsx` (selector now lives in UserMenu — confirmed by memory rule)
- `src/components/Layout/NavComponents/DesktopNavigation.tsx`
- `src/components/Layout/NavComponents/MobileNavigation.tsx`
- `src/components/Layout/NavComponents/Logo.tsx`
- `src/components/Layout/NavigationItems.tsx`
- `src/components/Planner/AssignmentList.tsx`
- `src/components/Planner/CarSelector.tsx`
- `src/components/Vacation/EmployeeVacationStatus.tsx`
- `src/components/Vacation/EnhancedVacationForm.tsx`
- `src/components/Vacation/VacationButtons.tsx`
- `src/components/Vacation/VacationCard.tsx`
- `src/components/ErrorBoundary/DashboardErrorBoundary.tsx`
- `src/components/shared/CardSkeleton.tsx`
- `src/components/shared/MetricsSkeleton.tsx`
- `src/components/shared/TableSkeleton.tsx`
- `src/App.css` (Vite default, not imported)

## Phase 2 — Unused hooks / services / utils

- `src/hooks/assignment/useAssignmentActions.ts`
- `src/hooks/assignment/useAssignmentDialogState.ts`
- `src/hooks/assignment/useAssignmentFormState.ts`
- `src/hooks/assignment/useAssignmentHelpers.ts`
- `src/hooks/assignment/useCarDataHandler.ts`
- `src/hooks/useAssignmentFilters.ts`
- `src/hooks/useAutoPublishAssignments.ts`
- `src/hooks/useDashboard.ts`
- `src/hooks/useDiagnostics.ts`
- `src/hooks/usePlannerPage.ts`
- `src/hooks/vacation/useVacationRequestActions.ts`
- `src/services/assignmentFilterService.ts`
- `src/services/data/assignmentService.ts`
- `src/services/secureProfileService.ts`
- `src/services/securityManager.ts`
- `src/services/supabaseIssuesAuditor.ts`
- `src/types/navigation.ts`
- `src/types/notification.d.ts`
- `src/utils/databaseCleanup.ts`
- `src/utils/securityValidation.ts`

## Phase 3 — Unused shadcn UI primitives

Only files knip marks unused AND that have zero imports outside themselves:
`accordion.tsx`, `aspect-ratio.tsx`, `breadcrumb.tsx`, `carousel.tsx`, `chart.tsx`, `command.tsx`, `form.tsx`, `hover-card.tsx`, `input-otp.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `progress.tsx`, `resizable.tsx`, `secure-input.tsx`, `slider.tsx`, `sonner.tsx`

## Phase 4 — Duplicate / superseded edge functions

Verified replacements exist and the old ones are not invoked anywhere:
- `supabase/functions/admin-delete-user/` — superseded by `admin-user-delete` (used in 3 places).
- `supabase/functions/swap-duty/` — superseded by `swap-duties` (used in `useDutyActions`).

Both will be removed via the edge-function delete tool so they are also undeployed.

**Kept** (still used or scheduled): `admin-create-user`, `admin-list-users`, `admin-reset-password`, `admin-user-delete`, `admin-user-role`, `admin-user-status`, `cleanup-change-logs`, `cleanup-expired-users`, `dawa-proxy`, `send-duty-reminders`, `swap-duties`.

## Phase 5 — Unused dependencies (package.json)

Remove only ones that are truly unimported after Phases 1–3:
`@radix-ui/react-accordion`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-hover-card`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-progress`, `@radix-ui/react-slider`, `cmdk`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-resizable-panels`, `recharts`, `@tailwindcss/typography`.

**Kept despite knip flagging:** `@hookform/resolvers`, `zod` (form validation pattern may still be used after Phase 3 verification), `@testing-library/*`, `vitest`, `jsdom` (test infra — even if no tests exist now, removing them silently breaks a future `bun test`).

## Phase 6 — Dead exports inside surviving files

Drop only the non-default unused named exports flagged by knip in:
- `src/utils/dateUtils.ts`, `src/utils/dates/weekCore.ts`, `src/utils/dates/weekFormatting.ts`, `src/utils/dates/weekNavigation.ts`
- `src/utils/dbHelpers.ts`, `src/utils/inputSanitization.ts`, `src/utils/notifications.ts`, `src/utils/phoneValidation.ts`, `src/utils/securityLogger.ts`, `src/utils/uuidValidation.ts`, `src/utils/employeeAssignmentUtils.ts`, `src/utils/assignmentConflicts.ts`
- `src/lib/utils.ts` (`formatDanishMonth`)
- `src/integrations/supabase/client.ts` (`ensureValidSession`, `withRetry`)

This phase is **opt-in** — risky because knip can miss dynamic uses. Default: skip Phase 6, only do it if you confirm.

## Verification after each phase
1. `bun run build` (handled automatically by harness).
2. Re-run `knip` to confirm fewer findings and no new errors.
3. Visual smoke check on preview.

## Rollout order
Phases 1 → 2 → 4 → 3 → 5. Phase 6 only on explicit go-ahead.

## Open question
OK to proceed with all of Phases 1–5 in one pass, or do you want me to stop after Phase 1 for a checkpoint?
