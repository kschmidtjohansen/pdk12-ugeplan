
## Mål
Udvide `/vacation` grid-oversigten med rolleopdeling, fuld bredde, vagter, fravær og kursus. Tilføj "Kursus"-knap på medarbejdere.

## 1. Grid: Rolleopdeling + farver
Fil: `src/components/Vacation/VacationGridOverview.tsx`

- Erstat flad `sortedEmployees` med tre sektioner i rækkefølge: Skadeleder, Fugttekniker, Servicemedarbejder (Administrator + super_admin tæller som skadeleder/admin-gruppe, vises øverst; vikar samles under Servicemedarbejder).
- For hver gruppe: en `<tr>` med gruppeoverskrift (colSpan = days+1), navn + lille rolle-prik via `getRoleDotClass(role)`. Baggrund i tilsvarende lys tone (`bg-purple-50/40`, `bg-blue-50/40`, `bg-green-50/40`).
- Medarbejdernavn-cellen får venstre 3px border i rollefarve (`getRoleDotClass` → mapper til border-class) så rollen er synlig pr. række.

## 2. Grid: Fuld bredde
- Fjern `min-w-[28px] w-[28px]` på dag-headers, brug `w-auto` med `min-w-0`.
- Wrapper får `w-full`; tabel får `w-full table-fixed` så kolonnerne strækker sig til containerens bredde.
- Behold `overflow-x-auto` som fallback hvis perioden er meget lang (>~60 dage på smal skærm) ved at sætte `min-w-[20px]` på dag-celler.
- Sticky "Medarbejder"-kolonne får fast bredde `w-[160px]`.

## 3. Kursus på medarbejdere
### Database (ny tabel `trainings`)
```sql
CREATE TABLE public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id bigint NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  title text,
  notes text,
  is_demo boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainings TO authenticated;
GRANT ALL ON public.trainings TO service_role;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
-- policies: select for same department (has_role/department helper),
--           insert/update/delete kun for admin/skadeleder/super_admin via has_role
```
Følger eksisterende department-isolation mønster fra `vacations`.

### UI
- `src/components/Employees/EmployeeTableRow.tsx`: Tilføj ny knap "Kursus" (ikon `GraduationCap`) til venstre for "Marker som fraværende", kun synlig for admin/skadeleder.
- Ny dialog `src/components/Employees/EmployeeTrainingDialog.tsx`: start/slut-dato, titel, noter. Bruger DAWA-fri `Calendar`-popover (samme stil som `VacationDateSelector`).
- Ny hook `src/hooks/training/useTrainings.ts` (CRUD + react-query invalidering).
- Translations: `employees.trainingButton`, `employees.trainingDialog.*` i `da/employees.ts` og `en/employees.ts`.

## 4. Vagter + Kursus + Fravær i grid
Udvid `VacationGridOverview` med tre ekstra queries (parallel via `useQuery`):

- `on_call_duties` (samme periode + department) → map `user_id` → `Map<dayKey, 'skadeleder_vagt'|'kørevagt'>`.
- `trainings` → `Set<dayKey>` pr. user.
- "Fravær" = `profiles.status='on_leave'` (eksisterende). Det er ikke datointerval, men permanent flag → vis hele rækken med en svag rød baggrund OG fyldte røde celler på alle dage. (Bemærkning i UI: rød = på fravær i hele perioden.)

### Cell-farve prioritet (højest først)
1. **Sort** = godkendt ferie (`vacations` approved) — `bg-foreground`
2. **Gul** = kursus — `bg-yellow-400`
3. **Rød** = fravær (`status='on_leave'`) — `bg-red-500`
4. **Blå** = skadelederVagt — `bg-blue-500`
5. **Grøn** = kørevagt — `bg-green-500`
6. Tom

(Ferie sort som ny standard pr. brugerens kravliste; tidligere rød fjernes.)

### Forklaring/legend
Opdater legend nederst:
```
■ Skadelederv.  ■ Kørevagt  ■ Fravær  ■ Kursus  ■ Ferie  □ Weekend  | I dag
```

## 5. Dokumentation
- `CHANGELOG.md`: Ny entry 2026-06-17.
- `docs/implementation-plan/tasks.md`: Marker grid-udvidelse + kursus-feature.

## Teknisk noter
- Ingen ændringer i `useEmployees` (rolle findes allerede).
- React Query keys: `['vacation-grid', ...]`, `['duty-grid', ...]`, `['training-grid', ...]`.
- Realtime: Subscribe til `on_call_duties`, `trainings`, `vacations` for live opdatering.
- Tooltip på hver farvet celle viser type + evt. titel/note.

## Ud af scope
- Redigering/sletning af kursus direkte fra grid (sker via medarbejder-knappen).
- Eksport.
