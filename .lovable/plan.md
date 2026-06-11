
## Plan

### 1. `useDashboardMetrics` — ekskludér Skadeleder og Fugttekniker
Tilføj en helper `isCountableEmployee` der kun tæller roller `servicemedarbejder` og `vikar` (de roller der reelt udfører feltarbejde). Anvendes på:
- `totalEmployees` (linje 44) — totalen i "Tilgængelige medarbejdere"
- `availableEmployeesList` filter (linje 47) — listen over ledige
- `absentEmployeesList` filter (linje 95) — fraværende i dag
- Debug-log (`servicemedarbejdere`) opdateres tilsvarende.

Administratorer, Skadeledere, Fugtteknikere og Super Admins tæller dermed ikke længere med i "Tilgængelige" / "Fraværende"-tal og lister på dashboardet. Bil- og lager-metrics er uafhængige af roller og forbliver uændrede.

### 2. `DemoRoleSwitcher` — tilføj Fugttekniker
Indsæt nyt rolle-objekt for `fugttekniker` i `roles`-arrayet **lige før** `servicemedarbejder`, så rækkefølgen bliver: Super Admin → Administrator → Skadeleder → Fugttekniker → Servicemedarbejder. Bruger eksisterende `admin.roles.fugttekniker` / `fugtteknikerDesc`-oversættelser.

### 3. `UserFormDialog` rolledropdown — Fugttekniker over Servicemedarbejder
I `src/components/Admin/UserFormDialog.tsx` byttes rækkefølgen, så `<SelectItem value="fugttekniker">` står **før** `<SelectItem value="servicemedarbejder">`.

### 4. Changelog
Tilføj entry: dashboard-metrics tæller kun servicemedarbejdere/vikarer; Fugttekniker tilgængelig i demo-rolleswitcher; rækkefølge i formular justeret.

### Verifikation
- Build skal være grøn.
- Dashboard som admin: "Tilgængelige medarbejdere" total falder med antallet af admins/skadeledere/fugtteknikere i afdelingen.
- Demo: dropdown viser Fugttekniker mellem Skadeleder og Servicemedarbejder og kan vælges.
- Brugerformular: Fugttekniker står over Servicemedarbejder.
