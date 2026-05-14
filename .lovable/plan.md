## Mål
Reducere mængden af DOM-noder og rendering-tid på lange lister i Employees, Cars og Planner ved at indføre client-side paginering / progressive disclosure. Dataloading fra Supabase er allerede afdelings-filtreret via RLS — fokus her er **render-paginering**, ikke nye API-kald.

## Scope (kun frontend)

### 1. Employees (`src/components/Employees/EmployeesTable.tsx`)
- Tilføj client-side paginering: 25 rækker pr. side (desktop og mobile-kort).
- Pagineringskontroller (Forrige / Næste + sidetal) under tabellen via shadcn `Button`.
- Reset til side 1 når søgning/filter ændres (props `employees` ændrer længde).
- Bevar loading/error/empty states uændret.

### 2. Cars (`src/components/Cars/CarsTable.tsx` + `CarsList.tsx`)
- Samme mønster: 25 pr. side, både desktop-tabel og mobile cards.
- Pagineringskontroller indlejret i `CarsTable` så `CarsPage` ikke skal ændres.

### 3. Weekly Planner — Past Assignments
- Aktiv uge (Current + Future days) renderes uændret — typisk kun 7 dage, ikke et performance-problem.
- **`PastAssignments.tsx` og `CompactPastAssignments.tsx`**: Vis kun seneste 14 dage som standard. Tilføj "Vis flere" knap som loader yderligere 14 dage ad gangen (progressive disclosure). Dette undgår at rendere måneders historik på én gang.
- State holdes lokalt i komponenten (ingen ændring til `usePlannerData`).

## Teknisk

**Mønster (genbrugt på tværs):**
```tsx
const [page, setPage] = useState(1);
const PAGE_SIZE = 25;
useEffect(() => setPage(1), [items.length]);
const paginated = items.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
const totalPages = Math.ceil(items.length / PAGE_SIZE);
```

**Pagineringskomponent:** lille inline JSX med `Button variant="outline" size="sm"` — ingen ny shadcn `pagination` komponent (den blev fjernet i forrige cleanup).

**Past assignments:**
```tsx
const [visibleDays, setVisibleDays] = useState(14);
// filtrer pastDays til de seneste `visibleDays` dage
```

## Ud af scope
- Ingen ændring til Supabase queries / RLS.
- Ingen server-side paginering (overkill — datasæt er pr. afdeling, typisk < 200 rækker).
- Vacation/Warehouse/Duty lister rør vi ikke nu (ikke nævnt af brugeren).
- Ingen virtualisering (react-window) — paginering er nok ved disse mængder.

## Filer der ændres
- `src/components/Employees/EmployeesTable.tsx`
- `src/components/Cars/CarsTable.tsx`
- `src/components/Cars/CarsList.tsx` (mobile)
- `src/components/Planner/PastAssignments.tsx`
- `src/components/Planner/CompactPastAssignments.tsx`
- `CHANGELOG.md` — log ændringen
- `docs/implementation-plan/tasks.md` — markér opgaven `[x]`

## Verifikation
- Build kompilerer rent.
- Manuelt: side-skift bevarer scroll/filter, "Vis flere" tilføjer ældre dage uden at kollapse de nyere.
