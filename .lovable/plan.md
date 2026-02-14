

## Plan: 3 rettelser

### 1. Underafdelings-dropdown gemmes bag navigationsmenuen

**Problem:** DepartmentSelector med underafdelinger fylder for meget horisontalt og overlapper den centrerede navigationsmenu. Navigationen er positioneret med `absolute left-1/2 transform -translate-x-1/2` i `TopNavbar.tsx` (linje 148), og DepartmentSelector skubber ind i den.

**Loesning:** Flytte underafdelings-valget ind under samme dropdown som hovedafdelingen i stedet for at vise det som et separat element ved siden af. Naar man aabner dropdown'en vises foerst underafdelinger (da det er det man oftest skifter), derefter en separator, og saa hovedafdelinger. Titlen i knappen viser "Afd. 02 > Fugt & Skimmel" kompakt.

**Fil:** `src/components/Layout/NavComponents/DepartmentSelector.tsx`

**AEndring:** Redesign til en enkelt dropdown-knap der viser baade afdeling og underafdeling. Dropdown-indholdet har to sektioner adskilt af separator: underafdelinger oeverst, hovedafdelinger nederst. Dette eliminerer horisontalt pladsforbrug fuldstaendigt.

---

### 2. Fejl ved oprettelse af bil - manglende department_id og sub_department_id

**Problem:** I `CarSecurityService.createCar()` (linje 86-97) inkluderes hverken `department_id` eller `sub_department_id` i insert-data. Databasen kraever sandsynligvis department_id via RLS-policies. Desuden sender `useCarData.createCar()` ikke department/sub-department info videre.

**Aendringer:**
- **`src/services/carSecurityService.ts`:** Tilfoej `department_id` og `sub_department_id` til insertData i `createCar` metoden. Tilfoej ogsaa til `updateCar`.
- **`src/hooks/car/useCarData.ts`:** Send `selectedDepartmentId` og `selectedSubDepartmentId` med naar `CarSecurityService.createCar` kaldes.
- **`src/components/Cars/CarFormDialog.tsx`:** Tilfoej mulighed for at vaelge en eller flere underafdelinger (multi-select checkboxes) naar der er aktive underafdelinger. Vis kun dette felt naar underafdelinger eksisterer.
- **`src/components/Cars/types.ts`:** Tilfoej `sub_department_ids?: string[]` til CarFormData for multi-select support (da en bil kan tilhoere flere underafdelinger bruges en join-tabel eller array).

**Samme princip for lager:**
- **`src/hooks/warehouse/useWarehouseData.ts`:** Send `selectedDepartmentId` og `selectedSubDepartmentId` med ved oprettelse.
- **`src/components/Warehouse/WarehouseFormDialog.tsx`:** Tilfoej underafdelings-vaelger.

---

### 3. Fridage (vacations) skal filtreres paa underafdeling

**Problem:** `useVacationData.ts` filtrerer kun paa `selectedDepartmentId`, ikke `selectedSubDepartmentId`. Oprettelse af fridage inkluderer heller ikke `sub_department_id`. Skadeledere skal kun se fridage i deres tilknyttede underafdelinger, mens administratorer ser alle.

**Aendringer:**
- **`src/hooks/vacation/useVacationData.ts`:** Tilfoej `selectedSubDepartmentId` fra `useDepartment()` til queryKey og send det med til `fetchVacationsEnhanced`.
- **`src/services/enhancedDataFetching.ts`:** Udvid `fetchVacationsEnhanced` til at acceptere `subDepartmentId` parameter og tilfoej `.eq('sub_department_id', subDepartmentId)` filter naar det er sat (for skadeledere). Administratorer ser alle fridage i afdelingen.
- **`src/hooks/vacation/useVacationActions.ts`:** Tilfoej `sub_department_id` og `department_id` til vacation insert-data ved oprettelse.
- **RLS-opdatering:** Vacations-tabellen har allerede `sub_department_id` kolonne (fra databaseskemaet). Ingen schema-migration nødvendig, men filtrering skal ske i applikationslaget baseret paa brugerens rolle.

---

### Tekniske detaljer

#### DepartmentSelector.tsx - enkelt dropdown:
```tsx
// En knap: "Afd. 02 > Fugt & Skimmel ▾"
// Dropdown indhold:
// -- Underafdelinger --
// ✓ Fugt & Skimmel
//   Løsøre
// ─────────────────
// -- Afdelinger --
//   02 - Afdeling
// ✓ 03 - Afdeling
```

#### CarSecurityService.createCar - tilfoej department:
```tsx
const insertData: any = {
  ...eksisterende felter,
  department_id: carData.department_id || null,
  sub_department_id: carData.sub_department_id || null,
};
```

#### useVacationData.ts - sub_department filter:
```tsx
const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();
const queryKey = ['vacations', user?.email, selectedDepartmentId, selectedSubDepartmentId];

const vacationResult = await enhancedDataFetching.fetchVacationsEnhanced(
  user?.email, selectedDepartmentId, selectedSubDepartmentId
);
```

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/Layout/NavComponents/DepartmentSelector.tsx` | Redesign til enkelt dropdown med begge sektioner |
| `src/services/carSecurityService.ts` | Tilfoej department_id + sub_department_id til create/update |
| `src/hooks/car/useCarData.ts` | Send department-info med til createCar |
| `src/components/Cars/CarFormDialog.tsx` | Underafdelings-vaelger (checkboxes) |
| `src/components/Cars/types.ts` | sub_department_id i CarFormData |
| `src/hooks/warehouse/useWarehouseData.ts` | Send department-info med |
| `src/components/Warehouse/WarehouseFormDialog.tsx` | Underafdelings-vaelger |
| `src/hooks/vacation/useVacationData.ts` | Tilfoej sub_department_id filtrering |
| `src/hooks/vacation/useVacationActions.ts` | Send sub_department_id + department_id med ved oprettelse |
| `src/services/enhancedDataFetching.ts` | Udvid fetchVacationsEnhanced med subDepartmentId parameter |

