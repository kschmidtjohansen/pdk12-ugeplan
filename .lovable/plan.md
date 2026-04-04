

## Projekt-audit: Resultater og handlingsplan

### Overordnet status

TypeScript kompilerer fejlfrit. Dev-serveren kører uden fejl. Runtime-fejlen ("Failed to fetch dynamically imported module: PlannerPage.tsx") er en **forbigående Vite HMR-fejl** der opstår ved hot-reload under kodeændringer — ikke en kodefejl. Den forsvinder ved en page refresh.

---

### Fund 1: 179 uguardede console.log/warn i produktion (KRITISK)

Ifølge knowledge (`production-readiness`, `technical-specs`) skal **alle** console.log/warn være wrapped i `import.meta.env.DEV`. Der er aktuelt 179 uguardede statements spredt over:

**Værst ramte filer (skal renses):**

| Fil | Antal | Type |
|-----|-------|------|
| `src/hooks/useAssignmentFilters.ts` | 9 | Verbose debug-logging i hvert kald |
| `src/components/Dashboard/ServicemedarbejderDashboard.tsx` | 7 | Debug med emojis |
| `src/components/Dashboard/WeekNavigation.tsx` | 5 | Week calculation debug |
| `src/components/Dashboard/EmployeeAvailabilityDialog/index.tsx` | 6 | Dialog debug |
| `src/components/Planner/EmployeeSelector.tsx` | 8 | Debug logging |
| `src/components/Planner/AssignmentForm.tsx` | 5 | Form submission debug |
| `src/components/Planner/AssignmentCard.tsx` | 3 | Assignment data debug |
| `src/components/Planner/AssignmentDetails.tsx` | 2 | Employee data debug |
| `src/services/optimizedAssignmentService.ts` | 8 | Service debug |
| `src/services/plannerChangeLogger.ts` | 6 | Change log debug |
| `src/hooks/employee/useEmployeeCreation.ts` | 4 | Warnings uden guard |
| `src/context/AuthContext.tsx` | 3 | Login debug |
| `src/hooks/useNotifications.ts` | 2 | Filter debug |
| `src/hooks/useDashboardMetrics.ts` | 1 | Metrics debug |
| `src/hooks/useEmployees.ts` | 1 | Employee count |
| `src/hooks/use-toast.ts` | 1 | Toast debug |
| `src/components/AutoPublish/AutoPublishHandler.tsx` | 1 | Init log |
| `src/components/Admin/UserManagement.tsx` | 3 | Profile/demo debug |
| `src/components/Employees/EmployeeFormDialog.tsx` | 1 | Create log |
| `src/components/Layout/NavComponents/DesktopNavigation.tsx` | 1 | Red dot render |
| `src/components/Vacation/VacationFormDialog.tsx` | 1 | Dialog open debug |
| `src/components/Vacation/VacationTabContent.tsx` | 2 | Filter debug |
| `src/hooks/car/useCarData.ts` | 2 | Car data debug |
| `src/hooks/car/useCarActions.ts` | 2 | Optimistic rollback |
| `src/hooks/car/useCarFormState.ts` | 1 | Fetch warning |
| `src/hooks/data/useUnifiedData.ts` | 2 | Realtime debug |
| `src/hooks/assignment/useAssignmentFormState.ts` | 3 | Form state debug |
| `src/services/circuitBreakerService.ts` | 3 | Circuit breaker |
| `src/services/realtimeManager.ts` | 2 | Connection debug |
| `src/services/systemHealthService.ts` | 2 | Health check |
| Andre filer | ~15 | Diverse |

**Fix:** Wrap hvert statement i `if (import.meta.env.DEV)` guard, eller fjern statements der kun er debug-rester (f.eks. de mange "CRITICAL FIX" logs i `useAssignmentFilters.ts`).

---

### Fund 2: `process.env.NODE_ENV` brugt i stedet for `import.meta.env.DEV` (MINOR)

`src/App.tsx` linje 66 bruger `process.env.NODE_ENV === 'development'`. I Vite-projekter fungerer dette kun fordi Vite erstatter det under build — men `import.meta.env.DEV` er den korrekte Vite-konvention. Samme i `TranslationContext.tsx`, `SecurityContext.tsx`, `GlobalErrorBoundary.tsx`, `SecurityErrorBoundary.tsx`. Disse filer virker, men bør standardiseres for konsistens.

---

### Fund 3: `MutationCache` error handler er uguardet (MINOR)

`src/App.tsx` linje 58: `console.error('[MutationCache] Unhandled mutation error:', error)` — denne bør wraps i DEV guard eller fjernes da den kan lække fejldetaljer i produktion.

---

### Fund 4: Funktionel kode er intakt

- **"Uden afdeling" feature**: Korrekt implementeret i `UserFormDialog.tsx` — checkbox vises for `super_admin`, default er `false`, department-sektionen vises normalt.
- **Employee creation flow** (`useEmployeeCreation.ts`): `skip_department` check er korrekt (linje 264).
- **Admin user creation** (`UserFormDialog.tsx`): `saveUserAccess` håndterer både med/uden afdeling korrekt.
- **RLS-politikker**: Gennemgået — alle tabeller har passende policies.
- **Routing**: Alle lazy-loadede sider er korrekt konfigureret i `App.tsx`.

---

### Fund 5: `DesktopNavigation.tsx` har inline `console.log` i JSX (BUG)

Linje 96: `{console.log('[DesktopNavigation] 🔴 RED DOT RENDERED', {...})}` — dette er en `console.log` der eksekveres som en JSX-expression i hvert render. Skal fjernes eller guards.

---

### Handlingsplan

1. **Rens alle 179 uguardede `console.log`/`console.warn` statements** — wrap i `if (import.meta.env.DEV)` guard
2. **Fjern inline `console.log` i JSX** i `DesktopNavigation.tsx`
3. **Guard `MutationCache` error handler** i `App.tsx`
4. **Opdater `CHANGELOG.md`** med audit-resultater

Estimeret omfang: ~35 filer ændres, udelukkende log-guards tilføjes. Ingen funktionel ændring.

