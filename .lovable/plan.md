## Mål

1. Udvid "Seneste ændringer" til også at vise ferie-hændelser (oprettet, godkendt, afvist, annulleret) for **den aktivt valgte afdeling**.
2. Fjern automatisk medarbejdere fra opgaver, når de bliver fraværende (ferie godkendt, `on_leave` sat, eller kursus oprettet) — også på fremtidige dage.
3. Blokér oprettelse/redigering af flerdags-opgaver, hvis en valgt medarbejder har fri/fravær/kursus på én eller flere af dagene, med en tydelig fejlbesked der navngiver personen og dagen.

---

## 1. Ferie-hændelser i "Seneste ændringer"

**Datakilde:** `vacations` har allerede `status`, `updated_at`, `user_id`. Vi behøver ikke en ny tabel — vi mapper `vacations`-rækker til virtuelle log-poster i `ChangeLogContext`.

Ændringer:
- `src/context/ChangeLogContext.tsx`: hent seneste 50 vacations for brugere i den valgte afdeling (join via `user_access.department_id` + `profiles.home_department_id`), sammen med planner_change_log. Konvertér til `ChangeLogEntry`-lignende poster med `operation` = `VACATION_REQUEST | VACATION_APPROVED | VACATION_REJECTED | VACATION_CANCELLED`, sortér samlet på `created_at`/`updated_at`, slice(50).
- Realtime: tilføj `vacations`-INSERT/UPDATE subscription filtreret på schema.
- `src/components/Layout/NavComponents/ChangeLogList.tsx`: udvid `getOperationIcon` + `getChangeDescription` for de nye ferie-operationer (ikon: `CalendarCheck`, `CalendarX`, `Calendar`). Brug ansøgerens navn + periode (`dd.MM–dd.MM` eller "Hele ugen" konsistent med resten).
- `src/pages/ChangeLogPage.tsx`: udvid filter-options.
- Oversættelser: `changeLog.vacationRequested/Approved/Rejected/Cancelled` i `da/en`.

## 2. Auto-fjern fra opgaver ved fravær

Nuværende tilstand: `vacation-cleanup-assignments` køres kun ved *godkendelse*. Mark-eksemplet 22. juli tyder på, at ferien enten stadig er `pending` eller blev oprettet efter opgaven blev tildelt uden opdatering.

Ændringer:
- **Ferie-oprettelse:** Kald `vacation-cleanup-assignments` også når en ferie oprettes med `status='approved'` (fx admin der registrerer ferie direkte) — tilføj kald i `useVacationActions.createVacation` efter succesfuld insert, hvis status er approved.
- **Manuel `on_leave`:** I `useEmployeeActions` (medarbejder-opdatering), når `on_leave` skifter fra false→true, kald en ny variant af edge-funktionen (eller udvid eksisterende med `mode: 'on_leave' | 'vacation'`) der fjerner brugeren fra alle **fremtidige** `assignments_employees` og nulstiller `responsible_user_id`, uanset dato-interval (evt. fra dagens dato).
- **Kursus-oprettelse:** I `EmployeeTrainingDialog`s save-flow, kald samme cleanup for det angivne datointerval.
- **Edge function:** `supabase/functions/vacation-cleanup-assignments/index.ts` udvides så den accepterer `{ userId, startDate, endDate }` som alternativ til `vacationId`, så den kan bruges af både ferie, on_leave og kursus.
- UI-refresh: invalider `assignments` + `optimizedAssignments` query-cache efter cleanup.

## 3. Validering ved oprettelse af flerdags-opgaver

Nuværende `useAssignmentConflicts` håndterer kun tidsoverlap — ikke fravær.

Ændringer:
- Ny helper `src/utils/assignmentAvailabilityValidation.ts` med `validateEmployeesAvailable(employeeIds, dateRange, { vacations, employees, trainings })` → returnerer array af `{ employeeId, name, date, reason: 'vacation' | 'on_leave' | 'training' }`.
- `src/components/Planner/AssignmentForm.tsx` (`handleSubmit`): efter eksisterende konfliktcheck, kør availability-validering for hele datointervallet (fra `startDate` til `endDate` når det er en serie, ellers enkelt dato). Ved fund: `toast.error` med besked som _"Kan ikke oprette opgaven: Mark har fri onsdag 22. juli"_ (multi-linje ved flere fund) og `return` uden at gemme.
- Oversættelser: `planner.errors.employeeUnavailableOnDate` + varianter for `vacation/onLeave/training` i `da/en`.
- Gælder både oprettelse og redigering. Skadeleder/admin får samme validering (ingen bypass) medmindre I ønsker en override — spørges ikke om her, default = ingen override.

## Dokumentation

- `CHANGELOG.md`: kort punktopstilling af de tre ændringer.
- `docs/implementation-plan/tasks.md`: markér med `[x]`.

---

## Teknisk noter

- Afdelingsfilter til ferie-feed: brug samme mønster som `ChangeLogContext` allerede har med `assignments` — men her via `user_access` + `home_department_id`. Skadeleder/admin med adgang til flere afdelinger ser stadig kun den *valgte*.
- Edge-funktionen skal fortsat validere caller-rettigheder (er allerede sat op via service role).
- Kursus-cleanup må ikke fejle stille — vis toast ved fejl så admin ved besked.

## Ingen ændringer
- Ingen ny tabel, ingen RLS-ændringer.
- Ingen ændring af hvordan planner_change_log genereres for opgaver.