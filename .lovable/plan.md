
## Fix: Afdelingsfiltrering paa notifikationer og roed label i navbar

### Problem

To steder i koden henter feriedata UDEN afdelingsfilter:

1. **`useVacationRequestsStatus.ts`** (roed prik paa "Fridage" i navbar + toast-besked): Henter ALLE pending ferieansogninger paa tvaers af alle afdelinger. Bruger kun `.eq('status', 'pending')` uden `.eq('department_id', ...)`.

2. **`vacationNotifications.ts`** (notifikationer i klokken): Opretter notifikationer for ALLE pending ferieansogninger, uanset afdeling.

Resultatet: Naar brugeren er i afdeling 12, vises den roede prik og notifikation baseret paa ansogninger fra afdeling 14.

### Loesning

#### Fil 1: `src/hooks/vacation/useVacationRequestsStatus.ts`

- Importér `useDepartment` og hent `selectedDepartmentId`
- Tilfoej `.eq('department_id', selectedDepartmentId)` til Supabase-queryen
- Tilfoej `selectedDepartmentId` til useEffect-dependency-arrayet
- Guard: Returner 0 pending hvis ingen afdeling er valgt

```typescript
// Foer (linje 27-30):
const { data, error } = await supabase
  .from('vacations')
  .select('id', { count: 'exact', head: false })
  .eq('status', 'pending');

// Efter:
const { data, error } = await supabase
  .from('vacations')
  .select('id', { count: 'exact', head: false })
  .eq('status', 'pending')
  .eq('department_id', selectedDepartmentId);
```

#### Fil 2: `src/hooks/notifications/vacationNotifications.ts`

- Importér `useDepartment` og hent `selectedDepartmentId`
- Tilfoej `.eq('department_id', selectedDepartmentId)` til queryen der henter pending vacations
- Guard: Skip notifikationsoprettelse hvis ingen afdeling er valgt

```typescript
// Foer (linje 23-33):
const { data: pendingVacations, error } = await supabase
  .from('vacations')
  .select(`id, user_id, start_date, end_date, reason, status`)
  .eq('status', 'pending');

// Efter:
if (!selectedDepartmentId) return;
const { data: pendingVacations, error } = await supabase
  .from('vacations')
  .select(`id, user_id, start_date, end_date, reason, status`)
  .eq('status', 'pending')
  .eq('department_id', selectedDepartmentId);
```

#### Fil 3: `CHANGELOG.md`

Dokumenter fix.

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/hooks/vacation/useVacationRequestsStatus.ts` | Tilfoej `department_id`-filter fra `useDepartment()` |
| `src/hooks/notifications/vacationNotifications.ts` | Tilfoej `department_id`-filter fra `useDepartment()` |
| `CHANGELOG.md` | Dokumenter afdelingsfiltrering |

### Tekniske detaljer

- `vacations`-tabellen har allerede en `department_id`-kolonne (bekraeftet i types.ts og `useVacationRequestActions`)
- `useDepartment()` er allerede tilgaengelig i kontekst-traeet (DepartmentProvider wrapper hele appen)
- `selectedDepartmentId` opdateres automatisk naar brugeren skifter afdeling via DepartmentSelector
- Realtime-subscription i `useVacationRequestsStatus` re-fetcher ved aendringer, saa den roede prik opdateres automatisk
- `useEffect` dependency-array faar `selectedDepartmentId` tilfojet, saa data genhentes ved afdelingsskift

### Kvalitetstjek

- Roed prik paa "Fridage" vises KUN naar der er pending ansogninger i den valgte afdeling
- Toast-besked vises KUN for pending ansogninger i den valgte afdeling
- Notifikationer oprettes KUN for pending ansogninger i den valgte afdeling
- Skift af afdeling opdaterer straks den roede prik og pending count
- Overholder tekniske specifikationer (afdelingsbaseret dataisolering)
- Overholder UI-guidelines (ingen visuelle aendringer, kun datafiltrering)
