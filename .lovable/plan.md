## Mål
Undgå overflødige `queryClient.prefetchQuery`-kald når musen swiper hen over forrige/næste-uge-knapperne i Planner.

## Omfang
Kun ét sted i kodebasen trigger prefetch på `onMouseEnter`:
- `src/pages/PlannerPage.tsx` linjer 213–230 (`handlePrefetchAssignments`) bundet til knapperne på linje 692 og 698.

(Den anden `onMouseEnter` i `GlobalAssignmentSearch.tsx` opdaterer kun et lokalt highlight-index — ingen netværkskald, røres ikke.)

## Ændringer

### 1. `src/pages/PlannerPage.tsx`
- Tilføj en `useRef<ReturnType<typeof setTimeout> | null>` til at holde en pending hover-timer.
- Refaktor `handlePrefetchAssignments` til en debounced variant (`HOVER_DELAY_MS = 150`):
  - Ved `onMouseEnter`: clear evt. eksisterende timer, sæt ny `setTimeout` der efter 150 ms kalder den faktiske prefetch-logik.
  - Tilføj en `handleCancelPrefetch` der clearer timeren — bindes som `onMouseLeave` på begge knapper, så hurtige forbi-bevægelser annullerer kaldet før det fyres.
- Cleanup-effect (`useEffect` med tom dep-array) der clearer timeren ved unmount.

Resultatet: kun hvis brugeren faktisk hviler musen ≥150 ms over knappen, sendes prefetch-kaldet. React Query's egen cache + `staleTime: 2 min` håndterer de-duplikering, men debounce sparer kaldene helt når brugeren bare strejfer knapperne.

### 2. `CHANGELOG.md`
Tilføj én linje under nyeste sektion: "Debounced prefetch on hover (150 ms) på Planner uge-navigation for at undgå overflødige netværkskald ved hurtige musebevægelser."

### 3. `docs/implementation-plan/tasks.md`
Marker relateret opgave `[x]` hvis den findes; ellers tilføj kort under "Performance".

## Teknisk note
Bruger bevidst en simpel `setTimeout`-debounce frem for at trække lodash ind — matcher samme pattern som `useDawaAutocomplete` (300 ms) og `GlobalAssignmentSearch` (300 ms) i projektet.
