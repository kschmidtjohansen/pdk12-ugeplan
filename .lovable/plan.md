# Plan: Delte vagtafdelinger

## Mål
Gøre det muligt for to eller flere afdelinger at dele vagtplan, så en bruger i Asnæs kan se og redigere Hillerøds vagter (og omvendt), samt vælge medarbejdere fra de tilknyttede afdelinger i vagt-dialoger. Medarbejderlisten under `/employees` forbliver isoleret per afdeling.

## Krav (fra afklaring)
- Generel admin-konfiguration: flere afdelingspar kan knyttes sammen fremover.
- Fuld deling: vagter kan ses, redigeres og fjernes på tværs af delte afdelinger; medarbejdere fra de delte afdelinger kan vælges i vagt-dialoger.
- Omfang: Vagtplan-siden (`/duty`) og notifikationer om vagtændringer.
- Medarbejderlisten (`/employees`) forbliver adskilt.

## Teknisk tilgang

### 1. Data-model: `department_settings` udvidet
Bruge den eksisterende `department_settings`-tabel til at lagre en ny nøgle `shared_duty_departments` med en JSON-array af afdelings-ID'er. Det undgår en ny tabel og udnytter eksisterende admin/RLS-mønstre.

- Nøgle: `shared_duty_departments`
- Værdi: JSON-array, f.eks. `["ca52e77e-6371-4ed2-b34a-05579280f64f"]` på Asnæs (14) for at pege på Hillerød (03).
- Laves begge veje (Asnæs peger på Hillerød, Hillerød peger på Asnæs) af hensyn til symmetrisk deling.

### 2. Admin-konfiguration
Tilføj et nyt kort "Delte vagtafdelinger" på admin/afdelingssiden (`FeatureToggleManagement` eller en ny komponent):
- Multi-select med alle afdelinger.
- Gemmer/letter `department_settings` rækker med `shared_duty_departments`.
- Kun `super_admin` eller `administrator` kan ændre det.

### 3. Hent delingkonfiguration
Opret `useSharedDutyDepartments()` hook:
- Henter `shared_duty_departments` fra `department_settings` for `selectedDepartmentId`.
- Returnerer `sharedDepartmentIds: string[]`.
- Cacher med TanStack Query.

### 4. Vagt-hentning (`useDutyData`)
- Udvid query til at hente vagter for `selectedDepartmentId` OG `sharedDepartmentIds`.
- I stedet for `eq('department_id', selectedDepartmentId)` bruges `in('department_id', [selectedDepartmentId, ...sharedDepartmentIds])`.
- Bevar filtrering på `is_demo = false`, dato-interval og sortering.
- Marker delte vagter med en `department_id` label, så brugeren kan se hvilken afdeling en vagt tilhører.

### 5. Medarbejder-hentning til vagtformål
Eksisterende `useEmployeeData` filtrerer på `selectedDepartmentId` og bruges af `/employees`. For at undgå at blande afdelinger i medarbejderlisten, oprettes en ny hook `useDutyEmployees()`:
- Henter medarbejdere fra `selectedDepartmentId` OG alle `sharedDepartmentIds`.
- Bruges kun i `DutyAssignmentDialog`, `DutyEditDialog`, `DutySwapDialog` og `DutySwapSelectDialog`.
- Den almindelige `useEmployeeData` og `EmployeesPage` forbliver uændret.

### 6. Vagt-oprettelse og -redigering (`useDutyActions`)
- Når der oprettes en ny vagt, skal `department_id` fortsat sættes til `selectedDepartmentId` (ejer-afdeling). Medarbejderen kan godt komme fra en delt afdeling.
- Ved redigering af en eksisterende vagt: hvis vagten tilhører en delt afdeling, må admin/skadeleder stadig opdatere `employee_id`, `duty_type` og `notes` — RLS skal tillade dette.
- Sletning: tillad admin/skadeleder at slette vagter fra delte afdelinger, hvis de har adgang via delingkonfigurationen.

### 7. RLS-opdatering
Nuværende `on_call_duties` SELECT-politik er meget åben (`Anyone can view on call duties`). For at sikre korrekt adgangskontrol og tillade cross-department deling, opdateres politikkerne:

- **SELECT**: Brugeren kan se vagter, hvor `department_id` er i brugerens egne afdelinger eller i afdelinger der deles med brugerens valgte afdelinger.
- **ALL (admin/skadeleder)**: Udvid `is_admin_or_skadeleder()` check eller tilføj en ny policy, så admin/skadeleder også kan administrere vagter i delte afdelinger. Dette kan gøres via en security-definer-funktion `can_manage_duty_department(duty_department_id)`.
- **Users can reassign their own duties**: Bevares, men sikres at brugeren kun kan redigere egne vagter (ikke cross-department).

