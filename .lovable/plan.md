## Diagnose
I `src/pages/DutyPage.tsx` styres data-hentningen af `selectedMonth` (linje 38, 45–48), men kalenderens navigation skifter kun `calendarMonth` (linje 39, 197). `selectedMonth` initialiseres til dags dato (juni 2026) og opdateres aldrig, så `useDutyData` henter kun vagter for juni–august. Når man navigerer til september og opretter en vagt, gemmes den korrekt i DB, men ligger uden for det hentede datointerval, så den vises ikke i kalenderen eller listen før man genindlæser siden i en kontekst hvor september er inden for vinduet.

## Løsning
Forenkl ved at fjerne `selectedMonth` og bruge `calendarMonth` som eneste sandhed for både kalender-navigation og datointerval. Datointervallet skal dække den viste måned plus en buffer, så vagter for forrige/næste måned der er synlige i kalenderens første/sidste uge også hentes.

## Ændringer

**`src/pages/DutyPage.tsx`**
- Fjern `selectedMonth`/`setSelectedMonth` (linje 38).
- Beregn datointerval ud fra `calendarMonth`:
  - `startDate = startOfMonth(subMonths(calendarMonth, 1))`
  - `endDate = endOfMonth(addMonths(calendarMonth, 1))`
  
  (1 måned før + 1 måned efter dækker både kalender-grid-overflow og kommende-vagt-listen tilstrækkeligt; React Query cacher pr. interval).
- Importér `subMonths` fra `date-fns`.

Ingen ændringer i `useDutyData`, dialoger, DB eller RLS.

## Dokumentation
- `CHANGELOG.md`: Note om at vagter i fremtidige måneder nu vises korrekt efter oprettelse.
- `docs/implementation-plan/tasks.md`: Marker som fuldført.