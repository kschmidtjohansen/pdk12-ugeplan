# Fugtteknikere kan tildeles skadeledervagt

## Mål
Medarbejdere med rollen **fugttekniker** skal kunne vælges til skadeledervagt på lige fod med administratorer, super admins og skadeledere — både ved oprettelse, redigering og vagtbytte.

## Ændringer

### Synligt for brugeren
- Fugtteknikere vises nu i medarbejdervælgeren, når vagttypen er "Skadeledervagt":
  - `src/components/Duty/DutyEmployeeSelector.tsx` — rollefilteret udvides med `fugttekniker`
  - `src/components/Duty/DutyAssignmentDialog.tsx` — samme filter ved oprettelse (linje 70)
  - `src/components/Duty/DutyEditDialog.tsx` — samme filter ved redigering (linje 70)
  - `src/components/Duty/DutySwapDialog.tsx` — samme filter ved valg af byttekandidat (linje 42)

### Sikring i baggrunden
- **Database**: Funktionen `validate_duty_assignment()` (trigger på vagttabellen) genskabes, så `fugttekniker` accepteres som gyldig rolle for skadeledervagt. Samtidig bringes den i overensstemmelse med projektets sikkerhedsstandard (`SET search_path = ''`, kald revokes fra PUBLIC/anon/authenticated).
- **Vagtbytte (edge function `swap-duties`)**: Rollevalideringen for skadeledervagt udvides med `fugttekniker` — både ved overtagelse af en ledig vagt (linje 167) og ved bytte mellem to medarbejdere (linje 189-190). Ved overtagelse tilføjes også `super_admin`, som i dag utilsigtet afvises dér.
- Fejlbeskederne opdateres, så de nævner fugtteknikere som gyldige.

## Verifikation
- Typecheck uden fejl (`npx tsgo --noEmit -p tsconfig.json`).
- CHANGELOG.md opdateres, og opgaven markeres i docs/implementation-plan/tasks.md.

## Tekniske detaljer
- Rollefiltrering i frontend sker på den effektive rolle (højeste rolle pr. medarbejder), så en medarbejder med både fugttekniker og en højere rolle allerede er dækket — ændringen gælder rene fugtteknikere.
- Databasetriggeren ændres via `CREATE OR REPLACE FUNCTION`; triggeren selv genbruges.
