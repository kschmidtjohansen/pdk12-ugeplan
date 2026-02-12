

## Feature-toggles for Lager og Vagt per hovedafdeling

### Overblik

Tilfoej mulighed for at Super Admin og Administrator kan aktivere/deaktivere "Lager" (Warehouse) og "Vagt" (Duty) per hovedafdeling. Naar en funktion er slaaet fra, skjules alle relaterede menupunkter, dashboard-widgets, og sider for brugere i den paagaeldende afdeling.

### Aendringer

---

### Del 1: Database -- Nye kolonner paa `departments`

**Migration**: Tilfoej to nye boolean-kolonner til `departments`-tabellen:

```text
departments
  + warehouse_enabled  BOOLEAN  DEFAULT true
  + duty_enabled       BOOLEAN  DEFAULT true
```

Alle eksisterende afdelinger faar automatisk `true` (bagudkompatibelt).

---

### Del 2: DepartmentContext -- Eksponer feature-flags

**Fil: `src/context/DepartmentContext.tsx`**

- Udvid `Department`-interfacet med `warehouse_enabled` og `duty_enabled`
- Hent disse felter i alle department-queries (`select('id, name, warehouse_enabled, duty_enabled')`)
- Tilfoej to nye vaerdier til context: `isWarehouseEnabled` og `isDutyEnabled` (baseret paa den valgte afdeling)
- Demo-bruger: Begge features er altid aktiveret

---

### Del 3: Navigation -- Skjul menupunkter

**Fil: `src/components/Layout/TopNavbar.tsx`**

- Importer `useDepartment` og lae vaerdierne `isDutyEnabled` og `isWarehouseEnabled`
- I `filteredNavItems`: filtrer `/duty` fra naar `isDutyEnabled === false`, og `/warehouse` fra naar `isWarehouseEnabled === false`
- Gaelder baade DesktopNavigation og MobileNavigation (begge modtager `items`)

---

### Del 4: Dashboard -- Skjul widgets

**Fil: `src/components/Dashboard/DashboardMetrics.tsx`**

- Importer `useDepartment`
- Betinget rendering af `DutySummaryWidget` naar `isDutyEnabled` er true

**Fil: `src/components/Dashboard/ServicemedarbejderDashboard.tsx`**

- Samme logik: skjul `DutySummaryWidget` naar `isDutyEnabled` er false

**Fil: `src/components/Planner/PlannerContent.tsx`**

- Skjul `DutyWeekWidget` naar `isDutyEnabled` er false

---

### Del 5: Sidebeskyttelse -- Redirect

**Fil: `src/pages/DutyPage.tsx`**

- Importer `useDepartment`
- Hvis `isDutyEnabled === false`: vis en "Denne funktion er ikke aktiveret"-besked eller redirect til dashboard

**Fil: `src/pages/WarehousePage.tsx`**

- Samme logik for `isWarehouseEnabled`

---

### Del 6: Admin-panel -- Feature-toggles UI

**Fil: `src/pages/AdminPage.tsx`**

- Tilfoej en ny tab "Funktioner" (synlig for Super Admin og Administrator)
- Viser to Switch-toggles per afdeling:
  - "Lager aktiveret" (warehouse_enabled)
  - "Vagt aktiveret" (duty_enabled)
- Aendring opdaterer `departments`-tabellen direkte via Supabase
- Viser den valgte afdelings indstillinger (baseret paa `selectedDepartmentId`)

**Ny komponent: `src/components/Admin/FeatureToggleManagement.tsx`**

- Card med den valgte afdelings navn
- To rader med Switch + label
- Ved toggle: `supabase.from('departments').update({ duty_enabled }).eq('id', deptId)`
- Toast ved succes/fejl
- Opdaterer DepartmentContext automatisk (realtime eller refetch)

---

### Del 7: Oversaettelser

**Filer: `src/translations/da/admin.ts`, `src/translations/en/admin.ts`**

Nye noegler:
- `tabs.features`: "Funktioner" / "Features"
- `features.title`: "Funktionsstyring" / "Feature Management"
- `features.description`: "Aktiver eller deaktiver funktioner for den valgte afdeling" / "Enable or disable features for the selected department"
- `features.warehouseEnabled`: "Lager" / "Warehouse"
- `features.dutyEnabled`: "Vagt" / "Duty"
- `features.enabled`: "Aktiveret" / "Enabled"
- `features.disabled`: "Deaktiveret" / "Disabled"
- `features.updated`: "Funktionsindstilling opdateret" / "Feature setting updated"
- `features.featureDisabled`: "Denne funktion er ikke aktiveret for din afdeling" / "This feature is not enabled for your department"

---

### Tekniske detaljer

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| Supabase migration | NY | Tilfoej `warehouse_enabled` og `duty_enabled` kolonner |
| `src/context/DepartmentContext.tsx` | OPDATER | Hent og eksponer feature-flags |
| `src/components/Layout/TopNavbar.tsx` | OPDATER | Filtrer navigation baseret paa flags |
| `src/components/Dashboard/DashboardMetrics.tsx` | OPDATER | Betinget DutySummaryWidget |
| `src/components/Dashboard/ServicemedarbejderDashboard.tsx` | OPDATER | Betinget DutySummaryWidget |
| `src/components/Planner/PlannerContent.tsx` | OPDATER | Betinget DutyWeekWidget |
| `src/pages/DutyPage.tsx` | OPDATER | Redirect naar feature er slaaet fra |
| `src/pages/WarehousePage.tsx` | OPDATER | Redirect naar feature er slaaet fra |
| `src/pages/AdminPage.tsx` | OPDATER | Tilfoej "Funktioner"-tab |
| `src/components/Admin/FeatureToggleManagement.tsx` | NY | Toggle-UI for features |
| `src/translations/da/admin.ts` | OPDATER | Danske oversaettelser |
| `src/translations/en/admin.ts` | OPDATER | Engelske oversaettelser |

**Dataflow**:

```text
Admin aendrer toggle
       |
  departments tabel opdateres
       |
  DepartmentContext refetcher
       |
  isDutyEnabled / isWarehouseEnabled opdateres
       |
  +----+----+----+
  |         |         |
Navigation  Widgets   Sider
(skjuler)  (skjuler) (redirect)
```
