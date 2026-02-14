
## Plan: Demo-isolering, Changelog og README-opdatering

### 1. Demo-isolering af nye funktioner

Flere af de nyligt tilfoejede funktioner bruger `supabase` direkte i stedet for den schema-aware `getSchemaClient()`, hvilket betyder at demo-mode kan paavirke live-data.

#### Problemer fundet:

**a) `AdminVacationFormDialog.tsx` (linje 95):** Bruger `supabase.from('user_access')` direkte. I demo-mode skal den bruge `getSchemaClient(true)` saa den laeser fra demo-schema.

**b) `useCarFormState.ts` - `syncSubDepartments` (linje 111-120):** Bruger `supabase.from('car_sub_departments')` direkte til at slette og indsaette raekker. I demo-mode skal dette enten virtualiseres (som andre demo-operationer) eller bruge `getSchemaClient(true)`.

**c) `useCarFormState.ts` - `initFormWithCar` (linje 70-73):** Bruger `supabase.from('car_sub_departments')` direkte til at hente sub-department IDs ved redigering. Skal bruge schema-aware client i demo-mode.

**d) `useCarData.ts` - `createCar` (linje 116-118):** Bruger `supabase.from('car_sub_departments')` direkte efter oprettelse af bil. I demo-mode hoppes dette over (demo-biler er virtuelle), men koden kører stadig.

**e) `carSecurityService.ts` - `fetchCars` (linje 26-29):** Bruger `supabase.from('car_sub_departments')` direkte til at filtrere. I demo-mode springes sub-department filtrering allerede over (linje 25: `if (!isDemoMode && subDepartmentId)`), saa dette er OK.

**f) `carSecurityService.ts` - `updateCar` (linje 186):** Saetter stadig `sub_department_id` paa den gamle kolonne. Bør fjernes for konsistens.

#### Loesning:

| Fil | AEndring |
|-----|---------|
| `src/components/Vacation/AdminVacationFormDialog.tsx` | Importer `useAuth` og `getSchemaClient`, brug schema-aware client til `user_access` query |
| `src/hooks/car/useCarFormState.ts` | Importer `useAuth`, brug `getSchemaClient(isDemoMode)` i `syncSubDepartments` og `initFormWithCar` |
| `src/hooks/car/useCarData.ts` | Skip `car_sub_departments` insert i demo-mode (demo-biler er allerede virtuelle) |
| `src/services/carSecurityService.ts` | Fjern `sub_department_id` fra `updateCar` updateData (linje 186) |

---

### 2. Changelog-opdatering

Tilfoej alle nylige rettelser under `[Unreleased]` sektionen i `CHANGELOG.md`:

**Added - 2026-02-14:**
- Biler kan nu tilknyttes flere underafdelinger via junction-tabel (`car_sub_departments`)
- Validering: Mindst en underafdeling skal vaelges ved oprettelse/redigering af bil
- Tom-tilstand (empty state) paa bilsiden naar ingen biler er tilknyttet underafdelingen
- Pull-to-refresh paa bilsiden

**Fixed - 2026-02-14:**
- Sags-dialog paa mobil: Beskrivelse kan nu scrolles (overflow-hidden rettet til overflow-y-auto)
- Braendstofkortkode viste "PENDING_ADMIN_APPROVAL" - vaerdi ryddet og `can_view_fuel_codes()` opdateret til at inkludere super_admin
- Ferie-medarbejderliste: Super Admin og andre brugere kan nu vaelges i "Ansoeg for medarbejder" dialogen
- Ferie-medarbejderliste filtreres nu korrekt efter aktiv underafdeling
- Biler forsvandt fra listen efter oprettelse naar ingen underafdeling var valgt

**Security - 2026-02-14:**
- `can_view_fuel_codes()` RPC opdateret til at inkludere `super_admin` rollen
- Demo-isolering af `user_access` og `car_sub_departments` queries

---

### 3. README-opdatering

Tilfoej beskrivelse af multi-afdeling og underafdeling systemet i baade dansk og engelsk sektion.

**Nye punkter i Features-listen:**
- DK: `🏢 **Multi-afdeling og underafdeling** med bruger- og biltilknytning til flere afdelinger/underafdelinger`
- EN: `🏢 **Multi-department and sub-department** with user and vehicle assignment to multiple departments/sub-departments`

**Ny sektion efter "Roller og adgang" (begge sprog):**

Dansk:
```
### 🏢 Afdelings- og underafdelingsstruktur

Systemet understøtter en hierarkisk organisationsstruktur:

- **Afdelinger** (f.eks. 02 - Storkøbenhavn, 12 - Fredericia) er de overordnede enheder
- **Underafdelinger** (f.eks. Fugt & Skimmel, Løsøre) er specialiserede teams inden for en afdeling
- **Brugere** kan tilknyttes flere afdelinger og underafdelinger via checkboxes i Admin-panelet
- **Biler** kan tilknyttes flere underafdelinger samtidigt
- **Data-isolering**: Opgaver, biler, lager og fridage filtreres automatisk efter den valgte afdeling og underafdeling
- **Super Admin** har global adgang og kan skifte frit mellem alle afdelinger
```

Engelsk:
```
### 🏢 Department & Sub-department Structure

The system supports a hierarchical organizational structure:

- **Departments** (e.g., 02 - Greater Copenhagen, 12 - Fredericia) are the top-level units
- **Sub-departments** (e.g., Moisture & Mold, Movables) are specialized teams within a department
- **Users** can be assigned to multiple departments and sub-departments via checkboxes in the Admin panel
- **Vehicles** can be assigned to multiple sub-departments simultaneously
- **Data isolation**: Tasks, vehicles, warehouse items, and vacations are automatically filtered by the selected department and sub-department
- **Super Admin** has global access and can freely switch between all departments
```

---

### Samlet filliste

| Fil | AEndring |
|-----|---------|
| `src/components/Vacation/AdminVacationFormDialog.tsx` | Brug `getSchemaClient` til `user_access` query i demo-mode |
| `src/hooks/car/useCarFormState.ts` | Brug schema-aware client i `syncSubDepartments` og `initFormWithCar` |
| `src/hooks/car/useCarData.ts` | Skip `car_sub_departments` insert i demo-mode |
| `src/services/carSecurityService.ts` | Fjern `sub_department_id` fra `updateCar` |
| `CHANGELOG.md` | Tilfoej alle nylige rettelser |
| `README.md` | Tilfoej multi-afdeling/underafdeling dokumentation (begge sprog) |
