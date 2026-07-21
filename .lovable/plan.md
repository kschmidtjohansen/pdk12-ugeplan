## Plan

Jeg vil rette `/changelog`, så den igen viser både seneste og tidligere ændringer for den valgte afdeling — inkl. ny medarbejder og fri/ferie for Phillip Fogh.

## Bekræftet nuværende tilstand

- Phillip Fogh blev oprettet i `profiles` d. 20/7 kl. 12:32 og har afdeling `8c542620-9156-4155-b686-564b14a4ca62`.
- Phillip Fogh har en godkendt ferie/fraværsrække i `vacations` fra 20/7–26/7, oprettet kl. 12:33.
- `/changelog` henter kun fra `planner_change_log` + virtuelle events fra `vacations`.
- Medarbejderoprettelse bliver ikke skrevet til nogen changelog-kilde i den nuværende kode.
- Ferie-events hentes kun via `updated_at` indenfor datointervallet, og nuværende visning kan derfor miste relevante historiske events hvis status/tidsstempler ikke matcher forventningen.

## Ændringer

1. **Udvid changelog-modellen**
   - Tilføj nye operationstyper til `ChangeLogContext`:
     - `EMPLOYEE_CREATED`
     - `EMPLOYEE_UPDATED`
     - `EMPLOYEE_DELETED` hvis eksisterende delete-flow kan logges sikkert uden større omlægning
   - Bevar eksisterende opgave- og ferie-events.

2. **Vis medarbejderoprettelser i `/changelog`**
   - Lad `fetchChangeLogsByDateRange` hente relevante `profiles` indenfor datointervallet for den valgte afdeling.
   - Konverter dem til virtuelle changelog-rækker, så nyoprettede medarbejdere som Mette/Phillip vises uden database-migration.
   - Scope efter `home_department_id` og/eller `user_access.department_id`, så der ikke vises data på tværs af afdelinger.

3. **Gør ferie/fravær-events mere robuste**
   - Hent ferie/fravær på både `created_at`, `updated_at` og `reviewed_at` hvor relevant.
   - For pending vises oprettelsestidspunktet.
   - For approved/rejected/cancelled vises review-tidspunktet når det findes, ellers `updated_at`.
   - Sørg for at Phillip Fogh-rækken vises i `/changelog` som en ferie/fraværsændring.

4. **Opdater `/changelog` UI**
   - Tilføj ikoner/filter-labels for medarbejder-events.
   - Vis tydelig tekst som fx “Oprettet medarbejder Phillip Fogh”.
   - Bevar eksisterende kompakte layout og undgå dobbelt header.

5. **Dokumentation**
   - Opdater `/docs/implementation-plan/tasks.md` med fuldført rettelse.
   - Opdater `CHANGELOG.md` med præcis beskrivelse.
   - Bekræft at ændringen følger tekniske specs og UI-guidelines.

## Verifikation

- Tjek at `/changelog` med 14/30/90 dage viser:
  - Phillip Fogh oprettet som medarbejder.
  - Phillip Fogh fri/fravær oprettet/godkendt.
  - Eksisterende planner events stadig vises.
- Tjek at events kun scopes til den valgte afdeling.
- Kør relevant statisk/type-verifikation hvis nødvendigt efter implementering.