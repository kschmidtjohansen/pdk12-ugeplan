## Plan

1. **Ret datakilden i medarbejder-dialogen**
   - Opdater `src/components/Dashboard/EmployeeAvailabilityDialog/hooks/useEmployeeDialogData.ts`, så den også kender den indloggede brugers rolle.
   - Når brugeren er `fugttekniker` eller `servicemedarbejder`, skal både den oprindelige liste og dato-navigerede lister filtreres til kun medarbejdere med rollen `servicemedarbejder`.
   - Dette retter tilfældet hvor Jonas Poulsen stadig ser `skadeleder`/`fugttekniker` i dialogen, selvom KPI’en nu tæller korrekt.

2. **Bevar adgang for ledere**
   - `skadeleder`, `administrator` og IT Support beholder den eksisterende udvidede visning, hvor valgt underafdeling kan inkludere relevante roller.

3. **Dokumentér ændringen**
   - Opdater `CHANGELOG.md` med en kort linje om at fugtteknikerens “Ledige medarbejdere”-dialog nu kun viser servicemedarbejdere.
   - Marker rettelsen i `/docs/implementation-plan/tasks.md` under løbende rettelser.

## Teknisk note

Den tidligere rettelse ramte `useDashboardMetrics.ts` og KPI-tallet, men dialog-hooket `useEmployeeDialogData.ts` returnerer `initialEmployees` direkte for den valgte dato og henter selv alle service-medarbejdere ved datonavigation. Derfor skal rollefilteret også ligge i dialogens egen datakilde.