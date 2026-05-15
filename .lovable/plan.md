# Plan: Error Boundaries for Planner-komponenter

## Mål
Isolere runtime-fejl i enkelte planner-widgets, så hele Planner-siden ikke crasher. Brugeren skal fortsat kunne arbejde med resten af ugeplanen, selvom ét område fejler.

## Hvad vi bygger

### 1. Ny komponent: `PlannerWidgetErrorBoundary`
- Placering: `src/components/ErrorBoundary/PlannerWidgetErrorBoundary.tsx`
- Klasse-baseret React Error Boundary (som de øvrige i projektet).
- Lokaliseret fallback: et kompakt card med fejlbesked på dansk/engelsk (ligesom `GlobalErrorBoundary`), en "Prøv igen"-knap, og kun fejldetaljer i DEV.
- Design: `border-destructive/20`, `bg-destructive/5`, passer til eksisterende design-system. Ikke en fuldskærm-fejlside — kun en widget-størrelse blok.

### 2. Wrapping i `PlannerContent.tsx`
Hver selvstændig sektion wrappes med `<PlannerWidgetErrorBoundary>`:
- `UnassignedResourcesSection`
- `DutyWeekWidget`
- `CurrentAndFutureDays` / `CompactCurrentAndFutureDays`
- `PastAssignments` / `CompactPastAssignments`

Dette sikrer, at fx en fejl i `DutyWeekWidget` ikke nedlægger hele ugeplanen.

### 3. Per-dag wrapping i listerne
Hver `DaySection` / `CompactDaySection` der renderes inde i `VirtualList` wrappes med `<PlannerWidgetErrorBoundary>` i:
- `CurrentAndFutureDays.tsx`
- `PastAssignments.tsx`
- `CompactCurrentAndFutureDays.tsx`
- `CompactPastAssignments.tsx`

Dette isolerer fejl i ét enkelt dagskorts rendering (fx en korrupt `AssignmentCard`), så de øvrige dage stadig vises.

## Tekniske detaljer
- Error Boundary skal være en klasse-komponent (React hooks virker ikke i Error Boundaries).
- `key` prop på boundary skal være dato-strengen, så retry re-renderer den korrekte dag.
- Virtualiseringens `measureElement` måler det ydre element — Error Boundary ændrer ikke DOM-strukturen nok til at påvirke dette.
- Ingen ændringer i state management, data fetching eller business logic.

## Dokumentation
- `CHANGELOG.md`: tilføjer post med dato + beskrivelse af isolation-forbedringen.
- `docs/implementation-plan/tasks.md`: markerer opgaven som fuldført.

## Filer der ændres
| Fil | Ændring |
|---|---|
| `src/components/ErrorBoundary/PlannerWidgetErrorBoundary.tsx` | Ny fil |
| `src/components/Planner/PlannerContent.tsx` | Wrap sektioner med Error Boundary |
| `src/components/Planner/CurrentAndFutureDays.tsx` | Wrap `renderItem` output |
| `src/components/Planner/PastAssignments.tsx` | Wrap `renderItem` output |
| `src/components/Planner/CompactCurrentAndFutureDays.tsx` | Wrap `renderItem` output |
| `src/components/Planner/CompactPastAssignments.tsx` | Wrap `renderItem` output |
| `CHANGELOG.md` | Ny post |
| `docs/implementation-plan/tasks.md` | Opdater status |
