# Fix: EmployeeSelector er tom og for høj på Windows/desktop

## Problem
Efter virtualiseringen af medarbejderlisten viser EmployeeSelector (desktop/Popover) et tomt hvidt område, og boksen strækker sig for langt ned på skærmen (går ind under Windows-proceslinjen).

## Årsag (bekræftet ved kodelæsning)
1. **Tom liste:** `useVirtualizer` i `src/components/Planner/EmployeeSelector.tsx` måler scroll-containeren (`scrollRef`) ved første render. Når Radix Popover åbnes med portal/animation, kan containerens højde være 0 på måletidspunktet — `getVirtualItems()` returnerer så ingen rækker, og intet renderes, selvom der er data. Der er ingen fallback, hvis virtualiseringen returnerer 0 rækker.
2. **For høj boks:** Desktop-containeren er sat til fast `h-[60vh] max-h-[70vh]`, hvilket tvinger boksen til at fylde 60 % af skærmhøjden, selv med få medarbejdere, og kan overlappe proceslinjen.

## Plan
1. **Reproducér i browseren** (Playwright, desktop-viewport) for at bekræfte den tomme liste.
2. **Robusthed mod tom virtualisering** i `EmployeeSelector.tsx`:
   - Kald `rowVirtualizer.measure()` når `open` skifter til true, så måling sker efter popoveren er monteret.
   - Fallback: hvis `getVirtualItems()` er tom men der findes medarbejderrækker, render rækkerne uden virtualisering (simpel liste), så listen aldrig er blank.
3. **Højde/tilpasning:**
   - Erstat fast højde med `max-h` + naturlig højde: scroll-containeren får `max-h-[min(60vh,480px)]` og `h-auto` op til indholdets højde (total virtualiseret højde, begrænset af max-h), så boksen kun er så høj som indholdet kræver.
   - Tilføj `collisionPadding={16}` på `PopoverContent`, så Radix holder boksen væk fra skærmkanter/proceslinjen.
4. **Bevar uændret:** søgning, valgte-øverst, 2-kolonne grid, status-/låselogik, tooltips, mobil Drawer (virker allerede).
5. **Verificér:** typecheck + Playwright desktop-screenshot (liste synlig, boks tilpasset højde) og mobil-screenshot. Opdatér CHANGELOG.md og docs/implementation-plan/tasks.md.

## Tekniske detaljer
- Fil: `src/components/Planner/EmployeeSelector.tsx`
- Virtualiseringen beholdes (`@tanstack/react-virtual`) — kun måle-timing og håndtering af 0-rækker rettes, så store lister stadig er hurtige.
- Scroll-containerens wrapper bruger `style={{ height: min(totalSize, maxH) }}`-logik eller CSS `max-h` med indholdsstyret højde.
