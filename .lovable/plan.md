## Mål
Fjerne unødige genberegninger af uge-nummer / uge-datoer / uge-assignment-filtrering ved hvert render. Hot path er `PlannerPage` (kører ved hver state-change, scroll, dialog-åbning), men også `Dashboard`/`WelcomeHeader` får små gevinster.

## Problemer i den nuværende kode

**`src/pages/PlannerPage.tsx`**
- L140: `getWeekDates` er en inline funktion (ikke `useCallback`/`useMemo`) — kaldes på hvert render (L147), plus i `handlePreviousWeek` (L203) og `handleNextWeek` (L210).
- L147: `weekDates` er et nyt objekt hver render → invalidator alle nedstrøms `useMemo` der bruger det som dep (`handleToggleAllExpanded` L162).
- L165-174: `weekAssignments` filter kører `new Date(...)` + `getISOWeek` + `getISOWeekYear` for **hver** assignment, hver gang `assignments`-array-referencen ændrer sig (selv ved realtime-debounce-refetch der returnerer samme data). Dette er O(n) tunge date-fns-kald per render-cycle.
- L102-110: lokal `getAllWeekDays` duplikerer canonical util fra `utils/dates/weekCore.ts`.

**Dashboard / WelcomeHeader / VacationCalendarOverview**
- `getISOWeek(new Date())` kaldes direkte i render-body (`WelcomeHeader.tsx` L39+L44, `DashboardPage.tsx` ved init-state).
- Mindre churn, men kan trivielt memoiseres pr. dato.

## Plan

### 1. Module-level cache i `src/utils/dates/weekCore.ts`
Tilføj to billige Map-baserede caches (deterministisk input → deterministisk output, sikkert at cache for sessionens varighed):

- `getWeekDates(week, year)` cache med nøgle `${year}-${week}`. Returnerer samme objekt-reference ved gentagne kald → stabil dep i React.
- Ny helper `getISOWeekInfoForDate(dateStr: string): { week, year }` der memoiserer på YYYY-MM-DD-strenge (cap på fx 1000 entries via simpel FIFO/LRU). Bruges af weekAssignments-filteret.

Fjern DEV-`console.log` i `getWeekDates` (kører ofte → log-spam i dev).

### 2. `PlannerPage.tsx`
- Erstat inline `getWeekDates` med import fra `@/utils/dates` (cached).
- `weekDates`: `useMemo(() => getWeekDates(selectedWeek, selectedYear), [selectedWeek, selectedYear])`.
- `weekAssignments`: Skift fra dato-parsing til **lexicographic string-compare** mod `weekDates.start`/`end` (begge formateret som `yyyy-MM-dd`). YYYY-MM-DD sorterer korrekt som strings — ingen Date-allokering pr. række. Dep: `[assignments, weekStartStr, weekEndStr]`.
- Erstat lokal `getAllWeekDays` med import.
- `handlePreviousWeek`/`handleNextWeek`: brug `useCallback` + den memoiserede `weekDates` (stadig stabil mellem renders inden for samme uge).

### 3. `WelcomeHeader.tsx`, `DashboardPage.tsx`, `VacationCalendarOverview.tsx`
- Wrap `getISOWeek(new Date())`-kald i `useMemo(() => …, [])` (eller `useMemo` på en stabil dato-key) så de ikke kører pr. render.
- For `DashboardPage` init-state er det allerede engangs, men `WelcomeHeader` gør det per render → største gevinst der.

### 4. `WeeklyAssignments.tsx` (Dashboard)
- `prefillDate` useMemo er allerede ok. Ingen ændring nødvendig — kun verifikation.

## Ud af scope
- Ingen ændring af RLS, queries eller datamodel.
- Ingen ny dependency. Bruger kun React + date-fns.
- Virtualisering / server-side filtering — ikke nødvendigt ved disse mængder.

## Filer der ændres
- `src/utils/dates/weekCore.ts` — tilføj caches, fjern dev-logs
- `src/utils/dates/index.ts` — eksportér ny helper hvis nødvendig
- `src/pages/PlannerPage.tsx` — memoize weekDates, fjern dup, hurtigere filter
- `src/components/Dashboard/WelcomeHeader.tsx` — useMemo om uge-nummer
- `CHANGELOG.md` + `docs/implementation-plan/tasks.md`

## Verifikation
- Build kompilerer rent.
- Manuelt: skift uge frem/tilbage virker, søgning filtrerer korrekt, "Vis alle/kollaps alle" virker uændret.
- DevTools Profiler: `PlannerContent` re-render-tid skal falde ved gentagne renders i samme uge.
