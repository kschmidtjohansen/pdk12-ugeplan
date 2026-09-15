# Syge medarbejdere vises som fraværende i ugeplanen

Anders Axelsen er markeret som syg i dag (15-09-2026) i afdeling 12, og markeringen ligger korrekt på selve datoen i databasen. Det betyder, at raskmelding allerede sker automatisk ved dagsskifte: der findes kun en markering for den ene dato, og tidligere dage (fx 09.-11. september i afdeling 03) står som afsluttede. Der skal derfor ikke laves noget ekstra for dagsskiftet — kun bekræftes, at intet i planlægningen bruger en fastlåst dato.

Det, der mangler, er visningen i ugeplanen.

## Hvad der ændres

**Ikke tildelte ressourcer**
- Syge medarbejdere fjernes fra listerne over ledige skadeledere, fugtteknikere og servicemedarbejdere for den valgte dag.
- De vises i stedet i fraværsoversigten sammen med kursus og ferie, med mærket "Syg" for administratorer og skadeledere og "Fraværende" for alle andre roller.
- Tællerne for ledige medarbejdere tæller ikke længere den syge med.

**Medarbejdervælgeren**
- Syge medarbejdere er allerede låst for den dag, men uden forklaring. Der tilføjes låseteksten "Syg" for administratorer og skadeledere og "Fraværende" for øvrige roller, så det er tydeligt hvorfor personen ikke kan vælges.
- Efter ændringen kontrolleres det, at en syg medarbejder faktisk ikke kan vælges — hverken ved klik eller med tastaturet.

## Teknisk

- `UnassignedResourcesSection.tsx`: kald `useSickForDateValue(targetDate)`, filtrér `sickIds` fra i `categorizedByRole` (samme mønster som `trainingIds`) og tilføj en syge-gruppe i fraværsvisningen ved siden af `employeesOnTraining`. Mærkatet styres af `canSeeSickReason`.
- `EmployeeSelector.tsx`: udvid `lockReason`-kæden med et syge-tilfælde (efter ferie/orlov, før kursus) baseret på `sickIdsForDate` og `canSeeSickReason`; `disabledIdSet` indeholder allerede syge.
- Nye oversættelsesnøgler i `da`/`en` (`employees.lockedReasonSick`, `employees.absentGeneric`) i stedet for hårdkodet tekst; eksisterende "Kursus"-mønster følges for badges via `StatusBadge`-tokens (ingen hårdkodede farver).
- Ingen databaseændringer. `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres til sidst.
