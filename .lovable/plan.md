

## Plan: TanStack Query caching for data hooks

### Nuvaerende tilstand

- QueryClient er allerede konfigureret med `staleTime: 5 min`, `gcTime: 10 min`, `retry: 1`
- Kun 1 hook bruger `useQuery` (`useWarehouseIndicators`)
- Alle 5 hoved-hooks bruger manuelt `useState` + `useEffect` + `fetchData()`
- `invalidateQueries` bruges ingen steder
- Optimistic updates i car/warehouse bruger direkte `setCars`/`setItems`

### Hooks der konverteres

| Hook | queryKey | Kompleksitet |
|------|----------|-------------|
| `useCarData` | `['cars', isDemoMode, departmentId]` | Medium - har setCars for optimistic |
| `useEmployeeData` | `['employees', isDemoMode, departmentId]` | Medium - har haveEmployeesChanged |
| `useDutyData` | `['duties', startDateStr, endDateStr, departmentId]` | Lav |
| `useWarehouseData` | `['warehouse-items', isDemoMode, departmentId]` | Medium - har setItems for optimistic |
| `useVacationData` | `['vacations', userEmail, departmentId]` | Medium - bruger realtimeManager |

### Hooks der IKKE konverteres

- `useOptimizedAssignments` (900 linjer, ekstremt kompleks med inline CRUD, for hoej risiko)
- `useUnifiedData` (har eget cache-lag via unifiedDataService, ville skabe konflikt)
- `useAssignments` (data/) (bruges sammen med useOptimizedAssignments)

### Aendringer per fil

**1. `src/hooks/car/useCarData.ts`**

- Flyt fetch-logikken ind i en `queryFn` (ingen aendring i selve SQL/Supabase kaldene)
- Brug `useQuery` med `queryKey: ['cars', isDemoMode, selectedDepartmentId, canViewFuelCardCode]`
- `enabled: userDataLoaded && !!user` (erstat useEffect-guarden)
- Behold realtime-subscription i separat useEffect, men kald `queryClient.invalidateQueries({ queryKey: ['cars'] })` i stedet for `loadCars()`
- Eksporter `setCars` som wrapper: `(updater) => queryClient.setQueryData(['cars', ...], updater)` saa useCarActions og useCarFormState fortsat virker uden aendring
- `loading` mappes til `isLoading` fra useQuery (foerste load) - bevarer eksisterende spinners
- `fetchCars` mappes til `refetch` fra useQuery

**2. `src/hooks/employee/useEmployeeData.ts`**

- Flyt fetch-logikken ind i `queryFn`
- `queryKey: ['employees', isDemoMode, selectedDepartmentId]`
- `enabled: userDataLoaded && !!user`
- Realtime-subscription kalder `invalidateQueries` i stedet for `fetchEmployees()`
- Fjern manuelt `haveEmployeesChanged` tjek (useQuery haandterer dette via `structuralSharing`)
- Eksporter `fetchEmployees` som `refetch`

**3. `src/hooks/duty/useDutyData.ts`**

- Flyt fetch-logikken ind i `queryFn`
- `queryKey: ['duties', user?.email, startDateStr, endDateStr, selectedDepartmentId]`
- Realtime-subscription kalder `invalidateQueries`
- `isRefetching` mappes til useQuerys `isFetching && !isLoading`

**4. `src/hooks/warehouse/useWarehouseData.ts`**

- Flyt fetch-logikken ind i `queryFn`
- `queryKey: ['warehouse-items', isDemoMode, selectedDepartmentId]`
- `enabled: userDataLoaded && !!user`
- Eksporter `setItems` som wrapper: `(updater) => queryClient.setQueryData(...)` saa optimistic updates i useWarehouseActions fortsat virker
- Realtime/polling kalder `invalidateQueries`
- Behold `addLocalItem`, `updateLocalItem`, `deleteLocalItem` for demo mode

**5. `src/hooks/vacation/useVacationData.ts`**

- Flyt `fetchVacations` ind i `queryFn`
- `queryKey: ['vacations', user?.email, selectedDepartmentId]`
- `enabled: userDataLoaded && !!user`
- Realtime (via realtimeManager) og polling kalder `invalidateQueries`

**6. Mutations: `invalidateQueries` ved alle opdateringer**

Tilfoej `queryClient.invalidateQueries` efter succesfulde mutations i:

| Fil | invaliderer |
|-----|------------|
| `src/hooks/car/useCarActions.ts` | `['cars']` efter delete, toggle availability |
| `src/hooks/car/useCarFormState.ts` | `['cars']` efter create/update |
| `src/hooks/warehouse/useWarehouseActions.ts` | `['warehouse-items']` efter create/update/delete |
| `src/hooks/employee/useEmployeeActions.ts` | `['employees']` efter toggle leave, delete |
| `src/hooks/employee/useEmployeeCreation.ts` | `['employees']` efter create |
| `src/hooks/duty/useDutyActions.ts` | `['duties']` efter create/update/delete |
| `src/hooks/vacation/useVacationActions.ts` | `['vacations']` efter actions |
| `src/hooks/vacation/useVacationApprovalActions.ts` | `['vacations']` efter approve/reject |
| `src/hooks/vacation/useVacationRequestActions.ts` | `['vacations']` efter request |

### Teknisk moenter: setCars/setItems kompatibilitet

Fordi `useCarActions` og `useWarehouseActions` modtager `setCars`/`setItems` som parameter til optimistic updates, eksporterer data-hookene en wrapper-funktion:

```text
// useCarData returnerer:
setCars: (updater) => {
  queryClient.setQueryData(queryKey, (old) => {
    return typeof updater === 'function' ? updater(old || []) : updater;
  });
}
```

Dette sikrer at alle eksisterende optimistic updates (fra forrige opgave) fortsat virker uden aendringer i action-hooks.

### Sikkerhedsgarantier

- Ingen aendring i Supabase-queries (SQL forbliver identisk)
- Loading states bevares: `isLoading` (foerste load) viser spinners/skeletons
- Internationalisering paavirkes ikke (useQuery cacher data, ikke UI-rendering)
- Succes-logik uaendret i alle action-hooks
- Alle console.log og debugging bevares
- Demo mode logik forbliver identisk (flyttes bare ind i queryFn)

### Filer der aendres

| Fil | Type |
|-----|------|
| `src/hooks/car/useCarData.ts` | Konverter til useQuery |
| `src/hooks/employee/useEmployeeData.ts` | Konverter til useQuery |
| `src/hooks/duty/useDutyData.ts` | Konverter til useQuery |
| `src/hooks/warehouse/useWarehouseData.ts` | Konverter til useQuery |
| `src/hooks/vacation/useVacationData.ts` | Konverter til useQuery |
| `src/hooks/car/useCarActions.ts` | Tilfoej invalidateQueries |
| `src/hooks/car/useCarFormState.ts` | Tilfoej invalidateQueries |
| `src/hooks/warehouse/useWarehouseActions.ts` | Tilfoej invalidateQueries |
| `src/hooks/employee/useEmployeeActions.ts` | Tilfoej invalidateQueries |
| `src/hooks/employee/useEmployeeCreation.ts` | Tilfoej invalidateQueries |
| `src/hooks/duty/useDutyActions.ts` | Tilfoej invalidateQueries |
| `src/hooks/vacation/useVacationActions.ts` | Tilfoej invalidateQueries |
| `src/hooks/vacation/useVacationApprovalActions.ts` | Tilfoej invalidateQueries |
| `src/hooks/vacation/useVacationRequestActions.ts` | Tilfoej invalidateQueries |

