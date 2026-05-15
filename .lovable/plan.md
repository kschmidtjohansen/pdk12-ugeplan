## Mål

Konverter statisk-importerede dialog-komponenter til `React.lazy` + `<Suspense>`, så deres JS først hentes ved første åbning. Reducerer initial bundle for Dashboard, Planner, Vacation og Car-flows.

## Scope (faktisk eksisterende dialoger)

### Dashboard / Planner
| Fil | Lazy-import |
|---|---|
| `src/components/Dashboard/WeeklyAssignments.tsx` | `AssignmentDetailsDialog`, `AssignmentDialogManager` |
| `src/components/Dashboard/MineOpgaver.tsx` | `AssignmentDetailsDialog` |
| `src/components/Planner/PlannerContent.tsx` | `AssignmentDetailsDialog` |
| `src/pages/PlannerPage.tsx` | `PlannerDialogContainer`, `SeriesActionDialog` |
| `src/components/Planner/AssignmentDialogManager.tsx` | `SeriesActionDialog` (intern) |

### Vacation
| Fil | Lazy-import |
|---|---|
| `src/components/Vacation/VacationDialogs.tsx` | `VacationFormDialog`, `VacationActionDialog`, `AdminVacationFormDialog` |

### Cars
| Fil | Lazy-import |
|---|---|
| `src/components/Cars/CarDialogs.tsx` | `CarFormDialog`, `DeleteConfirmDialog` |

> `DashboardCockpit.tsx` har ingen direkte dialog-imports — springes over.
> Komponenter der allerede ER en `Dialog`-wrapper omkring et åbent state (f.eks. `FalckSubscriptionButton` der bruger `@/components/ui/dialog` direkte) konverteres ikke — de er ikke separate moduler.

## Mønster

```tsx
import React, { Suspense, lazy } from 'react';

const AssignmentDetailsDialog = lazy(
  () => import('@/components/Dashboard/AssignmentDetailsDialog')
);

// Render kun hvis åbnet:
{selectedAssignment && (
  <Suspense fallback={null}>
    <AssignmentDetailsDialog
      assignment={selectedAssignment}
      open={!!selectedAssignment}
      onOpenChange={...}
    />
  </Suspense>
)}
```

Regler:
- `fallback={null}` — dialoger skal ikke vise skeleton; de er usynlige indtil åbne.
- Render kun JSX'en når `open === true` (eller tilsvarende guard) — ellers prefetcher Suspense unødigt.
- Hvis en fil eksporterer dialogen som named export, brug `lazy(() => import('...').then(m => ({ default: m.X })))`.

## Tekniske detaljer

- `React.lazy` kræver `default` export. Tjekkes per fil; alle de listede dialoger er allerede default exports baseret på eksisterende `import X from './X'`-mønstre.
- Suspense-grænsen placeres så tæt på dialogen som muligt for at undgå at suspende parent-UI ved første render.
- TypeScript-props bevares uændret.
- Ingen funktionel ændring — kun bundle-splitting.

## Verifikation

1. `bun run build` → bekræft at nye chunks for hver dialog dukker op i `dist/assets/`.
2. Manuel røgtest af Planner, Dashboard, Vacation og Cars: åbn én dialog hvert sted, bekræft at den loader uden synlig flicker.
3. Console: ingen `Suspense`/`lazy`-warnings.

## Dokumentation

- `CHANGELOG.md`: tilføj entry under Performance.
- `docs/implementation-plan/tasks.md`: marker som `[x]` hvis der findes en matchende opgave; ellers tilføj kort note.

## Out of scope

- `DashboardCockpit.tsx` (ingen dialog-imports).
- Dialoger der ikke ligger i separate moduler (f.eks. inline `Dialog` i `FalckSubscriptionButton`).
- `CreateAssignmentDialog` / `EditAssignmentDialog` / `CarDetailsDialog` / `VacationRequestDialog` — eksisterer ikke i kodebasen.
- Route-level lazy loading (separat opgave).
