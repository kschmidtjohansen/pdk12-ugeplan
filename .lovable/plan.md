## Problem

Sektionen "Ikke-tildelte ressourcer" på Planner viser stadig alle medarbejdere, biler og opgaver, selv når man har valgt en underafdeling (fx Fugt). Den respekterer ikke det valg, der blev lavet ved oprettelsen af underafdelingen (tilknyttede biler + medarbejdere). Det gør, at f.eks. Servicemedarbejdere stadig dukker op, selvom underafdelingen kun indeholder Skadeledere og Fugtteknikere.

## Årsag

`UnassignedResourcesSection` får sine `employees`, `cars` og `assignments` fra `useUnifiedData()` (i `PlannerContent.tsx`). `useUnifiedData` filtrerer kun på `selectedDepartmentId` — den læser ikke `selectedSubDepartmentId` overhovedet. Vores tidligere isolation blev kun lagt ind i `useEmployeeData` og `carSecurityService`, som bruges andre steder.

## Løsning

Udvid `useUnifiedData` + `unifiedDataService` så de også filtrerer strikte på sub-department, når en sub-department er valgt — på samme måde som vi gør andre steder.

### Ændringer

1. **`src/hooks/data/useUnifiedData.ts`**
   - Hent `selectedSubDepartmentId` fra `useDepartment()`.
   - Send det med ned i `fetchAllData(...)` og inkludér det i `useEffect`-dependencies + realtime channel key.

2. **`src/services/data/unifiedDataService.ts`** — udvid alle tre fetch-funktioner med et valgfrit `subDepartmentId`:
   - **`fetchEmployees`**: Når `subDepartmentId` er sat:
     - Slå op i `user_access` → hent `user_id`'er med `sub_department_id = subDepartmentId`.
     - Filtrér `profiles`-query med `.in('id', allowedIds)`. Hvis listen er tom → returnér tomt array (ingen fallback til alle).
   - **`fetchCars`**: Når `subDepartmentId` er sat:
     - Slå op i `car_sub_departments` → hent `car_id`'er for valgt sub-department.
     - Filtrér `cars`-query med `.in('id', allowedIds)`. Ingen `is null`-fallback.
   - **`fetchAssignments`**: Når `subDepartmentId` er sat:
     - Tilføj `.eq('sub_department_id', subDepartmentId)` på `assignments`-query. Ingen `IS NULL`-fallback (matcher allerede ændringen i `list_accessible_assignments_with_team`).
   - Cache-key skal inkludere `subDepartmentId`, så vi ikke får krydskontamineret cache mellem "Alle" og "Fugt".

3. **Rolle-relateret kommentar**: Selve UI-grupperingen i `UnassignedResourcesSection` (Skadeledere / Fugtteknikere / Servicemedarbejdere) ændres ikke — når medarbejderlisten først er korrekt filtreret efter sub-department, vil Servicemedarbejder-gruppen naturligt være tom for "Fugt", da kun Skadeledere og Fugtteknikere er tilknyttet sub-departmentet via `user_access`.

4. **Dokumentation**
   - Opdatér `CHANGELOG.md` med en linje under dagens dato.
   - Marker den relevante delopgave i `docs/implementation-plan/tasks.md` som `[x]`.

### Ingen ændringer

- Ingen DB-migrering — alle nødvendige kolonner og link-tabeller findes allerede.
- Ingen ændringer i RLS — vi strammer kun client-side queries.
- Ingen ændringer i andre Planner-widgets (de bruger allerede de hooks vi tidligere har opdateret).
- Ingen ændring af gruppe-/farve-logikken i `UnassignedResourcesSection.tsx`.

### Verifikation

Når man vælger sub-department "Fugt":
- Kun medarbejdere med `user_access.sub_department_id = <fugt>` vises (kun Skadeledere + Fugtteknikere → Servicemedarbejder-gruppen er tom).
- Kun biler linket via `car_sub_departments` til Fugt vises.
- Kun opgaver med `sub_department_id = <fugt>` indgår i "tildelt"-beregningen.
Når man skifter tilbage til "Alle", vises alt under hoved-afdelingen som før.
