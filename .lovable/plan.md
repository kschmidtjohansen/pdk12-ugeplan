
## Diagnose

Jonas Grønbæk Krause er oprettet korrekt i databasen:
- `home_department_id` og `user_access` peger på Vejle (`ca52e77e-…`)
- Rolle: `servicemedarbejder`
- Status: `active`, `is_visible_in_planning=true`
- Han er tilføjet til 5 publicerede opgaver i uge 28 (2026-07-06 → 2026-07-10)

RLS (`can_view_assignment_optimized`) og RPC'en `list_accessible_assignments_with_team` giver ham korrekt adgang til disse opgaver.

Årsag til det tomme "Ingen opgaver i denne uge" er i frontenden: `DepartmentContext` initialiserer `selectedDepartmentId` fra `localStorage` og **validerer aldrig værdien mod brugerens faktiske afdelinger**. Hvis der ligger et gammelt/ugyldigt `selected_department_id` i browserens `localStorage` (fra et tidligere login, en slettet afdeling, demo-mode osv.), bliver det ID sendt videre som `p_department_id` til RPC'en, som så returnerer 0 rækker — og både Planner og Dashboard viser tomme lister, selvom brugeren er tilknyttet opgaver.

I dag sætter koden kun default-afdelingen når `!selectedDepartmentId` (linje 154/187), så en stale værdi bliver aldrig ryddet.

## Fix

I `src/context/DepartmentContext.tsx`, inde i `fetchUserDepartments` (både super_admin- og user_access-grenen):

1. Efter listen af tilladte afdelinger (`mapped` / `depts`) er hentet, tjek om det aktuelle `selectedDepartmentId` findes i listen.
2. Hvis ikke (eller hvis intet er valgt): vælg den første tilladte afdeling, kald `setSelectedDepartmentIdState(...)`, og skriv den til `localStorage`. Hvis listen er tom: sæt til `null` og fjern nøglen.
3. Ingen backend-ændringer, ingen nye afhængigheder — kun frontend/DepartmentContext.

Dette matcher det mønster, sub-department-effekten allerede bruger (linje 217-241) og gør Planner/Dashboard robust over for stale localStorage.

## Verify

- Bede brugeren nulstille cache/localStorage én gang (som umiddelbar workaround).
- Efter deploy: log ind som Jonas → Planner uge 28 skal vise de 5 opgaver uden manuel oprydning.
- Ingen ændring for brugere hvor stored ID stadig er gyldigt.

## Docs

Opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md` med en kort note om fixet.
