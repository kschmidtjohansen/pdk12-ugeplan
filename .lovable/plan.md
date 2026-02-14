

## Plan: 4 rettelser

### 1. Beskrivelse mangler i sags-dialog (scrolling problem)

**Problem:** I `AssignmentDetailsDialog.tsx` er `overflow-hidden` sat paa `DialogContent` (linje 112), men `overflow-y-auto` er kun paa den ydre flex container (linje 145). Paa mobil bliver ScrollArea inde i venstre kolonne begrænset af den ydre containers hoejde, og beskrivelsen ender under fold uden mulighed for at scrolle ned til den.

**Loesning:** Fjern `overflow-hidden` fra `DialogContent` og sikr at `ScrollArea` i venstre kolonne faar en eksplicit `max-height` saa den altid er scrollbar. Derudover tilfoej `overflow-y-auto` paa selve `DialogContent` som fallback.

**Fil:** `src/components/Dashboard/AssignmentDetailsDialog.tsx`
- Linje 112: AEndr `overflow-hidden` til `overflow-y-auto` paa `DialogContent`
- Sikr at den indre `ScrollArea` (linje 148) fungerer korrekt med flex layout

---

### 2. Braendstofkortkode viser "PENDING_ADMIN_APPROVAL"

**Problem:** I `carSecurityService.ts` (linje 106-108) saettes `fuel_card_code` til `'PENDING_ADMIN_APPROVAL'` naar `can_view_fuel_codes` RPC returnerer false. Men kun administratorer kan oprette biler (CarsPage kontrollerer `isAdmin`), saa denne fallback burde aldrig rammes. Problemet er at `can_view_fuel_codes` RPC'en muligvis returnerer false pga. timing eller en RLS-fejl, og saa gemmes "PENDING_ADMIN_APPROVAL" som den faktiske vaerdi i databasen.

**Loesning:** Fjern PENDING_ADMIN_APPROVAL logikken. Da kun admins kan oprette biler, skal fuel_card_code altid vaere paaklævet. Hvis `canViewFuel` returnerer false, brug den medfølgende `canViewFuelCardCode` parameter (som allerede er `isAdmin`) som fallback:

**Fil:** `src/services/carSecurityService.ts`
- Linje 100-109: AEndr logikken saa fuel_card_code altid inkluderes naar `canViewFuelCardCode` parameter er true (uanset hvad RPC siger). Fjern "PENDING_ADMIN_APPROVAL" placeholder helt.
- Hvis hverken RPC eller canViewFuelCardCode er true, saet fuel_card_code til tom streng.

---

### 3. Pull-to-refresh paa biler hopper til forkert underafdeling + tom tilstand

**Problem:** CarsPage bruger ikke `PullToRefresh`, men mobil-swipe adfaerden kan trigge en re-render der nulstiller konteksten. Selve problemet er at `queryKey` i `useCarData.ts` inkluderer `selectedSubDepartmentId`, saa naar data genindlæses forbliver den korrekte underafdeling. Det reelle problem er sandsynligvis at en anden komponent (f.eks. DepartmentSelector eller MainLayout) nulstiller `selectedSubDepartmentId` ved re-render.

Derudover viser CarsPage ikke en "ingen biler" besked naar listen er tom.

**Loesning:**
- **`src/pages/CarsPage.tsx`:** Tilfoej en tom-tilstand (empty state) naar `cars.length === 0` efter loading, der viser "Der er ingen biler tilknyttet denne underafdeling" med et bil-ikon.
- **`src/components/Cars/CarsList.tsx`:** Tilfoej en empty state komponent naar `sortedCars.length === 0`.
- Undersoeg om pull-to-refresh problemet skyldes at siden mangler `PullToRefresh` wrapping - tilfoej det med `fetchCars` som refresh handler.

**Filer:**
| Fil | AEndring |
|-----|---------|
| `src/components/Cars/CarsList.tsx` | Tilfoej empty state naar ingen biler |
| `src/pages/CarsPage.tsx` | Wrap med PullToRefresh, brug fetchCars som handler |

