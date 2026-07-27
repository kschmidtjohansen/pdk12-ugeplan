## Mål
Man skal kunne planlægge en periode (enkelt dag eller fra-til) hvor en bil er ikke tilgængelig — fx værkstedsbesøg. Når startdatoen indtræffer bliver bilen automatisk markeret ikke tilgængelig i planlægger/dashboard, og den forbliver ikke tilgængelig indtil brugeren aktivt frigiver den igen. Eksisterende opgaver der bruger bilen i perioden får bilen fjernet automatisk (samme mønster som ferie/fravær for medarbejdere).

## Datamodel
Ny tabel `car_unavailability` i public-skemaet:
- `car_id` (FK til cars)
- `start_date`, `end_date` (date; end_date >= start_date, enkelt dag = samme værdi)
- `reason` (text, fx "Værkstedsbesøg")
- `notes` (text, valgfri)
- `department_id` (nedarvet fra bilen — bruges til RLS/isolation)
- `released_at` (timestamptz, null = stadig aktiv; sættes når brugeren manuelt frigiver bilen)
- `released_by` (uuid, hvem der frigav)
- `created_by`, `created_at`, `updated_at`

Grants + RLS: læs for authenticated i egen afdeling, skriv for admin/skadeleder i egen afdeling. Service role fuld adgang.

## Automatik (edge function + cron)
Ny edge function `car-availability-sync` som kører hvert 5. minut:
1. For hver aktiv `car_unavailability` hvor `start_date <= i dag` og `released_at IS NULL`: sæt `cars.is_available = false` hvis ikke allerede.
2. Fjern bilen fra alle `assignments` (både `car_id` og `car_ids`) der ligger inden for perioden — genbruger samme oprydningslogik som `vacation-cleanup-assignments`. Logger til `planner_change_log`.
3. Rører IKKE `end_date` — bilen frigives kun manuelt (jf. valget "utilgængelig indtil manuelt frigivet").

Samme oprydning køres også synkront når en ny markering oprettes, så brugeren straks ser konflikterne fjernet.

## UI
**På /cars siden:**
- Ny handling pr. bil: "Planlæg værkstedsbesøg" (i eksisterende actions-menu ved siden af "Marker ikke tilgængelig").
- Dialog `CarScheduledUnavailabilityDialog`: datepicker for start + end (end default = start, kan slås til "flere dage"), felt for årsag (default "Værkstedsbesøg"), noter, liste over konfliktende opgaver med besked "Bilen fjernes fra disse opgaver".
- Bilens kort viser badge "Planlagt værksted d. DD.MM" hvis der findes en fremtidig eller aktiv markering.
- Når bilen er i aktiv periode: eksisterende "Marker som tilgængelig"-handling frigiver også `car_unavailability` (sætter `released_at`), så automatikken ikke straks slår den utilgængelig igen.
- Nyt filter-segment "Planlagt værksted" udover Alle/Tilgængelige/Optaget.

**I planlægger/dashboard:**
- Bilen filtreres væk fra "Tilgængelige biler" som i dag (via `is_available`), og får en tydelig "Værksted"-label i selectors — samme mønster som "Kursus"-label for medarbejdere.

## Ændringer i eksisterende filer
- `src/services/carSecurityService.ts` — hjælpefunktioner til at hente/oprette/frigive markeringer.
- `src/hooks/car/useCarActions.ts` — nye actions `scheduleUnavailability`, `releaseUnavailability`; `markCarAvailable*` frigiver også aktive perioder.
- `src/hooks/car/useCarData.ts` — henter aktive/kommende markeringer sammen med biler.
- `src/components/Cars/CarsList.tsx` + `MobileCarCard.tsx` + `CarsTable.tsx` — badge og ny handling.
- `src/components/Cars/CarDialogs.tsx` — inkludér den nye dialog.
- Bil-selector komponenter (planner) — vis "Værksted"-label når `is_available=false` og bilen har aktiv `car_unavailability`.
- Oversættelser (`da/cars.ts`, `en/cars.ts`).

## Migration + edge function schedule
- SQL-migration opretter tabel, grants, RLS-policies, updated_at-trigger, samt cron-schedule (pg_cron) der kalder edge functionen hvert 5. minut.

## Dokumentation
- `docs/implementation-plan/tasks.md`: nyt punkt afkrydset.
- `CHANGELOG.md`: notér feature.
- `docs/technical-specs/data-models.md`: beskriv `car_unavailability`.

## Rækkefølge
1. DB-migration (tabel, RLS, cron).
2. Edge function `car-availability-sync` + genbrug af oprydningslogik.
3. Service + hooks.
4. UI (dialog, badges, actions, selector-labels).
5. Oversættelser + docs/changelog.
