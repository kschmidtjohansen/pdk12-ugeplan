## Filter i Ferieoversigt (Grid-visning)

### Mål
Tilføj en filter-bar i toppen af grid-visningen, så brugeren kan slå farverne til og fra individuelt. Dvs. man kan vælge kun at se ferie, kun kursus, kun fravær, kun vagter — eller en kombination.

### Hvad bygges
1. **Filter-komponent** placeres under dato-vælgeren i `VacationGridOverview`.
   - Små toggle-knapper med farvet prik + label for hver type:
     - Ferie (sort)
     - Kursus (gul)
     - Fravær (rød)
     - Skadeledervagt (blå)
     - Kørevagt (grøn)
   - Klik på en knap slår den pågældende type til/fra.
   - Som standard er alle slået til.

2. **Grid-rendering** i `VacationGridOverview`:
   - `pickKind()` tjekker kun aktiverede typer.
   - Hvis en dag kun har inaktiverede typer, vises cellen som tom.

### Tekniske detaljer
- State: `Set<CellKind>` eller `Record<CellKind, boolean>` – React `useState`.
- Ingen DB-ændringer. Pure frontend-filter.
- Hvis alle filtre slås fra, vises grid tomt (intet farvet).
- Oversættelser opdateres i `da/vacation.ts` og `en/vacation.ts`.

### Dokumentation
- `CHANGELOG.md` opdateres.
- `.lovable/plan.md` opdateres hvis aktiv.