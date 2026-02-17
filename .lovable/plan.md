

## Gennemgribende rettelse af afdelingsfiltrering (Multi-Tenant Isolation)

### Problem
Flere moduler henter data FOER `selectedDepartmentId` er klar, eller bruger `.or('department_id.is.null')` som laekker data fra andre afdelinger. Her er status per modul:

| Modul | `enabled` venter paa dept? | Filtrerer paa dept? | NULL-laek? |
|-------|---------------------------|---------------------|------------|
| Medarbejdere | Nej | Ja (via user_access) | Nej |
| Biler | Ja (allerede rettet) | Ja | Nej |
| Lager | Nej | Ja | Nej |
| Opgaver | Nej | Ja (via RPC) | Nej |
| Ferie | Nej | Ja, men med NULL-laek | Ja |
| Vagter | Nej | Ja, men med NULL-laek | Ja |

### Aendringer

#### 1. `src/hooks/employee/useEmployeeData.ts` -- Vent paa afdelingsvalg
Linje 164: Aendr `enabled`-betingelsen:
```text
// Foer:
enabled: userDataLoaded && !!user,

// Efter:
enabled: userDataLoaded && !!user && (isDemoMode || !!selectedDepartmentId),
```

#### 2. `src/hooks/warehouse/useWarehouseData.ts` -- Vent paa afdelingsvalg
Linje 49: Aendr `enabled`-betingelsen:
```text
// Foer:
enabled: userDataLoaded && !!user,

// Efter:
enabled: userDataLoaded && !!user && (isDemoMode || !!selectedDepartmentId),
```

#### 3. `src/hooks/useOptimizedAssignments.ts` -- Vent paa afdelingsvalg
Linje 171: Udvid `enabled`-betingelsen:
```text
// Foer:
enabled: authReady && isAuthenticated && !!user?.id && !!user?.role,

// Efter:
enabled: authReady && isAuthenticated && !!user?.id && !!user?.role && (user?.email === 'test@polygongroup.com' || !!selectedDepartmentId),
```

#### 4. `src/hooks/vacation/useVacationData.ts` -- Vent paa afdelingsvalg
Linje 98: Aendr `enabled`-betingelsen:
```text
// Foer:
enabled: userDataLoaded && !!user,

// Efter:
enabled: userDataLoaded && !!user && (isDemoMode || !!selectedDepartmentId),
```

#### 5. `src/hooks/duty/useDutyData.ts` -- Vent paa afdelingsvalg
Linje 93: Aendr `enabled`-betingelsen:
```text
// Foer:
enabled: !!user,

// Efter:
enabled: !!user && (isDemoMode || !!selectedDepartmentId),
```
OBS: `isDemoMode` variablen er deklareret inde i `fetchDutiesFn`, saa den skal ogsaa deklareres paa hook-niveau (den findes allerede via `useAuth`).

#### 6. `src/services/enhancedDataFetching.ts` -- Fjern NULL-laek paa ferie
Linje 245-251: Fjern `.or()` med `department_id.is.null` og brug streng filtrering:
```text
// Foer:
if (departmentId) {
  query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
}
if (subDepartmentId) {
  query = query.or(`sub_department_id.eq.${subDepartmentId},sub_department_id.is.null`);
}

// Efter:
if (departmentId) {
  query = query.eq('department_id', departmentId);
}
if (subDepartmentId) {
  query = query.eq('sub_department_id', subDepartmentId);
}
```

#### 7. `src/hooks/duty/useDutyData.ts` -- Fjern NULL-laek paa vagter
Linje 67: Fjern `.or()` med `department_id.is.null`:
```text
// Foer:
query = query.or(`department_id.eq.${selectedDepartmentId},department_id.is.null`);

// Efter:
query = query.eq('department_id', selectedDepartmentId);
```

#### 8. `CHANGELOG.md` -- Dokumenter rettelsen

Tilfoej entry der beskriver den gennemgribende multi-tenant isolering.

---

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/hooks/employee/useEmployeeData.ts` | Tilfoej `selectedDepartmentId` til `enabled` |
| `src/hooks/warehouse/useWarehouseData.ts` | Tilfoej `selectedDepartmentId` til `enabled` |
| `src/hooks/useOptimizedAssignments.ts` | Tilfoej `selectedDepartmentId` til `enabled` |
| `src/hooks/vacation/useVacationData.ts` | Tilfoej `selectedDepartmentId` til `enabled` |
| `src/hooks/duty/useDutyData.ts` | Tilfoej `selectedDepartmentId` til `enabled` + fjern NULL-laek |
| `src/services/enhancedDataFetching.ts` | Fjern NULL-laek paa ferie-filtrering |
| `CHANGELOG.md` | Dokumenter aendringerne |

### Moduler der allerede er korrekte (ingen aendring noedvendig)

- **Biler**: `enabled`-betingelsen blev rettet i forrige iteration. Streng `department_id` filtrering er paa plads.
- **Lager mutations** (`useWarehouseActions.ts`): Saetter allerede `department_id` og `sub_department_id` korrekt ved oprettelse.
- **Bil mutations** (`useCarData.ts`): Saetter allerede `department_id` korrekt ved oprettelse.
- **Opgave mutations** (`optimizedAssignmentService.ts`): Bruger allerede RPC med `p_department_id` og `p_sub_department_id`.

### Kvalitetstjek
- Alle queries venter paa at en afdeling er valgt foer de koerer
- Ingen data laekker via `department_id IS NULL` undtagelser
- Demo-tilstand fungerer fortsat (bruger sin egen logik)
- UI opdaterer sig oejeblikkeligt ved afdelingsskift (query keys inkluderer department ID)
- Oprettelse af nye poster arver automatisk den aktive afdelings ID

