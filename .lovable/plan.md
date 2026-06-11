## Plan: 4 fejlretninger

### 1) Dashboard-metrics: kun servicemedarbejdere som ledige medarbejdere
**Fil:** `src/hooks/useDashboardMetrics.ts`
- Ændr `isCountableEmployee` til kun `e.role === 'servicemedarbejder'` (fjern `vikar`), så `availableEmployees`, `absentEmployees` og totals kun tæller servicemedarbejdere. Det matcher kravet om at fugttekniker/skadeleder aldrig optræder.
- Bekræft i `EmployeeAvailabilityDialog/hooks/useEmployeeDialogData.ts` at `allEmployees.filter(role === 'servicemedarbejder')` allerede filtrerer korrekt (gør det) — ingen ændring nødvendig.

### 2) Prompt for synlige roller når underafdeling oprettes
**DB:** Ny migration der tilføjer kolonne på `sub_departments`:
```sql
ALTER TABLE public.sub_departments
  ADD COLUMN visible_roles app_role[] NOT NULL
    DEFAULT ARRAY['skadeleder','fugttekniker','servicemedarbejder']::app_role[];
```
Ingen RLS-ændring; eksisterende policies bevares.

**Fil:** `src/components/Admin/SubDepartmentManagement.tsx`
- Erstat den simple "navn + opret"-række med en lille dialog (`Dialog` fra shadcn) som åbnes via "Opret underafdeling"-knappen. Dialogen indeholder:
  - Inputfelt: navn.
  - Checkbox-gruppe: "Hvilke roller skal vises i denne underafdeling?" med tre afkrydsninger (Skadeleder, Fugttekniker, Servicemedarbejder), alle valgt som default.
- `handleCreate` indsætter `{ name, department_id, visible_roles: selectedRoles }`.
- Vis valgte roller som badges på listen ud for hver underafdeling, med en "rediger roller"-knap (genbruger samme dialog i edit-tilstand → kalder `update`).

**Oversættelser:** Tilføj nøgler i `src/translations/da/admin.ts` og `en/admin.ts`:
- `subDepartments.visibleRoles`, `subDepartments.visibleRolesHelp`, `subDepartments.editRoles`.

(Filtrering ud fra `visible_roles` andre steder i appen er ikke en del af denne opgave — kun selve prompten/lagringen.)

### 3) Arbejdsdagens slut: 16:00 (man-tor), 15:30 (fre) skal regnes som fuldt booket
**Fil:** `src/utils/employeeAvailability.ts`
Problem: `Mark` slutter 16:00, men `startsEarlyEnough` (>08:30) er false, så han falder til `partiallyBooked` ("Tilgængelig efter 16:00"). Vi vil gerne have at hvis seneste sluttid ≥ arbejdsdagens slut (uden 30-min tolerance), så er medarbejderen `fullyBooked`, uanset starttid.

Ændring i `getEmployeeAvailabilityStatus` (linje 216-246):
- Behold `workdayEndTime` (16:00 / 15:30 fredag — allerede korrekt).
- Fjern `subtractMinutes(workdayEndTime, 30)` tolerancen, eller reducer den til 0. Brug:
  ```ts
  const endsAtOrAfterClosing = compareTimeStrings(latestEndTime, workdayEndTime) >= 0;
  if (endsAtOrAfterClosing) return { status: 'fullyBooked', ... };
  ```
- Behold den efterfølgende partiallyBooked-gren for tidligere sluttider.

Det betyder: en opgave 08:00–16:00 (man-tor) eller 08:00–15:30 (fre) markerer medarbejderen som fuldt booket. Opgaver der slutter før (fx 14:00) viser stadig "Tilgængelig efter 14:00".

### 4) Fugttekniker må ikke kunne redigere fra detaljedialog
**Filer:**
- `src/components/Dashboard/AssignmentDetailsDialog.tsx`: Tilføj defensivt tjek — importer `usePermissions` fra `@/context/AuthContext` og vis kun "Rediger"-knappen hvis `canEdit && onEdit`. Det forhindrer at dialogen viser redigeringsknappen uanset hvor den åbnes fra (Planner, Dashboard, MineOpgaver).
- `src/components/Planner/PlannerContent.tsx`: allerede gated (`onEdit={canEdit ? onEditAssignment : undefined}`) — ingen ændring, men det defensive tjek i dialogen lukker hullet.
- Verificér også at `AssignmentCard`/`CompactAssignmentRow`'s onClick → kun åbner dialog (visning), aldrig editor, når `canEdit=false`. (Allerede tilfældet — `handleEditClick` kaldes kun via knapper bag `canEdit`.)

### Changelog
Tilføj entry i `CHANGELOG.md`:
`2026-06-11 — Dashboard-metrics kun servicemedarbejdere · Underafdelinger med synlige roller · Korrekt fuldt-booket ved 16:00/15:30 · Fugttekniker read-only på opgavedialog`

### Tekniske noter
- DB-migration kører via supabase--migration; ingen data-tab — default array sikrer eksisterende rækker bevarer alle roller.
- Ingen RLS-ændringer.
- Ingen ændring i `useDashboardMetrics` logik for `availableCars`/`warehouseItems`.
