# Sygdom vises som "Fraværende" overalt

Sygemelding skal kun kunne aflæses ét sted: på medarbejdersiden, hvor man markerer folk som syge. Alle andre steder i appen skal en sygemeldt medarbejder fremstå som helt almindeligt fraværende — samme ord og samme farve som ved ferie/orlov, uanset hvem der er logget ind.

## Hvad der ændres

**Ugeplan — Ikke tildelte ressourcer**
- Overskriften hedder altid "Fraværende" (ikke "Syge medarbejdere").
- Navne-chips får den neutrale fraværsfarve i stedet for rød.
- Værktøjstip siger "Fraværende denne dag".

**Ugeplan — fraværsrækken under dagen (fx Tirsdag, 15. september)**
- Sygemeldte vises sammen med ferie/orlov under overskriften "Fraværende".
- Ingen rød label; samme neutrale farve som øvrige fraværende.

**Medarbejdervælger**
- Låseteksten er altid "Fraværende denne dag".

**Dashboard (Fraværende-listen)**
- Statusmærket viser altid "Fraværende", aldrig "Syg".

**Medarbejdersiden (/employees)**
- Uændret: her ser administratorer og skadeledere fortsat "Syg" med rød markering, så de kan se og fjerne markeringen.

## Teknisk

- Fjern `canSeeSickReason`-baseret etiket- og farvevalg i `UnassignedResourcesSection.tsx`, `DayAbsenceRow.tsx`, `EmployeeSelector.tsx` og `AbsentEmployeesModal.tsx`; brug fast `absentEmployees` / `lockedReasonAbsent` / `absentStatus` og `warning-soft`-tokens.
- `useDashboardMetrics.ts`: `canSeeSickReason` sættes ikke længere på listeposter (feltet kan udgå fra `AbsentEmployee`).
- `useSickDays.ts`, RLS/RPC og notifikationstriggeren ændres ikke — datamodellen og adgangskontrollen er allerede korrekt; dette er rent visuelt.
- Ubrugte nøgler `planner.sickEmployees`, `employees.lockedReasonSick` og `dashboard.metrics.sickStatus` fjernes fra da/en, hvis de ikke længere bruges.
- Kør `npx tsgo --noEmit -p tsconfig.json`; opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.
