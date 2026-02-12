

## 10 rettelser: Demo-toast, super admin funktioner, mobil-fixes, lager og biler

### 1. Fjern dobbelt toast ved rolleskift

**Problem:** Baade `DemoRoleSwitcher.tsx` (linje 47-50) og `AuthContext.tsx` (linje 630-633) viser en toast naar man skifter rolle.

**Fil: `src/components/Demo/DemoRoleSwitcher.tsx`**
- Fjern toast-kaldet i `handleRoleSwitch` (linje 47-50). Behold kun den toast der vises fra `AuthContext.handleSetDemoRole`.

### 2. Super Admin viser alle funktioner i demo

**Problem:** Naar man skifter til super_admin ser man ikke Hovedafdelinger-fanen i Admin fordi `isSuperAdmin` tjekker `user?.role` i stedet for den effektive demo-rolle.

**Fil: `src/pages/AdminPage.tsx`**
- Importér `useAuth` og brug `demoRole` / `isDemoMode` til at bestemme `isSuperAdmin`:
  ```
  const effectiveRole = isDemoMode && demoRole ? demoRole : user?.role;
  const isSuperAdmin = effectiveRole === 'super_admin';
  const isAdmin = effectiveRole === 'administrator' || isSuperAdmin;
  ```

### 3. Fix knapper i EmployeesPage paa mobil

**Fil: `src/pages/EmployeesPage.tsx`**
- Linje 101-124: AEndr header-layoutet til `flex-col sm:flex-row` saa titel og knapper stacker paa mobil
- Goer knapperne mindre paa mobil med responsive klasser

### 4. Fix lager-opdateringsfejl i demo mode

**Problem:** `useWarehouseActions` forsoeeger altid at lave database-kald, ogsaa i demo mode.

**Fil: `src/hooks/warehouse/useWarehouseActions.ts`**
- I `updateItem` og `deleteItem`: Tilfoej en demo-check i starten der virtualiserer operationen (vis success-toast og kald `onSuccess` uden database-kald)
- I `createItem`: Samme demo-virtualisering

### 5. Tilfoej Lokation-administration under Admin (ny fane)

**Fil: `src/pages/AdminPage.tsx`**
- Tilfoej en ny fane "Lokationer" (kun synlig naar lager er aktiveret)
- Fanen viser en liste over lokationer (hal_1, sort_hal osv.) med mulighed for at tilfoeje/redigere/slette

**Fil: `src/components/Admin/LocationManagement.tsx`** (NY)
- Simpel komponent der viser og administrerer lokationer for lager
- Foreloebigt baseret paa de eksisterende `hall`-vaerdier men med mulighed for at redigere navne

Bemærk: Da `hall`-feltet i databasen er en fast enum ('hal_1' | 'sort_hal'), vil den initielle implementation vise de eksisterende lokationer med mulighed for at omdoebe dem via oversaettelser. Fuld dynamisk lokationsstyring kraever en ny database-tabel.

### 6. Ret "Hal" til "Lokation" overalt

**Fil: `src/translations/da/warehouse.ts`**
- AEndr `fields.hall: "Hal"` til `fields.hall: "Lokation"`
- AEndr `placeholders.selectHall` til `"Vaelg lokation..."`
- AEndr `halls.hal1` til `"Hal 1"` (beholder navn)
- AEndr `halls.sortHal` til `"Sort Hal"` (beholder navn)

**Fil: `src/translations/en/warehouse.ts`**
- AEndr `fields.hall: "Hall"` til `fields.hall: "Location"`
- AEndr `placeholders.selectHall` til `"Select location..."`

### 7. Klikbart bil-card paa mobil (vis traekkapacitet og noter)

**Fil: `src/components/Cars/MobileCarCard.tsx`**
- Tilfoej en expandable/collapsible sektion der vises naar man trykker paa kortet
- I den udvidede sektion: vis traekkapacitet med/uden bremser, totalvaegt og noter
- Brug Collapsible fra Radix eller simpel state-toggle

### 8. Ret biler undertitel

**Fil: `src/translations/da/cars.ts`**
- AEndr `pageDescription` fra `'Administrer din koeretoejsflaade og tilgaengelighed'` til `'Ret biler og deres tilgængelighed'`

**Fil: `src/translations/en/cars.ts`**
- AEndr `pageDescription` til `'Edit cars and their availability'`

### 9. Fix dobbelt header paa Vagt-siden i mobil

**Problem:** `DutyPage` er wrappet i `MainLayout` som allerede giver en header/navbar, men siden har ogsaa sin egen header.

**Fil: `src/pages/DutyPage.tsx`**
- Fjern `MainLayout`-wrapperen da alle andre sider (Employees, Cars, Warehouse) ikke bruger den direkte - de faar den via routing
- ELLER: Tjek om ruten allerede wrapper i MainLayout - hvis ja, fjern den fra DutyPage

### 10. Fix vagt undertitel scaling paa mobil

**Fil: `src/pages/DutyPage.tsx`**
- Linje 119-148: AEndr header-layoutet til `flex-col sm:flex-row` med `gap-4`
- Goer knapperne responsive med `flex-wrap`

---

### Tekniske detaljer

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| `src/components/Demo/DemoRoleSwitcher.tsx` | OPDATER | Fjern dobbelt toast |
| `src/pages/AdminPage.tsx` | OPDATER | Brug effektiv rolle for super_admin + ny Lokation-fane |
| `src/pages/EmployeesPage.tsx` | OPDATER | Responsive header/knapper |
| `src/hooks/warehouse/useWarehouseActions.ts` | OPDATER | Virtualiser demo-operationer |
| `src/components/Admin/LocationManagement.tsx` | NY | Lokationsstyring for lager |
| `src/translations/da/warehouse.ts` | OPDATER | Hal -> Lokation |
| `src/translations/en/warehouse.ts` | OPDATER | Hall -> Location |
| `src/components/Cars/MobileCarCard.tsx` | OPDATER | Klikbart card med detaljer |
| `src/translations/da/cars.ts` | OPDATER | Ny undertitel |
| `src/translations/en/cars.ts` | OPDATER | Ny undertitel |
| `src/pages/DutyPage.tsx` | OPDATER | Fjern MainLayout wrapper + responsive header |

