## Mål
"Fuldt booket"-status skal ikke længere være afhængig af afdelingens arbejdstid (8–16 / 8–15:30), men beregnes ud fra den samlede varighed af medarbejderens opgaver på dagen. Hvis summen er ≥ 8 timer → Fuldt booket.

## Ændringer

### `src/utils/employeeAvailability.ts`
- Fjern `getWorkdayEndTime` (ikke længere relevant).
- Tilføj hjælpefunktion `getTotalAssignmentMinutes(assignments)` der summerer `(toTime − fromTime)` i minutter for alle dagens opgaver for medarbejderen.
- Erstat `endsAtOrAfterClosing`-tjekket med:
  - `totalMinutes >= 480` (8 timer) → `fullyBooked`
  - Ellers `partiallyBooked` med `availableAt = latestEndTime` (uændret tekst "ledig efter HH:MM").
- Bevar `getLatestEndTime` (bruges stadig til at vise hvornår de er ledige igen).

### Dokumentation
- `CHANGELOG.md`: Tilføj punkt under 2026-06-18: "Fuldt booket beregnes nu ud fra ≥ 8 timers samlet opgavetid i stedet for afdelingens arbejdstid."
- `docs/implementation-plan/tasks.md`: Markér tilsvarende opgave som `[x]`.

## Tekniske detaljer
- Tærskel: præcis 8 timer = 480 minutter (≥ giver fuldt booket).
- Overlappende opgaver tælles som summen af deres varigheder (samme adfærd som hidtil — der laves ikke deduplikering med mindre du ønsker det).
- Ingen ændringer til DB, RLS eller andre komponenter — `getEmployeeAvailabilityStatus`'s signatur og returtype er uændrede.

## Spørgsmål
Hvis to opgaver overlapper tidsmæssigt (fx 08–12 og 10–14), skal det da tælle som 8 timer (sum) eller 6 timer (faktisk dækning)? Default i planen er **sum** for at holde det simpelt og konsistent med nuværende beregningsstil.