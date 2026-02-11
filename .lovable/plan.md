

## Database-migration: Afdelingshierarki og dataisolering

Denne migration tilfojer et komplet afdelingssystem med byer (hovedafdelinger), underafdelinger og rollebaseret adgangsstyring.

---

### Nuvaerende tilstand

- **Roller**: `administrator`, `skadeleder`, `servicemedarbejder`, `vikar`
- **Profiler**: 19 brugere, ingen afdelingstilknytning
- **Data-tabeller**: `assignments`, `vacations`, `on_call_duties` - ingen `department_id` kolonner
- **Funktioner**: `is_admin_user()`, `is_admin_or_skadeleder()`, `get_current_user_role()` - kender ikke til `super_admin`

---

### SQL Migration (koeres som en samlet migration)

**Del 1 - Ny rolle**

Tilfoej `super_admin` til den eksisterende `user_role` enum.

**Del 2 - Nye tabeller**

| Tabel | Kolonner | Formaal |
|-------|----------|---------|
| `departments` | id, name, created_at, updated_at | Byer: Fredericia, Hilleroed, Koebenhavn |
| `sub_departments` | id, department_id (FK), name, created_at, updated_at | Fugt, Miljoe osv. |
| `user_access` | id, user_id (FK auth.users), department_id (FK), sub_department_id (FK, nullable), created_at | Styrer hvem der ser hvad |

Alle tabeller faar RLS aktiveret.

**Del 3 - Udvid eksisterende tabeller**

| Tabel | Nye kolonner |
|-------|-------------|
| `profiles` | `home_department_id` (UUID, FK, nullable), `is_visible_in_planning` (boolean, default true) |
| `assignments` | `department_id` (UUID, FK, nullable), `sub_department_id` (UUID, FK, nullable) |
| `vacations` | `department_id` (UUID, FK, nullable), `sub_department_id` (UUID, FK, nullable) |
| `on_call_duties` | `department_id` (UUID, FK, nullable), `sub_department_id` (UUID, FK, nullable) |

**Del 4 - Hjaelpefunktioner (SECURITY DEFINER)**

- `is_super_admin()` - returnerer true hvis bruger har rollen super_admin
- `get_user_department_ids()` - returnerer array af brugerens afdelings-IDer
- `can_access_department_data(dept_id, sub_dept_id)` - samlet adgangstjek:
  - super_admin: altid true
  - administrator: true hvis dept_id matcher brugerens afdelinger
  - skadeleder/servicemedarbejder: true hvis specifik sub_department matcher

**Del 5 - Opdater eksisterende funktioner**

- `is_admin_user()` - inkluder `super_admin`
- `is_admin_or_skadeleder()` - inkluder `super_admin`

**Del 6 - RLS policies**

- `departments`: Alle autenticerede kan laese, kun super_admin kan oprette/aendre/slette
- `sub_departments`: Alle autenticerede kan laese, super_admin + admin (i afdelingen) kan skrive
- `user_access`: Brugere ser egen adgang, super_admin + admin (i afdelingen) kan styre

**Del 7 - Seed Fredericia som standardafdeling**

```sql
INSERT INTO departments (name) VALUES ('Fredericia');

-- Tildel alle 19 profiler til Fredericia
UPDATE profiles SET home_department_id = (SELECT id FROM departments WHERE name = 'Fredericia');

-- Giv alle brugere adgang til Fredericia
INSERT INTO user_access (user_id, department_id)
  SELECT id, (SELECT id FROM departments WHERE name = 'Fredericia') FROM profiles;

-- Tildel eksisterende data til Fredericia
UPDATE assignments SET department_id = (SELECT id FROM departments WHERE name = 'Fredericia');
UPDATE vacations SET department_id = (SELECT id FROM departments WHERE name = 'Fredericia');
UPDATE on_call_duties SET department_id = (SELECT id FROM departments WHERE name = 'Fredericia');
```

---

### Hvad sker med eksisterende data?

- Alle 19 profiler faar `home_department_id = Fredericia`
- Alle opgaver, ferier og vagter faar `department_id = Fredericia`
- Alle brugere faar en `user_access` raekke til Fredericia
- Nye kolonner er nullable, saa intet eksisterende data gaar tabt
- Eksisterende roller og RLS policies virker stadig

---

### Frontend-opdateringer (efter SQL)

Disse TypeScript-filer skal opdateres efterfoelgende:

| Fil | AEndring |
|-----|---------|
| `src/types/employee.ts` | Tilfoej `home_department_id`, `is_visible_in_planning` |
| `src/types/assignment.ts` | Tilfoej `department_id`, `sub_department_id` |
| `src/types/duty.ts` | Tilfoej `department_id`, `sub_department_id` |
| `src/types/vacation.ts` | Tilfoej `department_id`, `sub_department_id` |
| `src/context/AuthContext.tsx` | Tilfoej department-info til user context |
| Hooks for data-hentning | Filter baseret paa brugerens afdeling |

---

### Udrulningsorden

1. Koer SQL-migrationen (alt i en migration)
2. Opdater frontend-typer og hooks (separat trin)
3. Byg admin-UI til at styre afdelinger og bruger-tilknytning (separat trin)

