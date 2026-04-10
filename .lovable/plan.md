

## Plan: 3 Rettelser — Serie-dialog, Selector-bredde, Historik-isolering

### 1. Serie-dialog vises ikke ved redigering af 12-00000

**Problem**: I `PlannerPage.tsx` linje 240-246 tjekker `handleOpenEditDialog` om `assignment.groupId` eksisterer. Men `groupId` er korrekt mappet i data-laget (linje 95 i `useOptimizedAssignments.ts`). Problemet er sandsynligvis at `SeriesActionDialog` åbnes *før* edit-dialogen — og ved "Hele serien" (linje 354) åbnes edit-dialogen direkte *uden* at `AssignmentDialogManager` viser sin egen serie-dialog. Dvs. brugeren kan redigere, men ved submit intercepter `AssignmentDialogManager` (linje 62) KUN hvis `hasSeries` er true — men `handleSeriesEntireSeries` (linje 353) åbner dialogen med den originale assignment, som stadig har `groupId`, og derved trigger serie-dialogen *igen*.

Det reelle problem: Ved "Hele serien" bør ændringer automatisk gå til alle serieposter *uden* at spørge igen. Ved "Kun denne dag" detaches posten og åbnes som enkeltstående — korrekt.

**Fix**:
- Fjern den dobbelte serie-dialog i `AssignmentDialogManager` — den skal aldrig vise sin egen serie-prompt da `PlannerPage` allerede håndterer det
- I `PlannerPage`: Når brugeren vælger "Hele serien" i SeriesActionDialog, sæt en `editMode`-state (`'single' | 'series'`) og send den til dialog-manageren
- I `AssignmentDialogManager`: Brug `editMode` til at bestemme om submit kalder `onSubmit` (single) eller `onSubmitSeries` (series) — uden at vise en ny dialog
- Tilføj `editMode` prop til `AssignmentDialogManager` og `PlannerDialogContainer`

**Filer**: `PlannerPage.tsx`, `AssignmentDialogManager.tsx`, `PlannerDialogContainer.tsx`

### 2. Car/Employee selector croppes — tekst skjules

**Problem**: `PopoverContent` i begge selectors bruger `w-80` (320px), hvilket er for smalt til at vise bilnavn + badge + nummerplade. Billedet viser at "I brug"-badgen skubber bilnavnet ud.

**Fix**:
- `MultipleCarSelector.tsx`: Ændr `PopoverContent` fra `w-80` til `w-96` (384px)
- `EmployeeSelector.tsx`: Ændr `PopoverContent` fra `w-80` til `w-96` (384px)
- Tilføj `overflow-hidden` og `text-ellipsis` på navne-spans for graceful truncation

**Filer**: `MultipleCarSelector.tsx`, `EmployeeSelector.tsx`

### 3. Historik/planner ændringer viser andre afdelingers data

**Problem**: `ChangeLogContext.tsx` fetcher `planner_change_log` med `select('*')` uden nogen `department_id`-filtrering. `planner_change_log`-tabellen har ingen `department_id`-kolonne, men logge refererer `assignment_id` som har en relation til `assignments`-tabellen der har `department_id`.

**Fix**:
- I `ChangeLogContext.fetchChangeLogs()`: Brug `selectedDepartmentId` fra `useDepartment()`
- Hent først assignments IDs for den aktive afdeling, derefter filtrér change logs via en join eller subquery
- Konkret: fetch `planner_change_log` med en inner join: `.select('*, assignments!inner(department_id)')` og `.eq('assignments.department_id', selectedDepartmentId)`
- Tilføj `selectedDepartmentId` til useEffect dependencies så logs genindlæses ved afdelingsskift
- Gør det samme for `fetchChangeLogsByDateRange` og `fetchChangeLogsByCaseNumber`

**Filer**: `ChangeLogContext.tsx`

### Samlet scope
- 5 filer ændres
- Ingen database-ændringer
- Changelog opdateres

