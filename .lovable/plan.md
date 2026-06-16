
## Mål
Tilføj en ny grid-visning på `/vacation` (tabben "Ferieoversigt") der matcher det vedhæftede skærmbillede: medarbejdere som rækker, dage som kolonner, røde celler = godkendt ferie. Brugeren vælger selv start- og slutdato.

## Visning

```text
              | 1  2  3  4  5 | 6  7  8 ...
              | man tir ons tor fre | lør søn man ...
              | --- Uge 23 ------- | -- Uge 24 ---
 Ole K        |          [###############]
 Tom          | [#####]              [#####]
 Bo           |                       [###]
 ...
```

- **Sticky første kolonne**: medarbejdernavn.
- **Header række 1**: dagstal (1, 2, 3...).
- **Header række 2**: ugedag (man/tir/...).
- **Header række 3**: uge-nummer span (Uge 23, Uge 24 ...).
- **Celler**: røde hvis dagen ligger inden for en godkendt ferie for den medarbejder. Weekend-kolonner får svag grå baggrund.
- **I dag**-kolonnen markeres med tydelig border.
- Hover på celle viser tooltip med datointerval for ferien.

## Periodevalg

- To `DatePicker` (shadcn Popover + Calendar) i toppen: **Fra** og **Til**.
- Default: i dag → +30 dage.
- Hurtigknapper: "Denne måned", "Næste måned", "3 måneder".
- Maks 92 dage (3 mdr) for at undgå performance-problemer; ellers vis besked.

## Data

- Brug eksisterende `vacations`-tabel filtreret på:
  - `status = 'approved'`
  - `department_id = selectedDepartmentId` (multi-tenant isolation)
  - `is_demo = isDemoMode`
  - Overlap med valgt periode: `start_date <= rangeEnd AND end_date >= rangeStart`.
- Medarbejdere: alle aktive profiler tilknyttet `selectedDepartmentId` via `user_access` (status = 'active'), sorteret efter navn. Genbrug `useEmployees`-hook hvor muligt for at sikre samme isolation som resten af appen.

## Filer der skal ændres/oprettes

1. **Ny**: `src/components/Vacation/VacationGridOverview.tsx`
   - Indeholder hele grid-komponenten (periodevælger + tabel).
   - Bruger `useQuery` til at hente vacations + medarbejdere.
   - Renderer som CSS Grid eller `<table>` med `position: sticky` på første kolonne og header-rækker.

2. **Ændret**: `src/components/Vacation/VacationTabContent.tsx`
   - Når `tabValue === 'calendar'`, render `<VacationGridOverview />` i stedet for (eller udover) den nuværende `<VacationCalendarOverview />`. Bekræft hvilken: erstat den eksisterende måneds-kalender med den nye grid-visning, da brugeren ønsker grid-formatet.

3. **Ændret**: `src/translations/da/vacation.ts` og `src/translations/en/vacation.ts`
   - Tilføj nøgler: `gridOverview.title`, `gridOverview.from`, `gridOverview.to`, `gridOverview.thisMonth`, `gridOverview.nextMonth`, `gridOverview.threeMonths`, `gridOverview.maxRange`, `gridOverview.noEmployees`.

4. **Ændret**: `CHANGELOG.md` + `docs/implementation-plan/tasks.md` (per /docs SSOT-regel).

## Tekniske noter

- Brug `date-fns` (allerede installeret) til `eachDayOfInterval`, `getISOWeek`, `isWeekend`, `isSameDay`.
- Cellerne får højde ~24px, bredde ~28px (kompakt — matcher Excel-look og projektets compact UI).
- Horisontal scroll på containeren når kolonner overskrider viewport; sticky-name-kolonne bibeholder kontekst.
- Brug semantiske design tokens (`bg-destructive/80` for røde ferieceller, `bg-muted/30` for weekend, `border-primary` for i dag).
- Ingen DB-ændringer, ingen RLS-ændringer.

## Out of scope

- Vagter (grøn), opgaver (blå), sygdom (gul/S) — kan tilføjes senere når brugeren beder om det.
- Inline-redigering af ferie fra griddet.
- Eksport til Excel/PDF.
