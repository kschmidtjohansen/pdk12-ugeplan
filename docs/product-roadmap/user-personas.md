# Brugerpersonaer (Roller)

## Rolleoversigt

| Rolle | Database-værdi | Adgangsniveau |
|-------|---------------|---------------|
| Super Admin | `super_admin` | Fuld systemadgang, alle afdelinger |
| Administrator (Chef) | `administrator` | Afdelingsleder, godkendelser |
| Skadeleder | `skadeleder` | Daglig planlægning, operationelt |
| Servicemedarbejder | `medarbejder` | Egne opgaver, begrænset visning |
| Vikar | `medarbejder` + `is_temporary` | Midlertidig, med udløbsdato |

---

## Super Admin

**Beskrivelse**: Systemadministrator med fuld adgang til alle afdelinger og funktioner.

**Adgang**:
- Alle afdelinger og underafdelinger (ingen RLS-begrænsning via `is_super_admin()`)
- Brugerstyring: opret, rediger, slet brugere og tildel roller
- Afdelingsstyring: opret/rediger afdelinger og underafdelinger
- Feature toggles per afdeling (chat, filer, vagt, vikar, lager)
- Se brændstofkortkoder (`can_view_fuel_codes()`)
- Slette andres chat-beskeder
- Skifte afdeling frit via header-selector
- Adgang til systemmetrics og ændringslog

**Typisk bruger**: IT-ansvarlig eller projektleder med ansvar for hele systemet.

---

## Administrator (Chef)

**Beskrivelse**: Afdelingsleder med ansvar for sin(e) afdeling(er).

**Adgang**:
- Egne afdelinger (filtreret via `user_access` + `can_access_department_data()`)
- Godkende/afvise ferieanmodninger for medarbejdere i afdelingen
- Oprette og redigere opgaver, vagter, biler og lagervarer
- Se brændstofkortkoder
- Brugerstyring inden for egen afdeling
- Adgang til ændringslog og planlægger

**Begrænsninger**:
- Kan ikke oprette nye afdelinger
- Kan ikke ændre feature toggles
- Ser kun data fra tildelte afdelinger

**Typisk bruger**: Afdelingschef eller driftsleder.

---

## Skadeleder

**Beskrivelse**: Daglig operationel leder med ansvar for planlægning og koordinering.

**Adgang**:
- Egne afdelinger (filtreret via `user_access`)
- Oprette og redigere opgaver i planlæggeren
- Tildele medarbejdere og biler til opgaver
- Administrere vagtplan (oprette, bytte, redigere vagter)
- Se brændstofkortkoder
- Se medarbejderliste med kontaktoplysninger

**Begrænsninger**:
- Kan ikke godkende ferie (kun Administrator+)
- Kan ikke oprette brugere
- Ferie-adgang begrænset via `can_access_vacation()` til egen afdeling

**Typisk bruger**: Formand, teamleder eller skadeleder på byggeplads.

---

## Servicemedarbejder

**Beskrivelse**: Almindelig medarbejder der bruger systemet til at se sine opgaver.

**Adgang**:
- Se egne opgaver for den aktuelle uge
- Se kolleger i egen afdeling (navn, jobtitel, status)
- Ansøge om ferie/fravær
- Se vagtplan (kun visning)
- Modtage notifikationer om nye opgaver og vagtændringer
- Redigere egen profil (billede, telefon)

**Begrænsninger**:
- Kan ikke oprette eller redigere opgaver
- Kan ikke se brændstofkortkoder
- Kan ikke administrere biler eller lager
- Ser kun publicerede opgaver

**Typisk bruger**: Håndværker, tekniker eller servicemedarbejder i marken.

---

## Vikar

**Beskrivelse**: Midlertidig medarbejder med begrænset tidshorisont.

**Adgang**:
- Samme basale adgang som Servicemedarbejder
- Profil markeret med `is_temporary = true`
- Udløbsdato sat i `expires_at`

**Særlige regler**:
- Systemet advarer ved oprettelse hvis udløbsdato > 6 måneder frem
- Udløbsdato kan ikke sættes i fortiden
- Automatisk oprydning via `cleanup_expired_temporary_users()` edge function
- Ved udløb: bruger deaktiveres (auth disabled) og profil markeres

**Typisk bruger**: Sæsonarbejder, praktikant eller midlertidig vikar.

---

## Rollebaseret adgangskontrol (Teknisk)

### RLS-funktioner

| Funktion | Beskrivelse |
|----------|-------------|
| `is_super_admin()` | Returnerer `true` for super_admin-rolle |
| `is_admin_or_skadeleder()` | Returnerer `true` for administrator eller skadeleder |
| `can_access_department_data(_dept_id, _sub_dept_id)` | Tjekker om bruger har adgang til given afdeling |
| `can_access_vacation(vacation_user_id)` | Tjekker om bruger kan se/redigere given ferieanmodning |
| `can_view_fuel_codes()` | Returnerer `true` for super_admin, administrator, skadeleder |
| `get_current_user_role()` | Returnerer brugerens aktuelle rolle |

### Rolletildeling

Roller gemmes i `user_roles`-tabellen (én rolle per bruger). Ændring af rolle kræver `super_admin` eller `administrator` via `admin-user-role` edge function.
