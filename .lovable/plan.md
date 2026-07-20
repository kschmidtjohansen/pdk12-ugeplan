## Årsag

I sidste tur tilføjede jeg afdelings-scoping til `fetchChangeLogsByDateRange` i `ChangeLogContext.tsx`. Den bruger `.in('assignment_id', deptAssignmentIds)`, hvilket:

1. **Ekskluderer rækker med `assignment_id = NULL`** (der er 358 sådanne rækker de sidste 30 dage — bl.a. bulk-PUBLISH events).
2. **Ekskluderer rækker hvor tilknyttet opgave er slettet** (DELETE-events forsvinder, fordi den slettede sag ikke længere findes i `assignments`-tabellen og derfor ikke matcher afdelings-listen).

Resultatet: `/changelog` filtrerer stort set alt væk.

## Rettelse

I `src/context/ChangeLogContext.tsx` → `fetchChangeLogsByDateRange`:

- Behold afdelings-scoping på ferie-siden (via `user_id` i valgt afdeling).
- For planner-loggen: hent alle logs i tidsrummet, og filtrer i JavaScript på klient-siden:
  - Behold rækken hvis `assignment_id IS NULL` (bulk-events skal altid vises).
  - Behold rækken hvis dens `assignment_id` findes i afdelingens opgaver.
  - Behold rækken hvis dens `assignment_id` ikke længere findes i `assignments` (dvs. slettede sager — så DELETE-events forbliver synlige).
- Fald tilbage til uscopet visning hvis ingen afdeling er valgt.

Det matcher intentionen med drawer-visningen, men mister ikke DELETE- og bulk-PUBLISH-events.

## Verifikation

Efter ændringen skal `/changelog` med 14/30 dages filter vise både opgave-ændringer og feriehandlinger for den valgte afdeling, inkl. slettede sager og bulk-publiceringer.