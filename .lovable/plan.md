# Fjern dobbelte toasts og dobbelt "Slip for at opdatere"

## Verificerede fund

1. **Dobbelt "Slip for at opdatere" på Dashboard (skærmbillede 1):**
   `MainLayout.tsx` (linje 111) pakker alle sider ind i `PullToRefresh`, og
   `DashboardPage.tsx` (linje 73) pakker sit indhold i endnu en `PullToRefresh`.
   To nestede instanser = to spinners oven på hinanden. Samme dobbelt-mount
   findes på `CarsPage.tsx` (også wrapper i `PullToRefresh` oven på MainLayouts).

2. **Dobbelt "Opgave Opdateret"-toast (skærmbillede 2):**
   Kun én `<Toaster />` er monteret (App.tsx:139), og teksten
   `assignmentUpdatedMsg` affyres kun ét sted (`useOptimizedAssignments.ts` linje 524).
   Derfor må `updateAssignment` blive kaldt to gange for samme gem-handling, eller
   toast-systemet modtager samme besked to gange. `use-toast.ts` har ingen
   dublet-beskyttelse, så enhver dobbelt-affyring vises som to identiske toasts.

## Plan

### 1. Fjern dobbelt pull-to-refresh
- Fjern den indre `PullToRefresh`-wrapper fra `DashboardPage.tsx` (behold `handleRefresh`-logikken ved at sende den op til MainLayout via eksisterende mønster, eller lad MainLayouts refresh genindlæse siden — MainLayout kalder allerede refetch på refresh).
- Fjern tilsvarende indre `PullToRefresh` fra `CarsPage.tsx`.
- Resultat: én "Slip for at opdatere"-indikator pr. side på mobil.

### 2. Stop dobbelte toasts
- Tilføj dublet-beskyttelse i `src/hooks/use-toast.ts`: hvis en toast med samme
  `title` + `description` + `variant` allerede er oprettet inden for det sidste
  ~1,5 sekund, ignoreres den nye. Det fjerner alle utilsigtede dobbelt-toasts
  globalt uden at ændre nogen flows.
- Ekstra sikring i `useOptimizedAssignments.updateAssignment`: et ref-guard, så
  samme assignment-id ikke kan gemmes to gange samtidig (parallelt kald), svarende
  til den dobbelt-submit-beskyttelse der allerede findes i formularen.

### 3. Verificering
- Typecheck (`tsgo`).
- Visuel kontrol via preview på mobilvisning: dashboard viser kun én
  pull-to-refresh-indikator; opdatering af en opgave i planner viser kun én toast.

### 4. Dokumentation
- Opdater `CHANGELOG.md` og marker opgaven i `docs/implementation-plan/tasks.md`.

## Tekniske detaljer
- Berørte filer: `src/pages/DashboardPage.tsx`, `src/pages/CarsPage.tsx`,
  `src/hooks/use-toast.ts`, `src/hooks/useOptimizedAssignments.ts`,
  `CHANGELOG.md`, `docs/implementation-plan/tasks.md`.
- Ingen database- eller backend-ændringer. Desktop-visning upåvirket
  (pull-to-refresh er kun aktivt på touch).
