

## Global Project Audit — Findings & Remediation Plan

### Audit Summary

TypeScript compilation: **CLEAN** (zero errors).
Runtime errors: **NONE** detected.
Dev server: **STABLE** (no error/warning output).
Translation parity: **OK** — DA and EN files are in sync for all recent features.
Recent features (Series Dialog, Context Menu, Undo Delete, History Tab, Publish in Context Menu, Midnight Auto-Publish): **Structurally correct**.

---

### Issue 1: 28 Unguarded `console.log/warn/error` Statements (HIGH)

The project knowledge states *"Fjern altid følsom logging i produktion"* and the memory note confirms all console output must be wrapped in `import.meta.env.DEV`. There are **28 unguarded** statements across 14 files:

| File | Count | Examples |
|------|-------|---------|
| `src/components/Dashboard/EmployeeAvailabilityDialog/index.tsx` | 1 | Debug dialog info |
| `src/components/Planner/AssignmentDetails.tsx` | 1 | Employee processing |
| `src/components/Planner/AssignmentFormFields.tsx` | 1 | Car state |
| `src/components/Planner/EmployeeSelector.tsx` | 2 | Auto-remove + date |
| `src/components/Planner/ResponsibleUserSelector.tsx` | 2 | Debug + selection |
| `src/components/Planner/DaySection.tsx` | 1 | Date formatting |
| `src/components/Vacation/VacationFormDialog.tsx` | 1 | Dialog props |
| `src/context/AuthContext.tsx` | 2 | DB timing + user loaded |
| `src/hooks/assignment/useAssignmentFormState.ts` | 1 | Init date |
| `src/hooks/data/useUnifiedData.ts` | 1 | `.catch(console.error)` |
| `src/hooks/employee/useEmployeeCreation.ts` | 2 | Access warnings |
| `src/hooks/use-toast.ts` | 1 | Toast creation |
| `src/hooks/useEmployees.ts` | 1 | Employee count |
| `src/hooks/useNotifications.ts` | 2 | Filter + admin check |
| `src/pages/LoginPage.tsx` | 1 | Auth state |
| `src/pages/ScreenDisplayPage.tsx` | 3 | URL parsing + data |
| `src/services/optimizedAssignmentService.ts` | 2 | Insert/Update payload |
| `src/utils/dates/weekFormatting.ts` | 1 | Date range |

**Fix:** Wrap each in `if (import.meta.env.DEV) { ... }` or remove entirely.

---

### Issue 2: Stale Comment in `useAutoPublishAssignments.ts` (LOW)

Line 67 still says `// Initial check in case the app starts up after 16:00` — should say `after midnight (00:00)`.

**Fix:** Update the comment.

---

### Issue 3: `useAutoPublishAssignments` Interval Churn (MEDIUM)

The `useEffect` at line 66 depends on `[assignments, loading]`. Every time `assignments` changes (any CRUD), the interval is torn down and recreated. With the 60s interval this is mostly harmless but causes unnecessary cleanup cycles and re-invokes `checkAndPublish` immediately on every assignment change.

**Fix:** Move `checkAndPublish` to a `useCallback` with a ref-based approach, or use a ref for assignments so the interval doesn't restart.

---

### Issue 4: `docs/implementation-plan/tasks.md` Not Updated (MEDIUM — Knowledge Requirement)

The project knowledge mandates updating `tasks.md` after each completed feature. The following recent features are missing:
- Series-Aware Edit/Delete with `SeriesActionDialog`
- Right-click Context Menu on booking cards
- Undo-able Delete with 5s grace period
- Audit Trail / History Tab
- Publish in context menu
- Midnight auto-publish

**Fix:** Add entries for each feature in `tasks.md` marked as `[x]`.

---

### Issue 5: `CHANGELOG.md` Cumulative — OK

The changelog has been updated after each feature. No action needed.

---

### No Other Issues Found

- **RLS policies**: All tables have appropriate policies. No new tables were added.
- **Database schema**: No migrations needed — existing `planner_change_log` table sufficed for audit trail.
- **UI responsiveness**: Context menu uses Radix primitives (responsive by default). History tab uses standard Tailwind layout.
- **Error boundaries**: All pages are wrapped. AutoPublishHandler has its own ErrorBoundary.
- **Security**: No secrets in client code beyond the anon key (expected). No `localStorage`-based admin checks.
- **Translation keys**: DA and EN are fully in sync (contextMenu, history, undo, series).

---

### Remediation Plan

| Priority | Task | Files |
|----------|------|-------|
| HIGH | Wrap 28 unguarded console statements in `import.meta.env.DEV` | 14 files listed above |
| MEDIUM | Fix auto-publish interval churn (use ref for assignments) | `useAutoPublishAssignments.ts` |
| MEDIUM | Update `docs/implementation-plan/tasks.md` with recent features | `docs/implementation-plan/tasks.md` |
| LOW | Fix stale "16:00" comment | `useAutoPublishAssignments.ts` |

