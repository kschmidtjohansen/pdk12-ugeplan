

## Tre forbedringer: Pull-to-refresh, Realtime-notifikationsbar og afdelingsfiltrering af biler/lager

### Del 1: Global Pull-to-Refresh paa mobil

Der eksisterer allerede en `PullToRefresh`-komponent i `src/components/shared/PullToRefresh.tsx`. I stedet for at tilfoeje den individuelt paa hver side, integreres den i `MainLayout.tsx`, saa alle sider automatisk faar pull-to-refresh paa mobil.

**Fil: `src/components/Layout/MainLayout.tsx`**
- Wrap `{children}` i `<PullToRefresh onRefresh={...}>` inde i `<main>`
- `onRefresh` kalder `window.location.reload()` for at genindlaese hele siden
- Komponenten er allerede konfigureret til kun at aktiveres paa mobil

---

### Del 2: Realtime-aendringsbar naar andre brugere laver aendringer

Opret en ny komponent der lytter paa Supabase Realtime for aendringer paa de vigtigste tabeller. Naar en aendring registreres, vises en fast bar oeverst paa siden.

**Ny fil: `src/components/shared/RealtimeChangeNotifier.tsx`**
- Abonner paa `postgres_changes` for tabellerne: `assignments`, `cars`, `warehouse_items`, `profiles`, `duty_assignments`, `vacation_requests`
- Naar en aendring modtages, vis en blaa/primaer bar fixed oeverst (under navbar) med tekst: "Der er sket aendringer. Opdater siden for at se dem."
- En "Opdater"-knap der kalder `window.location.reload()`
- En "Luk"-knap der skjuler baren
- Baren vises IKKE i demo-mode
- Baren vises IKKE hvis aendringen er lavet af den aktuelle bruger (sammenlign `payload.new.updated_by` eller ignorer via en kort debounce efter egne handlinger)

**Fil: `src/components/Layout/MainLayout.tsx`**
- Tilfoej `<RealtimeChangeNotifier />` lige efter `<TopNavbar />`

---

### Del 3: Biler og lager filtreres korrekt per afdeling

#### Problem: Biler
Alle biler har `department_id = NULL` i databasen. Filteret i `useCarData.ts` bruger `!car.department_id || car.department_id === selectedDepartmentId`, som lader alle biler uden department_id igennem til alle afdelinger.

**Loesning - Database migration:**
- Opdater alle eksisterende biler til at faa `department_id` sat til Fredericia-afdelingens ID (`8c542620-9156-4155-b686-564b14a4ca62`), da alle nuvaerende biler tilhoerer den afdeling
- Saet `department_id` som NOT NULL med default vaerdi (eller behold nullable men krae det i kode)

**Fil: `src/hooks/car/useCarData.ts`**
- AEndr filteret fra `!car.department_id || car.department_id === selectedDepartmentId` til `car.department_id === selectedDepartmentId`
- Flyt filtreringen til query-niveau i `CarSecurityService.fetchCars()` for bedre ydeevne

**Fil: `src/services/carSecurityService.ts`**
- Tilfoej `selectedDepartmentId` som parameter til `fetchCars()`
- Tilfoej `.eq('department_id', selectedDepartmentId)` til Supabase-queryen
- Samme for `createCar()`: saet `department_id` automatisk paa nye biler

**Fil: `src/components/Cars/CarFormDialog.tsx`**
- Saet `department_id` automatisk til `selectedDepartmentId` ved oprettelse af ny bil

#### Problem: Lager (Warehouse)
`warehouse_items`-tabellen har INGEN `department_id`-kolonne. Alle lager-items vises for alle afdelinger.

**Loesning - Database migration:**
- Tilfoej `department_id UUID REFERENCES departments(id)` til `warehouse_items`-tabellen
- Opdater eksisterende warehouse items til at faa Fredericia-afdelingens ID

**Fil: `src/hooks/warehouse/useWarehouseData.ts`**
- Importer `useDepartment` og brug `selectedDepartmentId`
- Tilfoej `.eq('department_id', selectedDepartmentId)` til fetch-queryen
- Saet `department_id` automatisk ved oprettelse af nye items

---

### Tekniske detaljer

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| `src/components/Layout/MainLayout.tsx` | OPDATER | Tilfoej PullToRefresh + RealtimeChangeNotifier |
| `src/components/shared/RealtimeChangeNotifier.tsx` | NY | Realtime-aendringsbar komponent |
| Supabase migration | NY | Opdater biler department_id + tilfoej department_id til warehouse_items |
| `src/hooks/car/useCarData.ts` | OPDATER | Fjern fallback for null department_id |
| `src/services/carSecurityService.ts` | OPDATER | Tilfoej department_id filter til queries |
| `src/hooks/warehouse/useWarehouseData.ts` | OPDATER | Tilfoej department_id filter |
| `src/hooks/warehouse/useWarehouseActions.ts` | OPDATER | Saet department_id ved oprettelse |

