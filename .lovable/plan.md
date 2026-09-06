# Bil-valg virker ikke på mobil

## Problem
I opgave-dialogen på mobil åbnes bilvælgeren som en bundskuffe (drawer). Listen ser rigtig ud, men tryk på en bil registreres ikke som et valg — samme fejl som tidligere med sagsansvarlig- og medarbejdervælgeren. Listen bruger `div` med `onClick`, hvis klik opsluges af den overliggende dialog på mobil.

## Løsning
Spejl den rettelse, der allerede virker i `EmployeeSelector.tsx` og `ResponsibleUserSelector.tsx`, i `src/components/Planner/MultipleCarSelector.tsx`:

- Erstat hvert listepunkt (`div` med `onClick`) med en rigtig `<button type="button">` i fuld bredde.
- Reagér på selve trykket med `onPointerUp` (+ `stopPropagation`/`preventDefault`), og behold en neutral `onClick`, der kun stopper propagation — så flervalg af flere biler fortsat virker, og skuffen bliver åben.
- Behold eksisterende logik uændret: utilgængelige biler (`is_available === false`) forbliver ikke-vægbare, værksted-biler viser toast, og konflikt-advarslen (AlertDialog ved delvist bookede biler) udløses som i dag fra `handleCarClick`.
- Desktop-popover-adfærd ændres ikke — samme `renderCarList()` bruges begge steder, men knap-mønsteret er harmløst på desktop.

## Verifikation
- Typecheck.
- Mobilvisning: opret opgave → åbn bilvælger → vælg en bil → vælg en bil mere → gem.
- Desktop: bilvalg og konflikt-dialog virker som før.

## Teknisk
- Ændring kun i `src/components/Planner/MultipleCarSelector.tsx` (`renderCarList`, ca. linje 249–314).
- `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres efter implementering.
