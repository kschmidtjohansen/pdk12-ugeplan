## Status
Den tidligere `useAutoPublishAssignments`-hook (client-side, kørte kun når en bruger var logget ind) blev fjernet i dead-code-oprydningen. Changeloggen sagde den var "afløst af edge function + DB cron", men **det blev aldrig faktisk oprettet** — der findes ingen `auto-publish` edge function og ingen cron-job i databasen i dag. Derfor publiceres opgaver aldrig automatisk lige nu.

## Mål
Hver dag kl. 00:01 Europe/Copenhagen skal alle ikke-publicerede opgaver, hvor `assignment_date` ≤ dagens dato (Copenhagen-tid), automatisk markeres som `published = true`.

## Plan

### 1. SQL: ny DB-funktion `public.auto_publish_due_assignments()`
- `SECURITY DEFINER`, `SET search_path = ''` (jvf. core security rules).
- Opdaterer:
  ```sql
  UPDATE public.assignments
  SET published = true, updated_at = now()
  WHERE published = false
    AND assignment_date <= (now() AT TIME ZONE 'Europe/Copenhagen')::date;
  ```
- Returnerer antal opdaterede rækker.
- Logger til `public.logs` med `event_type = 'auto_publish'` hvis count > 0.
- Idempotent: kan trygt køres mange gange.

### 2. pg_cron job
- Navn: `auto-publish-assignments`.
- Schedule: `* * * * *` (hvert minut). Matcher samme pattern som `cleanup-demo-data-ttl`. Funktionen er billig (én indekseret UPDATE) og idempotent. Det giver max ~1 minuts forsinkelse efter midnat — opfylder "00:01"-kravet.
- Kommando: `SELECT public.auto_publish_due_assignments();`

### 3. Tidszone-håndtering
- pg_cron kører i UTC, men funktionen sammenligner mod `(now() AT TIME ZONE 'Europe/Copenhagen')::date` — så DST håndteres korrekt automatisk.

### 4. Verifikation
- Test manuelt med `SELECT public.auto_publish_due_assignments();` efter migration.
- Tjek at cron-jobbet er registreret: `SELECT * FROM cron.job WHERE jobname = 'auto-publish-assignments';`.

## Filer / DB-objekter
- **Ny migration** (via migrations-tool): funktion + grant + cron-schedule.
- `CHANGELOG.md` + `docs/implementation-plan/tasks.md`.
- Ingen ændringer i frontend-kode — auto-publish kører nu udelukkende server-side.

## Out of scope
- Ingen edge function (unødvendig — pure SQL er hurtigere og mere pålideligt).
- Ingen ændring af manuelt "Publicer dag"-flow i Planner.
- Ingen historik-rensning af eksisterende uvist-publicerede opgaver fra fortiden — funktionen vil ved første kørsel også publicere dem (de matcher `assignment_date <= today`). Dette er det forventede catch-up-resultat.
