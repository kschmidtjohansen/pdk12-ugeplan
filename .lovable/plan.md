# Medarbejdere valgt til sagen skal altid kunne fravælges

## Problem
I opgavedialogen er en medarbejder låst, så snart systemet vurderer, at personen er optaget (fuldt booket, ferie, fravær, kursus m.m.). Det gælder desværre også de medarbejdere, der allerede er valgt til netop denne opgave — derfor kan skadeledere i Hillerød ikke fjerne dem igen.

## Løsning
En medarbejder, der allerede er sat på den aktuelle opgave, skal altid kunne klikkes af igen. Låsningen gælder fremover kun medarbejdere, der ikke er valgt til opgaven.

- Allerede valgt = kan altid fjernes (og sættes på igen).
- Ikke valgt og optaget (fuldt booket, ferie, fravær, kursus, udløbet/inaktiv) = fortsat låst med samme labels som i dag.
- Etiketter som "Kursus", "Ferie" og "Fuldt booket" bliver stående, så det stadig er tydeligt, hvorfor personen er optaget.

## Teknisk
- `src/components/Planner/EmployeeSelector.tsx`: beregn `isDisabled` som i dag, men tilføj `&& !isSelected` (fx `const isLocked = !isSelected && (…)`) og brug den til `disabled` på knap og checkbox, til styling og til klik-guarden i `onPointerUp`.
- Ingen ændringer i tilgængeligheds- eller konfliktlogik (`employeeAvailability.ts`, ferie-/kursus-hooks).
- Efter ændringen: typecheck og opdatering af `CHANGELOG.md` samt `docs/implementation-plan/tasks.md`.
