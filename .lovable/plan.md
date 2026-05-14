## Fase 4 — Performance (statisk gennemgang)

Fokus: målbare gevinster på bundle-size, render-cost og dev-støj. Ingen ændringer til forretningslogik, RLS, realtime-kontrakter eller knowledge-rules (multi-tenant isolation, 5min staleTime, 1s realtime debounce, kompakt UI bevares uændret).

### Status quo (allerede godt)

- Route-level `lazy()` + `Suspense` på alle sider med retry-wrapper.
- Manual chunks for react/ui/data/supabase/utils/charts vendors.
- Terser med `drop_console: true` i prod → console.* fjernes automatisk i build.
- React Query: staleTime 5min, gcTime 10min, refetchOnWindowFocus false.
- `rollup-plugin-visualizer` konfigureret (genererer `dist/stats.html`).

Disse rør ikke.

### 1. Ustabile dependencies / over-rendering i Planner-træ (højeste impact)

Statisk fund i de 14 Planner-komponenter:
- `useMemo`/`useCallback` bruges sparsomt (max 7 i én fil, 0 i fx `AssignmentDialogManager`, `DutyWeekWidget`, `AssignmentForm` har kun 2).
- 17 inline arrow-funktioner i JSX `onClick={() => …}` i `src/components/Planner/*` → ny ref pr. render → child memo-break.
- Kun 2 `React.memo` i hele kodebasen.

Plan:
- Wrappe rene præsentations-children i `React.memo`: `DayAbsenceRow`, `FilterChips`-rows, listerækker i `AssignmentList`, `UnassignedResourcesSection`-cells.
- Konvertere top-level event handlers i `PlannerContent`, `AssignmentDialogManager`, `AssignmentList` til `useCallback` med stabile deps.
- `useMemo` på dyre derived arrays (filtered/sorterede assignments-lister i `PlannerContent`, `UnassignedResourcesSection`).
- Ingen ændring af adfærd — kun referential stability.

Holder ændringer til Planner-træet (hvor brugeren bruger >80% af tiden ifølge knowledge).

### 2. Bundle: identificer reelle vindere via stats.html

Køres lokalt af user efter denne fase (`npm run build` → `dist/stats.html`). Statisk identificeret allerede:
- `recharts` i sit eget chunk ✓
- `date-fns` i utils-vendor ✓ (bemærk: `date-fns/locale/da` importeres specifikt — godt, ingen action).
- `src/integrations/supabase/types.ts` (1822 linjer) er kun typer, tree-shakes væk i prod ✓.

Konkret action:
- Tilføj `lucide-react` til `optimizeDeps.include` for hurtigere dev-cold-start (mange små icon-imports → mange dev-requests).
- Verificere at `AssignmentFilesPanel.tsx` (814 linjer) og `UserManagement.tsx` (894 linjer) ikke ligger i hovedbundlet — de er allerede bag route-lazy, så de er det ikke. Ingen action.

### 3. Dev-støj: ugarderede console-statements (20+ fund)

Terser dropper dem i prod, men de spammer dev-konsollen og maskerer ægte fejl. Pakker dem i `if (import.meta.env.DEV)`-guard (samme mønster som resten af kodebasen allerede bruger):

```text
src/pages/ScreenDisplayPage.tsx          (3)
src/pages/LoginPage.tsx                  (1)
src/utils/dates/weekFormatting.ts        (1)
src/services/optimizedAssignmentService.ts (2)
src/hooks/assignment/useAssignmentFormState.ts (1)
src/context/AuthContext.tsx              (2)
src/components/Dashboard/EmployeeAvailabilityDialog/index.tsx (1)
src/components/Vacation/VacationFormDialog.tsx (1)
src/hooks/useNotifications.ts            (2)
src/components/Planner/ResponsibleUserSelector.tsx (2)
src/hooks/employee/useEmployeeCreation.ts (2 warns — bevares, men guardes)
```

Ikke rørt: `SecurityHeaders.tsx` (overrider bevidst `console.error` til security logging) og `useEmployeeCreation` warnings (bevares som warnings, blot guardet).

### 4. Realtime listeners: verificer cleanup (statisk)

22 filer kalder `channel(...)` / `.subscribe(...)`. Tjekker statisk at hver `useEffect` har `return () => supabase.removeChannel(...)`. Hvis fund mangler cleanup, fixes (memory leak risk). Ingen ændring af channel-navne eller debounce — knowledge "1s debounce, ignore own actions" bevares.

### Ud af scope (kræver runtime/browser eller separat aftale)

- React Profiler-flamegraph (kræver browser).
- Web Vitals måling (LCP/INP/CLS) — kræver published build.
- Konvertering af de få billeder til AVIF/WebP — kun `polygon-mark.png` (3KB) findes; ingen LCP-image at preloade.
- Virtualisering af lange lister (vi har ingen lister >200 rows i typisk dataset; udskydes til når reelle perf-problemer rapporteres).
- Service worker / offline strategi.

### Verificering

- TypeScript build (auto via harness).
- Re-scan ugarderede `console.*` → forventer 0 udenfor `SecurityHeaders` og `weekFormatting`.
- Manuel inspektion af Planner-render-paths: bekræft at alle `useCallback`/`useMemo` har korrekte deps (ingen stale closures).
- User kan efterfølgende køre `npm run build` og åbne `dist/stats.html` for visuel bundle-rapport.

### Changelog

Tilføjer "Fase 4: Performance" sektion til `CHANGELOG.md` med liste over memoiserede komponenter, guardede console-statements og evt. realtime cleanup-fixes.

### Tekniske noter

- `React.memo` med default shallow compare er nok — vi sender ikke deeply nested objects som props i Planner-cells.
- `useCallback` deps-arrays valideres mod faktisk closure; ikke "fake" deps for at slippe lint.
- Konsole-guards bruger samme `if (import.meta.env.DEV)`-pattern som resten af kodebasen for konsistens.
