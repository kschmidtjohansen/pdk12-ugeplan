
## Fase 9c: Demo-data afdelingsisolering

### Problem
Demo-schemaets tabeller (`assignments`, `profiles`, `cars`, `warehouse_items`, `vacations`, `on_call_duties`) har ingen `department_id`-kolonne. Alle demo-data returneres derfor ufiltreret, uanset hvilken afdeling der er valgt i UI'et.

### Loesning
Definer en konstant `DEMO_HOME_DEPARTMENT_ID = '8c542620-9156-4155-b686-564b14a4ca62'` (12 - Fredericia). I alle hooks der haandterer demo-mode, tilfoej et tjek: hvis `selectedDepartmentId` er sat og IKKE matcher `DEMO_HOME_DEPARTMENT_ID`, returner en tom liste. Paa den maade "tilhoerer" al demo-data afdeling 12, og skift til afdeling 02 viser korrekt ingen data.

### Beroorte filer

| Fil | Aendring |
|-----|---------|
| `src/constants/demo.ts` (ny) | Eksporter `DEMO_HOME_DEPARTMENT_ID` |
| `src/hooks/employee/useEmployeeData.ts` | I demo-blokken (linje 26-81): returner `[]` hvis `selectedDepartmentId` ikke matcher demo-afdelingen |
| `src/hooks/car/useCarData.ts` | I demo-blokken (linje 26-46): returner `[]` hvis forkert afdeling |
| `src/hooks/vacation/useVacationData.ts` | Videregiv department-check til `fetchVacationsFn` |
| `src/services/enhancedDataFetching.ts` | I `fetchVacationsEnhanced` demo-blokken (linje 205-216): returner tom liste hvis forkert afdeling |
| `src/hooks/warehouse/useWarehouseData.ts` | I demo-blokken (linje 13-18): returner `[]` hvis forkert afdeling |
| `src/hooks/duty/useDutyData.ts` | I demo-blokken (linje 23-46): returner `[]` hvis forkert afdeling |
| `src/services/optimizedAssignmentService.ts` | I `fetchAllAssignments` demo-blok (linje 287-306): returner `[]` hvis forkert afdeling. Tilsvarende for `fetchAllPublishedAssignments`, `fetchUnpublishedAssignments`, `fetchUserAssignments` |
| `src/hooks/data/useUnifiedData.ts` | I demo-filtreringen: returner tomme lister for forkert afdeling |
| `CHANGELOG.md` | Dokumenter aendringerne |
| `docs/implementation-plan/tasks.md` | Tilfoej Fase 9c markeret [x] |

### Teknisk implementering

Hvert hook faar et enkelt tjek i toppen af sin demo-blok:

```text
if (isDemoMode && selectedDepartmentId && selectedDepartmentId !== DEMO_HOME_DEPARTMENT_ID) {
  return [];  // Demo-data tilhoerer kun dept 12
}
```

Query-keys inkluderer allerede `selectedDepartmentId`, saa TanStack Query haandterer automatisk cache-invalidering ved afdelingsskift.

### Oprettelse af data i demo-mode
Naar demo-brugeren opretter nye data (opgaver, biler osv.) mens dept 12 er valgt, fungerer det som hidtil (sessionStorage). Hvis brugeren staar paa dept 02, vil der ikke vaere nogen data synlig, men oprettelsesfunktioner er stadig tilgaengelige (de gemmer i sessionStorage og vises naar man skifter tilbage til dept 12).

### Kvalitetstjek (jf. Knowledge)
- Ingen database-aendringer - kun klient-side filtrering
- Ingen foelsom logging tilfojet
- Overholder tekniske specifikationer og UI-guidelines
- Alle aendringer dokumenteres i CHANGELOG.md og implementation-plan