---

### 4. Ferie-medarbejderliste skal filtreres paa underafdeling

**Problem:** `AdminVacationFormDialog` bruger `useEmployees()` hook som henter alle medarbejdere i afdelingen (filtreret paa `department_id` via `user_access`). Den filtrerer ikke paa `sub_department_id`. Saa alle medarbejdere i hovedafdelingen vises uanset hvilken underafdeling man er i.

**Loesning:** Filtrer medarbejderlisten i `AdminVacationFormDialog` baseret paa den aktive `selectedSubDepartmentId`. Hent `user_access` data med sub_department_id match og filtrer `availableEmployees` derefter.

**Fil:** `src/components/Vacation/AdminVacationFormDialog.tsx`
- Importer `useDepartment` fra `DepartmentContext`
- Hent `selectedSubDepartmentId` og `selectedDepartmentId`
- Naar `selectedSubDepartmentId` er sat, hent `user_access` records med baade `department_id` og `sub_department_id` match, og filtrer `employees` listen saa kun medarbejdere tilknyttet den aktive underafdeling vises
- Naar ingen underafdeling er valgt, vis alle medarbejdere i afdelingen (nuvaerende adfaerd)

---

### Tekniske detaljer

#### AssignmentDetailsDialog - scroll fix:
Linje 112 aendres fra:
```
max-h-[95dvh] overflow-hidden flex flex-col p-0
```
til:
```
max-h-[95dvh] overflow-y-auto flex flex-col p-0
```

#### CarSecurityService - fjern PENDING_ADMIN_APPROVAL:
```tsx
// Erstat linje 100-109 med:
if (canViewFuelCardCode && carData.fuel_card_code) {
  insertData.fuel_card_code = carData.fuel_card_code;
} else {
  insertData.fuel_card_code = carData.fuel_card_code || '';
}
```

#### CarsList - empty state:
```tsx
if (sortedCars.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Car className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <p className="text-muted-foreground">{t('cars.noCarsInSubDepartment')}</p>
    </div>
  );
}
```

#### AdminVacationFormDialog - sub-department filter:
```tsx
const { selectedSubDepartmentId, selectedDepartmentId } = useDepartment();

useEffect(() => {
  if (employees && selectedSubDepartmentId) {
    // Fetch user_access for this sub-department
    supabase.from('user_access')
      .select('user_id')
      .eq('department_id', selectedDepartmentId)
      .eq('sub_department_id', selectedSubDepartmentId)
      .then(({ data }) => {
        const subDeptUserIds = new Set((data || []).map(a => a.user_id));
        const filtered = employees.filter(emp => 
          subDeptUserIds.has(emp.id) && emp.id !== user?.id
        );
        setAvailableEmployees(filtered);
      });
  } else {
    const filtered = employees.filter(emp => emp.id !== user?.id);
    setAvailableEmployees(filtered);
  }
}, [employees, user?.id, selectedSubDepartmentId, selectedDepartmentId]);
```

### Oversaettelser der tilføjes

**`src/translations/da/cars.ts`:**
```
noCarsInSubDepartment: "Der er ingen biler tilknyttet denne underafdeling",
```

**`src/translations/en/cars.ts`:**
```
noCarsInSubDepartment: "No cars assigned to this sub-department",
```

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Fix scroll - aendr overflow-hidden til overflow-y-auto |
| `src/services/carSecurityService.ts` | Fjern PENDING_ADMIN_APPROVAL, brug canViewFuelCardCode parameter |
| `src/components/Cars/CarsList.tsx` | Tilfoej empty state for ingen biler |
| `src/pages/CarsPage.tsx` | Wrap med PullToRefresh |
| `src/components/Vacation/AdminVacationFormDialog.tsx` | Filtrer medarbejdere paa sub_department_id |
| `src/translations/da/cars.ts` | Tilfoej noCarsInSubDepartment |
| `src/translations/en/cars.ts` | Tilfoej noCarsInSubDepartment |
