
Mål: Få “Tilføj ny bruger” (Admin → Brugere) til at understøtte **“Uden afdeling”** for IT-support/Super Admin, så fejlen “Vælg mindst én afdeling for brugeren” ikke blokerer oprettelse.

1) Bekræftet årsag
- Fejlen kommer fra `src/components/Admin/UserFormDialog.tsx` (validering kræver altid mindst 1 afdeling).
- Den tidligere ændring blev lavet i medarbejder-flowet (`EmployeeFormDialog` / `useEmployeeCreation`), men screenshot er fra **Admin-bruger-flowet**.

2) Implementeringsplan (kode)
- Opdater `src/components/Admin/UserFormDialog.tsx`:
  - Tilføj lokal state: `skipDepartment` (default:
    - `true` ved ny bruger når rolle = `super_admin`
    - ved redigering af eksisterende super_admin uden `user_access` sættes også `true`).
  - Tilføj UI-valg: checkbox **“Uden afdeling (IT-support)”** (kun synlig når rolle = `super_admin`).
  - Når checkbox aktiveres:
    - ryd `selectedDeptIds` + `selectedSubDeptMap`.
    - skjul/deaktivér afdeling/subafdeling-sektionen.
  - Validering:
    - kræv afdeling kun når `skipDepartment === false`.
    - `super_admin` må oprettes uden afdeling når `skipDepartment === true`.
  - Gemmelogik:
    - refaktorér adgangs-gemning så den håndterer begge cases:
      - Med afdeling: gem `user_access` + `profiles.home_department_id`.
      - Uden afdeling: fjern evt. eksisterende `user_access` og sæt `profiles.home_department_id = null`.

- Opdater `src/components/Admin/UserManagement.tsx` kun hvis nødvendigt for prop-typer/eventflow (så rolle-skift og dialogstate er konsistent).

3) Oversættelser
- Opdater:
  - `src/translations/da/admin.ts`
  - `src/translations/en/admin.ts`
- Tilføj nøgler under `admin.userManagement` til:
  - skipDepartment label
  - forklaringstekst
  - valideringsfejl for “mindst én afdeling” (så hardcoded tekst fjernes).

4) Onboarding-opdatering
- Opdater `ONBOARDING.md` sektion 8:
  - Præcisér at “Uden afdeling (IT-support)” findes i **Admin → Brugere → Tilføj ny bruger** for Super Admin.
  - Tilføj kort fejlsøgning: hvis man ser “Vælg mindst én afdeling…” skal Super Admin markere “Uden afdeling” eller vælge afdeling.

5) Knowledge-overholdelse (indbygget i løsningen)
- Super Admin-rolle forbliver kun synlig/assignable for eksisterende super_admin.
- Roller forbliver server-side i `user_roles` (ingen client-side privilege checks).
- Multi-tenant isolation for driftsbrugere bevares; “uden afdeling” tillades kun i super_admin-scenariet.

Tekniske detaljer
- Primær fil med bug: `src/components/Admin/UserFormDialog.tsx` (nuværende hard-stop på `selectedDeptIds.length === 0`).
- Ingen DB-migration nødvendig.
- Ingen ændring i edge function påkrævet (`admin-create-user` håndterer ikke afdelingstilknytning direkte).

Validering efter implementering (hurtig testplan)
1. Opret bruger med rolle `super_admin` + “Uden afdeling” = ON → skal oprettes uden fejl.
2. Opret `administrator` uden afdeling → skal fortsat blokkeres.
3. Opret `super_admin` med “Uden afdeling” = OFF + valgt afdeling → normal oprettelse.
4. Redigér eksisterende super_admin og slå “Uden afdeling” til → `user_access` fjernes og `home_department_id` nulstilles.
5. Verificér at ONBOARDING afspejler den nye adfærd.
