## Plan

1. **Ret live-RPC'en der henter planner-sager**
   - Opdatér `public.list_accessible_assignments_with_team(...)` så begge live-grene eksplicit filtrerer `a.is_demo = false`.
   - Filtrér samtidig joins til team/ansvarlig bruger på live-data (`assignments_employees.is_demo = false`, `profiles.is_demo = false`) så demo-personer ikke kan følge med i live-resultatet.
   - Bevar eksisterende rolle- og afdelingslogik uændret.

2. **Stram databasefunktionen fremfor kun frontend**
   - Årsagen er, at `list_accessible_assignments_with_team` er `SECURITY DEFINER` og derfor ikke kan stole på RLS-filteret alene.
   - Det er derfor nødvendigt at ændre selve SQL-funktionen, ikke kun React-koden.

3. **Verificér sag 1221**
   - Bekræft at de tre rækker med titel `1221` fortsat er `is_demo = true`.
   - Bekræft efter migrationen at live-RPC'en ikke returnerer `1221`, mens demo-RPC'en stadig kan returnere demo-sager for demo-brugeren.

4. **Opdatér dokumentation**
   - Tilføj en changelog-note.
   - Markér/tilføj opgaven i `/docs/implementation-plan/tasks.md`.
   - Tilføj regel i tekniske specs/security-memory: `SECURITY DEFINER` live-RPC'er skal altid filtrere `is_demo = false` direkte, fordi RLS ikke er nok i den kontekst.