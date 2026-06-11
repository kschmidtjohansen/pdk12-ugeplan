## Mål

Når en bruger har valgt en underafdeling (f.eks. "Fugt"), skal **kun** data tilknyttet den underafdeling være synlig — for alle roller, inkl. admin/skadeleder. Data uden `sub_department_id` skjules i underafdelings-visning og vises kun i "Alle".

## Omfang

1. **Opgaver** — strikt filter på `sub_department_id`
2. **Biler** — strikt filter via `car_sub_departments`
3. **Medarbejdere** — strikt filter via `user_access.sub_department_id` (felt sættes på medarbejderen i medarbejder-redigering)

Lager, ferie og vagter holdes uden for denne ændring.

## Ændringer

### 1. Medarbejder-tilknytning (UI)

- Tilføj felt **"Underafdeling"** i medarbejder-redigeringsdialogen (dropdown med underafdelinger fra valgt afdeling + "Ingen").
- Ved gem opdateres `user_access.sub_department_id` for den valgte (afdeling, bruger)-række.
- Ingen ændringer i underafdelings-dialogen for medarbejdere (biler forbliver der som i dag).

### 2. Strikt filtrering ved valgt underafdeling

Når `selectedSubDepartmentId` er sat (gælder alle roller, super_admin inkluderet):

- **Opgaver** (`useOptimizedAssignments` + `OptimizedAssignmentService`): `.eq('sub_department_id', selectedSubDepartmentId)` — fjern enhver fallback til `IS NULL`.
- **Biler** (`CarSecurityService.fetchCars`): hent kun `car_id`'er fra `car_sub_departments` for denne underafdeling og brug `.in('id', carIds)`. Fjern `OR sub_department_id.is.null` og fjern fallback "hvis tom, vis alle".
- **Medarbejdere** (`useEmployeeData`): join på `user_access` og filtrér `sub_department_id = selectedSubDepartmentId`. Når intet er valgt, behold nuværende afdelings-filter.

Når `selectedSubDepartmentId` er `null` ("Alle"): uændret nuværende afdelings-filtrering.

### 3. Dashboard

`useDashboardMetrics` arver automatisk de filtrerede hooks ovenfor — ingen separat ændring nødvendig, men verificer at `EmployeeAvailabilityDialog` også respekterer underafdelingen.

### 4. Backend / RLS

Ingen schema-ændringer nødvendige — kolonnerne `sub_department_id` findes allerede på `assignments`, `cars`, `user_access`, og `car_sub_departments` link-tabellen er på plads. RLS forbliver uændret; filtreringen er klient-side via eksisterende multi-tenant kontekst.

### 5. Dokumentation

- `CHANGELOG.md`: ny entry der beskriver strikt isolation.
- `docs/implementation-plan/tasks.md`: marker som leveret.
- Opdater memory `mem://features/department-system` med den strikte regel: "Sub-dept valgt ⇒ ingen fallback, ingen `IS NULL`-leak, gælder alle roller."

## Tekniske detaljer (filer)

- `src/hooks/useOptimizedAssignments.ts` + `src/services/optimizedAssignmentService.ts` — tilføj sub-dept filter i alle fetch-varianter
- `src/services/carSecurityService.ts` — omskriv sub-dept gren (fjern OR/fallback)
- `src/hooks/employee/useEmployeeData.ts` — join `user_access` med sub-dept filter
- `src/components/Employees/EmployeeFormDialog.tsx` (eller tilsvarende) — nyt felt + gem-logik
- `CHANGELOG.md`, `docs/implementation-plan/tasks.md`

## Migrering af eksisterende data

Ingen automatisk migrering. Eksisterende opgaver/biler/medarbejdere uden `sub_department_id` bliver usynlige i underafdelings-visningen indtil admin tildeler dem manuelt — de er stadig synlige i "Alle".
