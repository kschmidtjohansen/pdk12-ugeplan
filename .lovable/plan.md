# Forlæng vikar-udløbsdato

## Mål
Når en skadeleder/administrator redigerer en vikar, skal man kunne forlænge vikarens udløbsdato direkte i medarbejder-formularen — uden at skulle oprette vikaren på ny.

## Nuværende tilstand
- Edit-formularen (`EmployeeFormDialog.tsx`) viser et gult vikar-panel med teksten "Udløber d. X" og kun valget "Konvertér til permanent".
- Udløbsdatoen kan kun sættes ved oprettelse af en vikar, ikke ved redigering.
- `useEmployeeActions.ts` sætter kun `expires_at` ved konvertering til permanent (nulstilles til null).

## Ændringer

### 1. Datofelt i vikar-panelet (EmployeeFormDialog.tsx)
- I det gule vikar-panel tilføjes et datofelt "Ny udløbsdato" med vikarens nuværende `expires_at` som startværdi.
- Hurtigvalg som små knapper: **+1 uge**, **+2 uger**, **+1 måned**, **+3 måneder** — udfylder datofeltet ud fra den nuværende udløbsdato.
- Panelets info-tekst opdateres, så man tydeligt ser forskellen mellem gammel og ny dato, når man har ændret den.

### 2. Validering
- Datoen skal ligge i fremtiden (efter i dag) — ellers vises en fejl og der kan ikke gemmes.
- Hvis "Konvertér til permanent" er slået til, skjules datofeltet, da udløbsdatoen fjernes.

### 3. Gem-logik (useEmployeeActions.ts)
- `updatePayload.expires_at` sættes til den nye dato (slut af dag, 23:59), når en vikar redigeres uden konvertering.
- Ved konvertering til permanent nulstilles `expires_at` som i dag.
- Ingen ændring i edge functions eller rettigheder — bruger den eksisterende profil-opdatering.

### 4. Oversættelser
- Nye nøgler på dansk og engelsk: `extendVikarExpiry`, `newExpirationDate`, `expirationMustBeFuture`, hurtigvalgs-labels (`+1 uge` osv.).
- Filer: `src/translations/da/employees.ts`, `src/translations/en/employees.ts`.

## Tekniske detaljer
- Berørte filer: `src/components/Employees/EmployeeFormDialog.tsx`, `src/hooks/employee/useEmployeeActions.ts`, `src/hooks/employee/useEmployeeFormState.ts` (form-state for `expires_at` i edit-mode), translations da/en.
- Ingen database-migration nødvendig — `profiles.expires_at` findes allerede.

## Verifikation
- Typecheck (`bunx tsgo --noEmit`).
- Åbn en vikar på medarbejdersiden, forlæng datoen, gem, og bekræft at den nye dato vises.
- Bekræft at konvertering til permanent stadig virker, og at udløbne vikarer igen får adgang efter forlængelse.
- Opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.
