
## Plan: Ny rolle "Fugttekniker"

Fugttekniker = samme rettigheder som Servicemedarbejder (kan ikke oprette/redigere opgaver, godkende ferie, se brændstofkoder mv.), MEN bruger Skadeleder/Administrator-dashboardet (DashboardCockpit med metrics) i stedet for det forenklede ServicemedarbejderDashboard.

### 1. Database (migration)
- `ALTER TYPE user_role ADD VALUE 'fugttekniker';`
- Ingen ændringer i RLS-funktioner (`is_admin_or_skadeleder`, `can_view_fuel_codes`, `can_access_vacation`) — fugttekniker skal ikke have extra rettigheder.
- Profiles SELECT-policy (`secure_profile_access_unified`) ramt i tidligere migration via `user_access`-join — fugttekniker ser allerede kolleger automatisk.

### 2. Edge functions
- `supabase/functions/admin-user-role/index.ts`: tilføj `'fugttekniker'` til `validRoles`.

### 3. Frontend type & auth
- `src/context/AuthContext.tsx`: udvid `UserRole` med `'fugttekniker'`. Ingen ændringer i `isAdmin`, `canEdit`, `canCreate`, `canPublishTasks`, `canApproveVacation`, `canViewFuelCardCode` — alle forbliver false som for servicemedarbejder.
- `src/types/employee.ts`: tilføj `'fugttekniker'` til role-union.
- `src/utils/roles.ts`: ingen ændringer (skal IKKE tælle som admin/skadeleder).

### 4. Dashboard-routing
- `src/pages/DashboardPage.tsx`:
  - `isServicemedarbejder` → kun `'servicemedarbejder'` (uændret), så fugttekniker rammer `DashboardCockpit`.
  - `shouldShowMetrics` udvides: `super_admin | administrator | skadeleder | fugttekniker`.
- `src/components/Dashboard/QuickAccessGrid.tsx`: tilføj `fugttekniker` til betingelsen der viser Medarbejdere/Biler genveje (så dashboardet ligner skadeleders).

### 5. UI / admin
- `src/components/Admin/UserFormDialog.tsx`: ny `<SelectItem value="fugttekniker">` i rollevælgeren.
- `src/translations/da/admin.ts` + `en/admin.ts`: tilføj `fugttekniker` label + `fugttekniker Desc`.
- `docs/product-roadmap/user-personas.md`: tilføj kort sektion om Fugttekniker.

### 6. Changelog
- Tilføj entry i `CHANGELOG.md`: "Ny rolle: Fugttekniker (samme rettigheder som Servicemedarbejder, ser admin-dashboard)".

### Verifikation
- Build skal være grøn.
- Logget ind som fugttekniker: ser DashboardCockpit med metrics, men kan ikke redigere/oprette opgaver eller godkende ferie.
- Admin kan tildele rollen i UserFormDialog.

### Spørgsmål
Skal Fugttekniker også kunne se brændstofkortkoder eller har de samme begrænsning som Servicemedarbejder dér? (Default i planen: samme begrænsning — kan ikke se koder.)
