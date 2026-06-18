## Plan

1. **Ret KPI-dato for fraværende-metric**
   - Behold ugevalget i dashboardet.
   - Når den valgte uge ikke er den aktuelle uge, skal fraværende-metric ikke kun kigge på mandag.
   - Den skal finde medarbejdere med ferie/fravær/kursus på en relevant dato i hele den valgte uge, så Henrik vises i uge 20+ hvor kurset faktisk er aktivt.

2. **Bevar korrekt datovisning i dialogen**
   - Dialogen skal stadig vise den dato, metric’en beregnes ud fra.
   - Hvis Henrik er på kursus i ugen, skal han vises med gul `Kursus`-label og kursusdetaljer.

3. **Dokumentation**
   - Opdater `docs/implementation-plan/tasks.md` og `CHANGELOG.md` med rettelsen.

## Teknisk

- `DashboardCockpit.tsx`: beregn ugestart/-slut for valgt uge og send ugekontekst til KPI-komponenten.
- `CompactKpiStack.tsx` / `useDashboardMetrics.ts`: udvid fraværende-beregningen, så kursus kan matches på hele den valgte uge frem for kun én ankredato.
- Ingen databaseændringer.