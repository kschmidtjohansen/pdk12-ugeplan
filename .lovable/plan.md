## Global Assignment Search

### 1. Migration — `search_assignments` RPC

```sql
CREATE OR REPLACE FUNCTION public.search_assignments(query text, dept_id uuid)
RETURNS SETOF public.assignments
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT *
  FROM public.assignments
  WHERE department_id = dept_id
    AND length(trim(query)) >= 2
    AND (
      title ILIKE '%' || query || '%'
      OR location ILIKE '%' || query || '%'
      OR case_number ILIKE '%' || query || '%'
    )
  ORDER BY assignment_date DESC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.search_assignments(text, uuid) TO authenticated;
```

`SECURITY INVOKER` ensures the existing RLS on `assignments` (incl. `can_view_assignment_optimized` + `hide_demo_data_assignments`) applies — no cross-department leakage.

### 2. New component — `GlobalAssignmentSearch.tsx`

Path: `src/components/Layout/NavComponents/GlobalAssignmentSearch.tsx`

- `Input` with search icon, placeholder "Søg i alle opgaver…", responsive width (hidden on xs, ~`w-64` on md+).
- Local state: `query`, `results`, `loading`, `open`.
- 300ms debounce via `setTimeout` in `useEffect`. Skip RPC when trimmed query < 2 chars.
- Calls `supabase.rpc('search_assignments', { query, dept_id: selectedDepartmentId })` from `DepartmentContext`. Guard: do nothing until `selectedDepartmentId` is set (multi-tenant core rule).
- Popover/dropdown anchored to input showing rows: **title** (bold), **case_number · location** (muted), **assignment_date** formatted `dd-MM-yyyy` right-aligned.
- Click row → set `openAssignmentId` in a small Zustand store (`assignmentDetailsStore`) and clear input.
- Empty state: "Ingen resultater". Loading: small spinner. Errors: silent (console.error in DEV only).
- Keyboard: Escape closes, ArrowUp/Down navigates, Enter opens.

### 3. New global dialog — `AssignmentDetailsDialog.tsx`

Path: `src/components/Planner/AssignmentDetailsDialog.tsx`

- Reads `openAssignmentId` from `assignmentDetailsStore`.
- Fetches the single assignment via `supabase.from('assignments').select('*').eq('id', id).maybeSingle()` plus the joined employees from `assignments_employees`.
- Renders read-only summary: title, type badge, date + time range, location, case_number, responsible user, employees list, cars, description.
- Footer button "Åbn i Planner" → navigates to `/planner` (no further state needed; planner already loads the week).
- Mounted once in `AppShell` so it's available on every route.

### 4. Wiring

- `AppTopBar.tsx`: insert `<GlobalAssignmentSearch />` between the title block and `ml-auto` actions group.
- `AppShell.tsx`: mount `<AssignmentDetailsDialog />` near the existing global providers.

### 5. Store

`src/stores/assignmentDetailsStore.ts` — tiny Zustand store: `{ openAssignmentId, open(id), close() }`.

### 6. Translations

Add to `src/translations/{da,en}/planner.ts`:
- `search.placeholder`: "Søg i alle opgaver…" / "Search all assignments…"
- `search.noResults`: "Ingen resultater" / "No results"
- `search.openInPlanner`: "Åbn i Planner" / "Open in Planner"

### Out of scope

- No changes to existing Planner dialogs.
- No Cmd+K palette.
- No edits from the details dialog (read-only).
- No new RLS policies (existing ones cover it).

### Files

- **New**: migration, `GlobalAssignmentSearch.tsx`, `AssignmentDetailsDialog.tsx`, `assignmentDetailsStore.ts`
- **Edited**: `AppTopBar.tsx`, `AppShell.tsx`, both `planner.ts` translation files
