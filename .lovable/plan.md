

## Brugerstyring opdelt i hovedafdelinger

### Overblik

Brugerstyringen i admin-panelet skal filtreres efter den valgte hovedafdeling, med et ekstra filter til at se brugere uden afdeling.

### Aendringer

---

### Del 1: Frontend -- Filtrer brugerlisten efter afdeling

**Fil**: `src/components/Admin/UserManagement.tsx`

- Importer `useDepartment` fra `DepartmentContext` og `useAuth` for rolletjek
- Tilfoej en ny state `departmentFilter` med vaerdierne: `'current'` (valgt afdeling) eller `'unassigned'` (ingen afdeling)
- Vis en dropdown/select oeverst med:
  - Den valgte bys navn (standard)
  - "Uden afdeling" -- viser brugere der ikke har nogen `user_access`-raekke
- Efter brugere er hentet (baade via edge function og fallback), filtrer dem:
  1. Hent `user_access` data for alle brugere med `department_id = selectedDepartmentId`
  2. Hvis filter er `'current'`: vis kun brugere med adgang til den valgte afdeling
  3. Hvis filter er `'unassigned'`: vis kun brugere der ikke har nogen raekke i `user_access`
- Kun Super Admin og Administrator kan se "Uden afdeling"-filteret

---

### Del 2: Edge Function -- Tilfoej department_id parameter (valgfrit)

**Fil**: `supabase/functions/admin-list-users/index.ts`

- Tilfoej valgfri `department_id` og `filter_type` parametre (via POST body eller query params)
- Naar `department_id` er sat og `filter_type` er `'department'`:
  - Hent `user_id`-liste fra `user_access` WHERE `department_id = department_id`
  - Filtrer profiles til kun de IDs
- Naar `filter_type` er `'unassigned'`:
  - Hent alle `user_id` fra `user_access`
  - Filtrer profiles til dem der IKKE er i listen
- Naar ingen parameter: returner alle (bagudkompatibelt)
- Admin-brugere (ikke super_admin) kan kun filtrere paa afdelinger de selv har adgang til

---

### Del 3: Fallback-metoden -- Samme filtrering

**Fil**: `src/components/Admin/UserManagement.tsx` (i `fetchUsersDirectly`)

- Tilfoej samme filtrering i fallback-metoden:
  - Hent `user_access` data
  - Filtrer brugere baseret paa `departmentFilter` state
  - Admin kan kun se sin egen afdelings brugere + uassignerede

---

### Del 4: Tildeling af afdeling -- Begraens baseret paa rolle

**Fil**: `src/components/Admin/UserFormDialog.tsx`

- For Super Admin: Afdelingsvaelgeren viser alle hovedafdelinger (allerede implementeret)
- For Admin: Afdelingsvaelgeren viser kun den aktuelle brugers afdeling (allerede implementeret via `user_access`-tjek)
- Ingen aendringer nødvendige her -- den eksisterende logik i `UserFormDialog` haandterer allerede dette korrekt

---

### Del 5: Oversaettelser

**Filer**: `src/translations/da/admin.ts`, `src/translations/en/admin.ts`

- Tilfoej nye nogler:
  - `filterByDepartment`: "Filtrer efter afdeling" / "Filter by department"
  - `unassignedUsers`: "Uden afdeling" / "Unassigned"
  - `allDepartments`: "Alle afdelinger" / "All departments"
  - `showingUsersFor`: "Viser brugere for" / "Showing users for"

---

### Tekniske detaljer

**Filer der aendres**:

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| `supabase/functions/admin-list-users/index.ts` | OPDATER | Tilfoej department_id filtrering |
| `src/components/Admin/UserManagement.tsx` | OPDATER | Tilfoej afdelingsfilter-dropdown og filtreringslogik |
| `src/translations/da/admin.ts` | OPDATER | Danske oversaettelser |
| `src/translations/en/admin.ts` | OPDATER | Engelske oversaettelser |

**Dataflow**:

```text
Admin-side -> Vaelg afdelingsfilter (dropdown)
                    |
        +-----------+-----------+
        |                       |
  "Valgt afdeling"        "Uden afdeling"
        |                       |
  Hent user_access         Hent ALLE user_access
  WHERE dept = X           Find brugere IKKE i listen
        |                       |
  Filtrer brugere          Filtrer brugere
        |                       |
        +----------+------------+
                   |
            Vis i UserTable
```

**Rollebegraensninger**:
- Super Admin: Kan se alle afdelinger + "Uden afdeling"
- Administrator: Kan kun se sin egen afdeling + "Uden afdeling"
- Skadeleder: Kan kun se sin egen afdeling (ingen "Uden afdeling")

