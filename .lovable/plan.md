

## Plan: Feriekalender i Admin + Falck-abonnementsnummer på /cars

### Feature 1: Feriekalender-fane i Admin

Ny fane "Ferieoversigt" i AdminPage med kalendervisning over godkendte ferier.

**Komponent: `src/components/Admin/VacationCalendarOverview.tsx`**
- Henter alle godkendte ferier fra `vacations`-tabellen (status = 'approved')
- Joiner med `profiles` for at vise medarbejdernavne
- Måneds-kalendervisning hvor dage med ferier markeres visuelt
- Klikbar dag viser hvilke medarbejdere der har ferie
- Ugeoversigt-sektion nederst: viser antal tilgængelige servicemedarbejdere per uge
  - Tæller totalt antal aktive servicemedarbejdere (fra `profiles` + `user_roles` hvor role = 'servicemedarbejder')
  - Trækker dem fra der har godkendt ferie i den uge
  - Farvekodet: grøn (>75% tilgængelige), gul (50-75%), rød (<50%)
- Månedsnavigation med pile (forrige/næste måned)
- Filtrering per underafdeling via DepartmentContext

**Ændringer i AdminPage.tsx:**
- Ny tab "vacationCalendar" med CalendarDays-ikon
- TabsContent der renderer VacationCalendarOverview

**Translations (da + en):**
- `admin.tabs.vacationCalendar`: "Ferieoversigt" / "Vacation Overview"
- `admin.vacationCalendar.*`: title, description, availableEmployees, onVacation, week, noVacations

### Feature 2: Falck-abonnementsnummer på /cars

**Ny DB-tabel: `department_settings`**
```sql
CREATE TABLE department_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value text,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(department_id, setting_key)
);
-- RLS: authenticated can SELECT, admin can INSERT/UPDATE/DELETE
```

Generisk nøgle-værdi-tabel så den kan bruges til andre indstillinger fremover. Falck-nummeret gemmes med `setting_key = 'falck_subscription_number'`.

**Komponent: `src/components/Cars/FalckSubscriptionButton.tsx`**
- Knap med Falck-ikon/Shield i header-området på CarsPage
- Klik åbner dialog der viser nummeret
- Admin ser redigeringsknap med input-felt til at opdatere
- Ikke-admin ser kun nummeret (read-only)
- Henter fra `department_settings` via selectedDepartmentId

**Ændringer i CarsPage.tsx:**
- Importerer og placerer FalckSubscriptionButton i header ved siden af "Tilføj Nyt Køretøj"

**Translations (da + en):**
- `cars.falckSubscription`: "Falck Abonnement" / "Falck Subscription"
- `cars.falckSubscriptionNumber`: "Abonnementsnummer" / "Subscription Number"
- `cars.falckSubscriptionEmpty`: "Intet abonnementsnummer registreret" / "No subscription number registered"
- `cars.falckSubscriptionUpdated`: "Abonnementsnummer opdateret" / "Subscription number updated"

### Filer der oprettes/ændres

| Fil | Handling |
|-----|---------|
| `src/components/Admin/VacationCalendarOverview.tsx` | **Ny** — kalenderkomponent med ferievisning og tilgængelighed |
| `src/components/Cars/FalckSubscriptionButton.tsx` | **Ny** — knap + dialog til Falck-nummer |
| `src/pages/AdminPage.tsx` | Tilføj vacationCalendar-fane |
| `src/pages/CarsPage.tsx` | Tilføj FalckSubscriptionButton i header |
| `src/translations/da/admin.ts` | Tilføj vacationCalendar-oversættelser |
| `src/translations/en/admin.ts` | Tilføj vacationCalendar-oversættelser |
| `src/translations/da/cars.ts` | Tilføj falck-oversættelser |
| `src/translations/en/cars.ts` | Tilføj falck-oversættelser |
| Ny SQL migration | Opret `department_settings`-tabel med RLS |
| `CHANGELOG.md` | Dokumenter begge features |

