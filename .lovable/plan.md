## Tre ændringer til vagt- og medarbejdersystemet

### 1. Adskil farver: Fraværende (rød) vs. Fri/ferie (gul)

I dag vises både "På ferie" og "Fraværende" med samme røde label (`StatusBadge variant="error"`). Det skal ændres så:
- **Fraværende** (`onLeave`/markeret af admin) → rød (`error`)
- **Ferie/Fri** (godkendt vacation, fuld eller delvis) → gul (`warning`)

Tilpasses ét sted: `src/utils/employeeAvailability.ts` udvides med et `badgeVariant`-felt på `EmployeeAvailabilityInfo` der returnerer `'warning'` ved `onVacation`/`partialVacation` og `'error'` ved `onLeave`. Alle steder der bruger `availabilityInfo.status === 'available' ? 'success' : 'error'` opdateres til at bruge det nye felt:
- `EmployeeTableRow.tsx`
- `MobileEmployeeCard.tsx`
- evt. selektor-lister i Planner/Duty der viser samme status

### 2. Bytteforespørgsel til flere medarbejdere (først-til-mølle)

I dag bytter `DutySwapDialog` direkte vagten til én valgt medarbejder uden samtykke. Det skal omlægges til en forespørgselsflow:

**Ny tabel `duty_swap_requests`:**
- `duty_id` (fk on_call_duties)
- `requested_by` (uuid – nuværende vagthaver)
- `candidate_ids` (uuid[] – inviterede medarbejdere)
- `status` (`pending` | `accepted` | `cancelled` | `expired`)
- `accepted_by` (uuid, nullable)
- `accepted_at` (timestamptz, nullable)
- `created_at`, `expires_at` (valgfrit, fx 7 dage)
- RLS: vagthaver må oprette/annullere; kandidater må læse og opdatere status fra `pending`→`accepted` via en SECURITY DEFINER-funktion `accept_duty_swap(request_id)` der atomisk:
  1. låser rækken (`FOR UPDATE`)
  2. tjekker `status='pending'`
  3. opdaterer `on_call_duties.employee_id`
  4. sætter `status='accepted'`, `accepted_by`, `accepted_at`
  5. ellers returnerer `already_taken`

**UI ændringer:**
- `DutySwapDialog` → multi-select (checkboxes i stedet for radio). Knap: "Send byttetilbud".
- Ny notifikationstype `duty_swap_offer` til hver kandidat med link til vagten + "Accepter byt"-knap.
- Når en kandidat trykker "Accepter byt": kald `accept_duty_swap`. Ved `already_taken` → AlertDialog: *"Vagten er allerede taget af en anden."* Kandidatens notifikation markeres som læst/forældet.
- Når én accepterer: de øvrige kandidaters notifikation opdateres (titel: "Vagten er taget"), og forespørgslen forsvinder fra deres "ledige byt"-liste.
- Realtime subscription på `duty_swap_requests` så listen opdateres live.

**Notifikationer:** udvid `dutyNotifications.ts` med `createDutySwapOfferNotification(candidateIds, duty, requesterName)` og `createDutySwapTakenNotification(...)`.

### 3. Flere skadeledere/kørevagter samme dag

Skemaet `on_call_duties` har ingen unik begrænsning på (`duty_date`, `duty_type`, `department_id`), så flere rækker pr. dag understøttes allerede teknisk. Ændringerne ligger i UI/visning:

- **Tildelingsdialog** (`DutyAssignmentDialog`): Tillad tildeling selvom der allerede findes vagt på dagen — fjern evt. blokerende valideringer i `useDutyActions.assignDuty` og `DutyCalendar` (vis dato som "delvist optaget" i stedet for at låse).
- **Listevisning** (`DutyList`, `DutyMonthCalendar`): Render alle vagter for samme dag stacked (badge pr. person) i stedet for kun at vise første. Datokort viser fx "2 skadeledere" når der er flere.
- **Skærmvisning** (`ScreenDisplayContent`): Hvis den henter dagens vagt, skal den nu hente alle og vise dem komma-separeret.
- **Reassign/Edit**: Hver række forbliver redigerbar individuelt via sin `id`.

Ingen DB-migration nødvendig her — kun frontend-tilpasning.

---

### Tekniske detaljer

**DB-migration (kun feature 2):**
```sql
CREATE TABLE public.duty_swap_requests (
  id uuid PK default gen_random_uuid(),
  duty_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  candidate_ids uuid[] NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  accepted_by uuid,
  accepted_at timestamptz,
  department_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- RLS + SECURITY DEFINER fn accept_duty_swap(request_id)
-- Realtime: ALTER PUBLICATION supabase_realtime ADD TABLE duty_swap_requests;
```

**Filer der røres:**
- `src/utils/employeeAvailability.ts` (badgeVariant)
- `src/components/Employees/EmployeeTableRow.tsx`, `MobileEmployeeCard.tsx`
- `src/components/Duty/DutySwapDialog.tsx` (multi-select + send tilbud)
- ny `src/components/Duty/DutySwapAcceptDialog.tsx` (accept/already-taken)
- `src/hooks/duty/useDutyActions.ts` (createSwapRequest, acceptSwapRequest)
- `src/hooks/notifications/dutyNotifications.ts` (nye notifikationstyper)
- `src/components/Duty/DutyList.tsx`, `DutyMonthCalendar.tsx`, `DutyCalendar.tsx` (multi-vagter pr. dag)
- `src/translations/da/duty.ts` + `en/duty.ts` (nye strenge)
- migration SQL for `duty_swap_requests`

**Dokumentation:** opdater `/docs/implementation-plan/tasks.md` og `CHANGELOG.md` efter implementering.
