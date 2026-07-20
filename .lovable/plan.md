## 1. Vis hvem der har godkendt/afvist ferie i "Seneste ændringer"

**Problem:** `vacations`-rækker gemmer ikke hvem der reviewede anmodningen, så `ChangeLogContext` bruger ferie-ejerens navn i alle events (også ved afvisning/godkendelse). Man kan derfor ikke se hvem der har afvist Ronnies fri-ønske.

**Løsning:**

**DB-migration** (`vacations`):
- Tilføj `reviewed_by uuid references auth.users(id)` og `reviewed_at timestamptz`.
- Ingen ændringer i RLS-politikker (kolonnerne bruger eksisterende UPDATE-adgang for administrator/skadeleder).

**Kode:**
- `useVacationActions.ts`: Sæt `reviewed_by = user?.id, reviewed_at = now()` i UPDATE-payload for approve, reject **og** cancel-when-admin-cancels-someone-else.
- `ChangeLogContext.tsx`:
  - Udvid vacations-select med `reviewed_by, reviewer:profiles!reviewed_by(name)`.
  - I `vacationRowToEntry`: For status `approved | rejected | cancelled` sæt `changed_by = reviewed_by || user_id` og `changed_by_name/first_name = reviewer?.name`. Behold `change_details.user_name` som den ansatte det gælder.
- `ChangeLogList.tsx` + `ChangeLogPage.tsx`: Beskrivelserne viser allerede `changed_by_first_name` foran teksten (fx "Mads · Godkendte fri · Ronnie (11.06–15.06)"). Justér `getChangeDescription` så ejerens navn altid vises efter operationen, uafhængigt af hvem der reviewede.
- Tilføj ferie-ikoner + operations-filter (`VACATION_REQUESTED/APPROVED/REJECTED/CANCELLED`) i `ChangeLogPage.tsx`, så man kan filtrere på fri-hændelser (i dag mangler de i `getOperationIcon` og select).

**"Tidligere ændringer":** Nuværende `fetchChangeLogs` limit=50. Bevar limit i dropdown-panelet, men `/changelog`-siden bruger allerede `fetchChangeLogsByDateRange` (7/14/30 dage). Bekræft at date-range-funktionen også afdelings-filtrerer (den gør den ikke i dag) — tilføj samme dept-filter som `fetchChangeLogs`.

## 2. Dobbelt header på `/changelog`

**Årsag:** `App.tsx` line 158 wrapper allerede routen: `<MainLayout><ChangeLogPage /></MainLayout>`, og `ChangeLogPage` wrapper igen med `<MainLayout>` internt. To top-bars renders.

**Løsning:** Fjern det indre `<MainLayout>`-wrap (og access-denied-varianten) i `ChangeLogPage.tsx` og behold kun det ydre wrap fra routen. Bevar `DataFetchErrorBoundary`.

## 3. Detaljeret fejl ved fravær/ferie-blok på flerdags-oprettelse

**Nuværende:** `AssignmentForm` viser allerede en inline banner med række-liste (navn + dato + reason-badge). Toast'en `allDatesConflict` er meget kortfattet.

**Løsning i `AssignmentForm.tsx`:**
- Gruppér `conflictDetails` per medarbejder i banneren: én blok pr. person med navn + samlet liste af datoer og årsag pr. dato (fx "Henrik · Kursus: 11.05–22.06 (5 datoer)"). Sammenkæd sammenhængende datoer til intervaller (samme helper som `VacationGridOverview`'s coversWholeWeek/mergeRanges).
- Skift banner-overskrift til `t('planner.conflicts.absenceBlockTitle')` når `hasBlockingConflicts` er sandt, og udvid `absenceBlockDescription` med antal blokerende medarbejdere/datoer.
- Behold "Fortsæt alligevel"/"Book kun ledige" skjult ved absence-konflikter (allerede tilfældet), men vis en sekundær handling "Fjern medarbejder(e) og fortsæt" der auto-filtrerer de blokerede employee-IDs fra `formData.employees` inden re-submit.
- Erstat `allDatesConflict`-toast med en toast der siger "X medarbejdere blokerer på Y datoer — se detaljer nedenfor" og scroll banneret ind i view.

Nye oversættelser i `planner.conflicts`: `absenceBlockTitle`, `absenceBlockSummary`, `removeBlockedAndContinue`, `datesLabel`.

## Filer der ændres

- `supabase` migration: `vacations.reviewed_by`, `vacations.reviewed_at`
- `src/hooks/vacation/useVacationActions.ts`
- `src/context/ChangeLogContext.tsx`
- `src/components/Layout/NavComponents/ChangeLogList.tsx`
- `src/pages/ChangeLogPage.tsx` (fjern dobbelt MainLayout + tilføj ferie-filter)
- `src/components/Planner/AssignmentForm.tsx`
- `src/translations/{da,en}/planner.ts` og `changeLog.ts`
- `CHANGELOG.md` + `docs/implementation-plan/tasks.md`