Oprettelse af helper-funktion:
```sql
get_shared_duty_department_ids(_department_id uuid)
RETURNS uuid[]
-- Returnerer array af department_id'er som _department_id deler vagter med
-- Læser fra department_settings hvor setting_key = 'shared_duty_departments'
```

### 8. UI-visning
- `DutyMonthCalendar` og `DutyList`: vis afdelings-label på vagter fra delte afdelinger (f.eks. lille badge "Hillerød" på en Asnæs-vagt).
- `DutyAssignmentDialog`: vis medarbejdere fra egen + delte afdelinger; marker hvilken afdeling medarbejderen tilhører.
- `DutyEditDialog`: samme selector; bevar validering af rolle for `skadeleder_vagt`.
- `DutySwapDialog`: kandidater kan komme fra delte afdelinger.

### 9. Notifikationer
Når en vagt i en delt afdeling oprettes, redigeres eller slettes, skal notifikationer også sendes til medarbejderen fra den anden afdeling. Det gælder:
- `createDutyAssignmentNotification` (vagttildeling)
- `createDutySwapOfferNotification` (bytteanmodning)
- Bytte-accepteringer via `swap-duties` edge function

Ingen ændring af notifikations-RLS nødvendig, da notifikationer altid er bruger-specifikke (`user_id`).

### 10. Dokumentation
- Opdater `docs/implementation-plan/tasks.md` med ny fase/opgave.
- Opdater `CHANGELOG.md` med beskrivelse af ændringen.
- Opdater `docs/technical-specs/database-schema.md` med delingkonceptet.
- Opdater `docs/product-roadmap/features.md` under "Vagtplan".

## Filer der ændres

### Database (migration)
- Ingen nye tabeller; bruger eksisterende `department_settings`.
- RLS-politikker for `on_call_duties`: opdater SELECT og ALL policies.
- Nye helper-funktioner: `get_shared_duty_department_ids()`, `can_manage_duty_department()`.

### Frontend
- `src/hooks/duty/useSharedDutyDepartments.ts` (ny)
- `src/hooks/duty/useDutyEmployees.ts` (ny)
- `src/hooks/duty/useDutyData.ts` (ændret)
- `src/hooks/duty/useDutyActions.ts` (ændret)
- `src/hooks/notifications/dutyNotifications.ts` (ændret)
- `src/pages/DutyPage.tsx` (ændret: brug `useDutyEmployees`)
- `src/components/Duty/DutyAssignmentDialog.tsx` (ændret: cross-dept medarbejdere)
- `src/components/Duty/DutyEditDialog.tsx` (ændret)
- `src/components/Duty/DutySwapDialog.tsx` (ændret)
- `src/components/Duty/DutySwapSelectDialog.tsx` (ændret, hvis relevant)
- `src/components/Duty/DutyMonthCalendar.tsx` (ændret: afdelings-label)
- `src/components/Duty/DutyList.tsx` (ændret: afdelings-label)
- `src/components/Admin/FeatureToggleManagement.tsx` (ændret: tilføj delings-konfig)
- `src/translations/da/duty.ts` og `src/translations/en/duty.ts` (ændret)
- `src/translations/da/admin.ts` og `src/translations/en/admin.ts` (ændret)

### Dokumentation
- `docs/implementation-plan/tasks.md`
- `CHANGELOG.md`
- `docs/technical-specs/database-schema.md`
- `docs/product-roadmap/features.md`

## Risici og overvejelser
- **RLS-kompleksitet**: Nuværende `on_call_duties` RLS er åben. Planen strammer SELECT og ALL policies, men vi skal sikre at servicemedarbejderes egne rettigheder ("Users can reassign their own duties") ikke brydes.
- **Performance**: `in('department_id', ...)` med flere afdelinger kan være tungere; der findes allerede index på `on_call_duties.department_id`.
- **Sub-afdelinger**: Deling konfigureres på afdelingsniveau. Hvis en afdeling har underafdelinger, antages det at hele afdelingen deler vagter; sub-afdelingsisolation bevares inden for hver afdeling.
- **Demo-mode**: Demo-vagter (`is_demo = true`) påvirkes ikke; delingslogik gælder kun live-data.

## Afrunding
Når planen er godkendt, vil implementeringen begynde med database-migration (RLS + helper-funktioner), derefter hooks, UI-komponenter og admin-konfiguration, og afsluttes med dokumentation og verificering.