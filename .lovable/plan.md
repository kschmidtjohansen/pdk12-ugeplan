

## Tilpas Ugeplanen med By-filtrering, Super Admin-visning og Skadeleder-ferieadgang

### Overblik

Der er fire hovedaendringer:

1. **By-filtrering af data** -- assignments, medarbejdere, biler og ferier skal filtreres efter den valgte hovedafdeling
2. **Super Admin i personalelisten** -- vises kun i den by der matcher `home_department_id`
3. **Skadeledere ser ferieonsker** -- for medarbejdere i deres tildelte underafdelinger
4. **Sprog** -- alle nye fejlmeddelelser og labels paa dansk

---

### Del 1: Database -- Opdater RPC-funktionen `list_accessible_assignments_with_team`

**Migration**: Opdater den eksisterende RPC-funktion til at:
- Acceptere en valgfri `p_department_id UUID` parameter
- Filtrere assignments paa `a.department_id = p_department_id` (naar parameteren er sat)
- Haandtere `super_admin`-rollen paa lige fod med `administrator`

Dette sikrer at kun opgaver for den valgte by returneres fra databasen.

---

### Del 2: Frontend -- Assignments filtreret efter afdeling

**Fil**: `src/services/optimizedAssignmentService.ts`

- Opdater `fetchAllAssignments()` til at sende `selectedDepartmentId` som parameter til RPC-funktionen
- Tilfoej `departmentId` parameter til metoden

**Fil**: `src/hooks/useOptimizedAssignments.ts`

- Importere `useDepartment` og videresende `selectedDepartmentId` til `OptimizedAssignmentService.fetchAllAssignments()`
- Tilfoej `selectedDepartmentId` som dependency i `fetchAssignments` callback

---

### Del 3: Frontend -- Medarbejdere filtreret efter afdeling

**Fil**: `src/hooks/employee/useEmployeeData.ts`

- Importere `useDepartment` og bruge `selectedDepartmentId`
- For ikke-demo mode: Hent listen af `user_id`'er fra `user_access` tabellen hvor `department_id = selectedDepartmentId`, og filtrer kun de profiler der matcher
- **Super Admin undtagelse**: Inkluder altid Super Admins i personalelisten hvis deres `home_department_id` matcher den valgte afdeling (tjek via `profiles.home_department_id`)
- Tilfoej `selectedDepartmentId` som dependency

---

### Del 4: Frontend -- Biler filtreret efter afdeling

**Fil**: `src/hooks/car/useCarData.ts`

- Tjek om `cars`-tabellen har en `department_id`-kolonne
- Hvis ja: Tilfoej filter `.eq('department_id', selectedDepartmentId)` til car-query
- Hvis nej: Tilfoej `department_id` kolonne til `cars`-tabellen via migration

---

### Del 5: Frontend -- Ferier filtreret efter afdeling + Skadeleder-adgang

**Fil**: `src/services/enhancedDataFetching.ts`

- Opdater `fetchVacationsEnhanced()` til at filtrere paa `department_id` naar en afdeling er valgt

**Fil**: `src/hooks/vacation/useVacationData.ts`

- Send `selectedDepartmentId` til vacation-fetchen
- For **skadeledere**: Hent brugerens tildelte `sub_department_id`'er fra `user_access`, og vis ferier for medarbejdere i disse underafdelinger (alle statusser: pending, approved, rejected)

**Fil**: `src/hooks/vacation/useVacationSecurity.ts`

- Opdater `canViewVacation()` saa skadeledere kan se ferier for medarbejdere i deres underafdelinger

---

### Del 6: Assignments -- Gem `department_id` ved oprettelse

**Fil**: `src/hooks/useOptimizedAssignments.ts` og `src/services/optimizedAssignmentService.ts`

- Naar en ny opgave oprettes, sæt `department_id` automatisk til den aktuelt valgte afdeling fra `DepartmentContext`
- Dette sikrer at fremtidige opgaver korrekt er tilknyttet en by

---

### Del 7: Sprog

**Filer**: `src/translations/da/planner.ts`, `src/translations/da/vacation.ts`

- Tilfoej eventuelle nye valideringsfejl og labels paa dansk
- Eksempler: "Ingen afdeling valgt", "Vælg en hovedafdeling for at se data"

---

### Tekniske detaljer

**Database-aendringer**:
- Opdater RPC `list_accessible_assignments_with_team` med `p_department_id` parameter og `super_admin`-support
- Muligvis tilfoej `department_id` til `cars`-tabellen (afhaenger af nuværende skema)

**Filer der aendres**:

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| Migration SQL | NY | Opdater RPC + evt. cars.department_id |
| `src/services/optimizedAssignmentService.ts` | OPDATER | Tilfoej departmentId parameter til fetch |
| `src/hooks/useOptimizedAssignments.ts` | OPDATER | Integrer DepartmentContext |
| `src/hooks/employee/useEmployeeData.ts` | OPDATER | Filtrer medarbejdere efter afdeling + super_admin logik |
| `src/hooks/car/useCarData.ts` | OPDATER | Filtrer biler efter afdeling |
| `src/services/enhancedDataFetching.ts` | OPDATER | Filtrer ferier efter afdeling |
| `src/hooks/vacation/useVacationData.ts` | OPDATER | Departmentfiltrering + skadeleder underafdeling-adgang |
| `src/hooks/vacation/useVacationSecurity.ts` | OPDATER | Skadeleder-ferievisning |
| `src/translations/da/planner.ts` | OPDATER | Danske tekster |
| `src/translations/da/vacation.ts` | OPDATER | Danske tekster |

**Dataflow**:

```text
Login -> Vaelg by -> DepartmentContext (selectedDepartmentId)
                          |
          +---------------+---------------+
          |               |               |
    Assignments     Medarbejdere      Ferier
    (RPC filter)   (user_access)   (department_id)
          |               |               |
          |         Super Admin:          |
          |     kun hvis home_dept        |
          |     matcher valgt by     Skadeleder:
          |               |         ser alle statusser
          +-------+-------+         for egne sub_depts
                  |
            PlannerPage (ugeplanen)
```

