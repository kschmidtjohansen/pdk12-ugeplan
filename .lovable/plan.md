# EmployeeSelector: stabil positionering + tom/loading-tilstand

## Mål
1. Dropdown'en i EmployeeSelector må aldrig rykke ud af skærmen på Windows (ned under proceslinjen) — den skal altid blive inden for viewport.
2. Når der ikke er medarbejdere at vise, skal der stå en tydelig besked, og mens data hentes skal der vises en loading-tilstand i stedet for en blank liste.

## Nuværende tilstand
- `PopoverContent` har `collisionPadding={16}` og listen `max-h-[min(60vh,480px)]`, men ingen eksplicit `side`/`align`, og højden kan stadig fylde for meget tæt på skærmkanten.
- Tomtilstanden er kun en kort tekst (`employees.noResults`) uden ikon, og der skelnes ikke mellem "ingen søgeresultater" og "ingen medarbejdere i afdelingen".
- Der findes ingen loading-tilstand: mens medarbejderdata hentes, vises listen tom. `useEmployees()` returnerer et `loading`-flag, men det føres ikke ned til EmployeeSelector.

## Ændringer

### 1. Positionering (EmployeeSelector.tsx)
- Sæt eksplicit `side="bottom"` og `align="start"` på `PopoverContent`, behold `avoidCollisions` (standard) og `collisionPadding={16}`.
- Sænk maks-højden til `max-h-[min(50vh,420px)]` så der altid er luft til proceslinjen, og tilføj `onOpenAutoFocus` der sikrer fokus i søgefeltet uden scroll-spring.
- Verificér i preview at popoveren vender opad (flipper), når der ikke er plads nedad.

### 2. Loading-tilstand
- Træk et valgfrit `employeesLoading?: boolean`-prop ned gennem kæden: `PlannerPage` (har `loading` fra `useEmployees`) → `AssignmentForm` → `AssignmentFormFields` → `EmployeeSelector`.
- Når `employeesLoading` er sand, vises 5–6 skelet-rækker (pulserende bjælker) i listen i stedet for den tomme besked.
- Default `false`, så eksisterende brug (DutyEditDialog m.fl.) ikke påvirkes.

### 3. Tomtilstand
- Erstat den korte tekst med et centreret panel: `Users`-ikon i dæmpet farve, overskrift og hjælpetekst.
- To varianter:
  - Søgning aktiv men ingen match: "Ingen medarbejdere matcher din søgning" + knap til at rydde søgningen.
  - Ingen medarbejdere i afdelingen: "Der er ingen medarbejdere at vælge i denne afdeling".
- Nye oversættelser da/en: `noSearchResults`, `clearSearch`, `noEmployeesAvailable`.

## Tekniske detaljer
- Filer: `src/components/Planner/EmployeeSelector.tsx`, `src/components/Planner/AssignmentForm.tsx`, `src/components/Planner/AssignmentFormFields.tsx`, `src/pages/PlannerPage.tsx`, `src/translations/da/employees.ts`, `src/translations/en/employees.ts`.
- Ingen ændring i datahentning, rettigheder eller virtualisering.

## Verifikation
- Typecheck (`bunx tsgo --noEmit`).
- Visuel kontrol: popoveren bliver på skærmen nær bunden af viewport; tomtilstand og loading-skelet vises korrekt.
- Opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.
