## Afdelingsvælger i Topbar + Data-synkronisering + "12-Fredericia" som standard

### Del 0: Omdoeb Fredericia til "12-Fredericia" i databasen

En SQL-migration der opdaterer det eksisterende department-navn:

```sql
UPDATE public.departments SET name = '12-Fredericia' WHERE name = 'Fredericia';
```

---

### Del 1: Ny komponent - DepartmentSelector

**Ny fil**: `src/components/Layout/NavComponents/DepartmentSelector.tsx`

En dropdown-komponent til topnavigationen:

- Viser den aktuelle afdelings navn med et Building2-ikon
- For **super_admin**: Henter alle afdelinger fra `departments`-tabellen
- For **andre roller**: Henter kun afdelinger fra brugerens `user_access`-raekker
- Ved skift ryddes cache og data genindlaeses
- Alt UI paa dansk

---

### Del 2: Udvid DepartmentContext

**Fil**: `src/context/DepartmentContext.tsx`

Tilfoejelser:

- `userDepartments` state: afdelinger brugeren har adgang til (baseret paa rolle)
- Fetch-logik der koerer naar brugeren er logget ind:
  - super_admin: hent alle fra `departments`
  - andre: hent kun fra `user_access` JOIN `departments`
- `switchDepartment(id)` funktion der rydder `unifiedDataService` cache og opdaterer `selectedDepartmentId`
- Auto-select: Hvis kun een afdeling er tilgaengelig, vaelg den automatisk

---

### Del 3: Integrer DepartmentSelector i navigation

**TopNavbar.tsx**: Tilfoej `DepartmentSelector` i desktop-omraadet mellem logo og navigation-items.

**MobileNavigation.tsx**: Tilfoej `DepartmentSelector` oeverst i mobilmenuen.

---

### Del 4: Data-synkronisering med afdelingsfilter

**unifiedDataService.ts**:

- Tilfoej valgfrit `departmentId` parameter til `fetchEmployees()`, `fetchAssignments()`, `fetchCars()`
- Naar `departmentId` er sat, tilfoej `.eq('department_id', departmentId)` til queries
- Employees filtreres via `home_department_id` i stedet
- Inkluder `departmentId` i cache-noeglen

**useUnifiedData.ts**:

- Importer `useDepartment` og brug `selectedDepartmentId`
- Send `departmentId` til alle service-kald
- Tilfoej `selectedDepartmentId` som dependency i useEffect

**assignmentService.ts**:

- Tilfoej valgfrit `departmentId` filter til `fetchAllPublishedAssignments()` og `fetchUserAssignments()`
- Naar sat, tilfoej `.eq('department_id', departmentId)`

**useVacationData.ts**:

- Tilfoej `useDepartment` og filtrer med `.eq('department_id', selectedDepartmentId)` i enhancedDataFetching-kaldet

**useDutyData.ts**:

- Tilfoej `useDepartment` og filtrer med `.eq('department_id', selectedDepartmentId)` i duty-queryen

---

### Del 5: Oversaettelser

**da/navigation.ts**: Tilfoej `department: "Afdeling"`, `selectDepartment: "Vælg afdeling"`, `allDepartments: "Alle afdelinger"`, `switchDepartment: "Skift afdeling"`

**en/navigation.ts**: Tilfoej tilsvarende engelske tekster

---

### Filliste


| Fil                                    | Type    | AEndring                                                       |
| -------------------------------------- | ------- | -------------------------------------------------------------- |
| SQL migration                          | NY      | Omdoeb "Fredericia" til "12-Fredericia"                        |
| `NavComponents/DepartmentSelector.tsx` | NY      | Dropdown-komponent                                             |
| `DepartmentContext.tsx`                | OPDATER | Tilfoej userDepartments, rolle-baseret fetch, switchDepartment |
| `TopNavbar.tsx`                        | OPDATER | Tilfoej DepartmentSelector i desktop                           |
| `MobileNavigation.tsx`                 | OPDATER | Tilfoej DepartmentSelector i mobilmenu                         |
| `unifiedDataService.ts`                | OPDATER | departmentId-filter paa alle queries                           |
| `useUnifiedData.ts`                    | OPDATER | Brug selectedDepartmentId fra context                          |
| `assignmentService.ts`                 | OPDATER | departmentId-filter                                            |
| `useVacationData.ts`                   | OPDATER | departmentId-filter                                            |
| `useDutyData.ts`                       | OPDATER | departmentId-filter                                            |
| `da/navigation.ts`                     | OPDATER | Nye afdelingstekster                                           |
| `en/navigation.ts`                     | OPDATER | Nye afdelingstekster                                           |
