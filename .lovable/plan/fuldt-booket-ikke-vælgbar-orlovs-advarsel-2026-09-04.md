# Fuldt booket = ikke vælgbar + orlovs-advarsel

## Del 1: Fuldt bookede medarbejdere kan ikke vælges

I dag vises "Fuldt booket" (8+ timer) som en rød label i medarbejdervælgeren, men medarbejderen kan stadig vælges. Delvist bookede (under 8 timer) kan allerede vælges til flere opgaver — det bevares.

**Ændring i `src/components/Planner/EmployeeSelector.tsx`:**
- Tilføj `isFullyBooked` (status `fullyBooked` fra `getEmployeeAvailabilityStatus`) til `isDisabled`-betingelsen, så fuldt bookede medarbejdere ikke kan klikkes/vælges.
- Delvist bookede (`partiallyBooked`, under 8 timer) forbliver vælgbare med gul "Ledig efter HH:MM"-label som i dag.
- Gælder på tværs af valgte datoer: medarbejderen deaktiveres, hvis de valgte datoer giver 8+ bookede timer.

Bemærk: Tidsrumskonflikt-tjekket ved gem i `AssignmentForm.tsx` findes allerede og røres ikke.

## Del 2: Bekræftelsesdialog ved "På orlov"

I dag slås "På orlov" til i medarbejderformularen uden nogen advarsel.

**Ændring i `src/components/Employees/EmployeeFormDialog.tsx`:**
- Når "På orlov" slås **til** (fra → til), vises en bekræftelsesdialog (AlertDialog) før markeringen gennemføres.
- Dialogteksten forklarer tydeligt konsekvenserne:
  - Medarbejderen markeres som fraværende og kan ikke vælges til nye opgaver eller vagter.
  - Eksisterende/fremtidige opgaver fjernes **ikke** automatisk — de skal håndteres via fri-ønsker/fravær med konkrete datoer.
  - Handlingen kan fortrydes ved at slå orlov fra igen.
- "Bekræft" sætter markeringen, "Annuller" lader den være slået fra.
- Slås orlov **fra**, sker det uden dialog.
- Nye oversættelsesnøgler tilføjes i `src/translations/da/employees.ts` og `src/translations/en/employees.ts`.

## Tekniske detaljer
- Berørte filer: `EmployeeSelector.tsx`, `EmployeeFormDialog.tsx`, oversættelser (da/en).
- Verificering: `bunx tsgo -p tsconfig.app.json --noEmit` + manuel visuel kontrol af vælger og dialog.
- `CHANGELOG.md` opdateres efter endt arbejde.
