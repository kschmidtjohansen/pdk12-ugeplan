# Plan: Auto-fjern medarbejder fra opgaver ved godkendt fri

Når en fri-anmodning godkendes, fjernes medarbejderen automatisk fra alle opgaver der overlapper fri-perioden — i dag er det manuelt arbejde, især når sager allerede er publiceret.

## Adfærd

Trigger: `approveVacation` i `src/hooks/vacation/useVacationApprovalActions.ts` lige efter status sættes til `approved`.

For den pågældende medarbejder (`vacation.user_id`) i datointervallet `start_date..end_date`:

1. **Hel-dags fri (`request_type = 'full_day'` eller manglende felt):**
   - Slet alle rækker i `assignments_employees` hvor `user_id = vacation.user_id` og den tilhørende `assignments.assignment_date` falder i fri-perioden.
   - Hvis medarbejderen er `responsible_user_id` på en opgave i perioden → sæt feltet til `NULL` (skadeleder skal omtildele).

2. **Halv-dags fri (`request_type = 'partial_day'`):**
   - Kun datoer der matcher (`is_same_day = true` → samme dato; ellers hele intervallet).
   - Tjek tidsoverlap mellem fri (`start_time..end_time`) og opgaven (`from_time..to_time`). Overlap → fjern på samme måde som ovenfor. Ingen overlap → urørt.

3. **Logning og notifikation:**
   - Antal opgaver hvor brugeren blev fjernet vises i success-toast: *"Fri godkendt. Fjernet fra X opgaver i perioden."*
   - Hver berørt opgave logges i `planner_change_log` (handling: `auto_unassign_vacation`) så ændringen kan ses i opgavens historik.
   - Skadeledere på de berørte opgaver får én samlet notifikation: *"{Navn} er fjernet fra {antal} opgaver pga. godkendt fri ({dato-interval})."* med link til planneren.

## Tekniske ændringer

### Ny edge function: `supabase/functions/vacation-cleanup-assignments/index.ts`

Kaldes fra klienten med `{ vacationId }`. Funktionen (service role):

- Henter fri-rækken og validerer at status er `approved`.
- Henter alle `assignments` for `user_id` i datointervallet via join på `assignments_employees` + `responsible_user_id`.
- Bygger lister: `assignmentEmployeesToDelete[]` og `responsibleAssignmentsToClear[]` (efter tidsoverlap-tjek for partial_day).
- Udfører sletninger og opdateringer i transaktioner.
- Indsætter `planner_change_log`-rækker.
- Returnerer `{ removedFromCount, clearedResponsibleCount, affectedAssignments: [{id, case_number, date, title, responsible_user_id}] }`.

Edge function bruges fordi:
- RLS forhindrer i nogle tilfælde at en admin/skadeleder rører `assignments_employees` på tværs af opgaver.
- Service-role giver atomisk og forudsigelig kørsel uden RLS-faldgruber.
- Logning og notifikations-aggregering samles ét sted.

### Klient: `useVacationApprovalActions.approveVacation`

Efter `update vacations`-kaldet og før toast:

```ts
const { data: cleanup } = await supabase.functions.invoke(
  'vacation-cleanup-assignments',
  { body: { vacationId: vacation.id } }
);
```

- Hvis `cleanup.removedFromCount > 0` eller `clearedResponsibleCount > 0`, vis udvidet toast på dansk/engelsk.
- For hver unik `responsible_user_id` i `affectedAssignments`: send notifikation via `addNotification` (eller lad edge function gøre det — anbefales i edge function for konsistens).
- Invalider React Query: `['assignments']`, `['vacations']`.

### Oversættelser (`vacation.ts` da/en)

- `autoUnassignSuccess` — *"Fjernet fra {count} opgaver i fri-perioden."*
- `autoUnassignResponsibleCleared` — *"Du var skadeleder på {count} opgaver — feltet er nulstillet og kræver omtildeling."*
- `autoUnassignNotificationTitle` — *"Medarbejder fjernet fra opgaver"*
- `autoUnassignNotificationMessage` — *"{name} er fjernet fra {count} opgaver pga. godkendt fri ({from}–{to})."*

### Edge cases

- **Demo-mode:** Spring edge function over (`isDemoMode` check i klienten).
- **Ingen overlap:** Funktionen returnerer `removedFromCount = 0` og toast viser kun standardbeskeden.
- **Allerede godkendt:** Hvis brugeren reaktiverer en allerede godkendt fri (sjælden case), kaldes funktionen alligevel — den er idempotent.
- **Tværgående afdeling:** Hvis medarbejderen er booket i en anden afdeling i samme periode, fjernes vedkommende også derfra (medarbejderen *er* på fri — afdelings-isolation gælder ikke her).

## Filer der oprettes/ændres

```text
+ supabase/functions/vacation-cleanup-assignments/index.ts
~ src/hooks/vacation/useVacationApprovalActions.ts
~ src/translations/da/vacation.ts
~ src/translations/en/vacation.ts
~ CHANGELOG.md
~ docs/implementation-plan/tasks.md
```

## Spørgsmål

1. Skal `responsible_user_id` (skadeleder) også nulstilles automatisk hvis vedkommende selv går på fri? **Anbefaling: ja**, men feltet kræver manuel omtildeling — derfor særskilt notifikation.
2. Skal partial_day-fri også udløse fjernelse hvis tidspunktet kun delvist overlapper opgaven? **Anbefaling: ja**, ethvert overlap fjerner medarbejderen — admin kan tilføje igen hvis det er ok.
3. Skal "fjernede medarbejdere" angives i opgavens historik (audit trail tab) ud over toast? **Anbefaling: ja**, via `planner_change_log`.
