# Vikar-forlængelse: dedikeret forlæng-knap + dato-validering

## Mål
I `EmployeeFormDialog` skal det være tydeligt at forlænge en vikars udløbsdato, og det skal være umuligt at forlænge til en dato, der ligger før i dag eller før den nuværende udløbsdato.

## Nuværende tilstand (bekræftet ved læsning)
- Redigering af en vikar viser allerede et datofelt "Ny udløbsdato" med hurtigvalg (+1 uge, +2 uger, +1 måned, +3 måneder) regnet ud fra den nuværende udløbsdato.
- Valideringen tjekker i dag kun, at datoen er i fremtiden (`expiry < startOfToday()`) — ikke at den er EFTER den nuværende udløbsdato. Man kan altså utilsigtet forkorte vikarens periode.

## Ændringer
1. **Forlæng-knap** i vikar-sektionen i `EmployeeFormDialog.tsx`:
   - En fremtrædende knap "Forlæng ansættelse" der udfylder datofeltet med et standardinterval (f.eks. +1 måned fra nuværende udløbsdato) — hurtigvalgene bevares som alternativer.
   - Knap og hurtigvalg regner altid ud fra det seneste af: nuværende udløbsdato eller i dag (så en udløbet vikar forlænges fra i dag).
2. **Validering ved gem** (udbyg eksisterende blok omkring linje 134):
   - Ny dato skal være >= i dag (bevares).
   - Ny dato må ikke ligge FØR den nuværende udløbsdato. Hvis den gør, vises fejlbesked: "Den nye udløbsdato kan ikke ligge før den nuværende udløbsdato (d. {dato})".
   - Datofeltets `min`-attribut sættes til det seneste af i dag / nuværende udløbsdato, så browseren også blokerer ugyldige datoer.
3. **Forhåndsvisning**: den eksisterende "ny udløbsdato"-tekst bevares og viser tydeligt forlængelsen.
4. Nye oversættelser da/en: `extendEmployment` ("Forlæng ansættelse"), `expiryBeforeCurrent` (fejlbesked).

## Tekniske detaljer
- Fil: `src/components/Employees/EmployeeFormDialog.tsx` + `src/translations/da/employees.ts` + `src/translations/en/employees.ts`.
- Ingen ændring i `useEmployeeActions.ts` (gem-logik med slut-af-dag bevares) og ingen databaseændringer.
- Konvertering til permanent nulstiller stadig udløbsdato som i dag.

## Verifikation
- Typecheck (`bunx tsgo --noEmit`) uden fejl.
- Lokal preview svarer HTTP 200.
- Opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.
