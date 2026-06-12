## Problem

På "Alle"-visningen henter `list_accessible_assignments_with_team` kun opgaver hvor `sub_department_id IS NULL`. Opgaver bookede på fx Fugt er derfor "usynlige", og Kasper/Nick/Mads vises som ledige i `UnassignedResourcesSection`. Samme problem gælder for biler. Symmetrisk vil en medarbejder/bil booket i Fugt heller ikke fremstå optaget, hvis man vælger en anden underafdeling.

Vi må IKKE bare slå opgaverne sammen igen — det ville genindføre den fejl vi lige rettede (Alle-opgaver dukkede op i Fugt). Vi har brug for at vide, hvilke medarbejdere/biler der er optaget *på tværs af underafdelinger* inden for samme hoveddepartment, uden at trække selve opgavekortene ind i planneren.

## Løsning

Tilføj en let RPC der returnerer "busy"-ressourcer på tværs af alle sub-departments i hoveddepartmentet for en given dato-range. Brug resultatet til at filtrere medarbejdere/biler ud af "ledige"-listerne — uden at ændre selve opgavedata i planneren.

### 1. Ny RPC: `list_cross_subdept_busy_resources`

```text
input:  p_department_id uuid, p_date_from date, p_date_to date, p_exclude_sub_department_id uuid
output: assignment_date date, from_time time, to_time time,
        employee_ids uuid[], car_ids uuid[], sub_department_id uuid
```

- Returnerer alle opgaver i `p_department_id` hvor `sub_department_id IS DISTINCT FROM p_exclude_sub_department_id` (dvs. "alle andre scopes end det aktive").
  - Når `p_exclude_sub_department_id IS NULL` (Alle-visning) → returnerer alle opgaver med `sub_department_id IS NOT NULL`.
  - Når sat (Fugt-visning) → returnerer alle opgaver i andre underafdelinger + Alle-opgaver.
- `SECURITY DEFINER`, `SET search_path = ''`, samme rolle-/published-logik som `list_accessible_assignments_with_team`.
- Returnerer kun de felter der bruges til availability — ingen titel/beskrivelse/team-payload (let).

### 2. Ny hook: `src/hooks/useCrossSubDeptBusy.ts`

- Tager `selectedDepartmentId`, `selectedSubDepartmentId`, `weekDates`.
- Kalder den nye RPC med ugens fra/til-dato.
- Returnerer per dato: `Set<string>` med busy employee-ids og `Set<string>` med busy car-ids. Eksponerer også `findRange(date) → {from, to}[]` hvis vi senere skal lave delvist-booket-status.
- Standard React Query cache-key: `['cross-subdept-busy', deptId, subDeptId, weekKey]`.

### 3. PlannerPage + UnassignedResourcesSection

- `PlannerPage` henter `crossBusyByDate` via hooken og giver det videre som prop til `UnassignedResourcesSection`.
- `UnassignedResourcesSection` udvider availability-beregning:
  - Når en employee er i `crossBusyByDate[selectedDate].employees` → flyt fra `available` til en ny kategori "Booket i anden afdeling" (eller bare ud af listen). Tilsvarende for biler.
- Visuelt: medarbejdere/biler optaget i anden under-afdeling vises ikke som ledige; tooltip/sektion afhænger af hvad vi vil vise (se spørgsmål nedenfor).

### 4. Andre planner-visninger (Day/Week/Schedule)

- Tjek `Planner/` views der bruger "ledige" badges og send `crossBusyByDate` ind på samme måde, så biler/medarbejdere markeres optaget på tværs.
- Hvis et view kun viser opgavekort (ingen ledighedsliste), kræver det ingen ændring.

### 5. Dokumentation

- `CHANGELOG.md`: "Cross-sub-department booking-synlighed for medarbejdere og biler i planner-availability."
- `docs/implementation-plan/tasks.md`: marker som ny opgave + `[x]`.
- Opdater memory `mem://features/department-system` med reglen: "Availability beregnes på tværs af alle sub-departments i samme main department; opgaver vises fortsat scope-isoleret."

## Berørte filer

- `supabase/migrations/<ny>.sql` (RPC)
- `src/hooks/useCrossSubDeptBusy.ts` (ny)
- `src/pages/PlannerPage.tsx`
- `src/components/Planner/UnassignedResourcesSection.tsx`
- evt. andre `src/components/Planner/*` views der viser ledige ressourcer
- `CHANGELOG.md`, `docs/implementation-plan/tasks.md`

## Spørgsmål inden implementering

1. Hvordan skal de optagne ressourcer vises i "Alle"-visning?
   - **A.** Skjules helt fra "ledige" (renest, men man kan ikke se hvor de er booket).
   - **B.** Flyttes til en ny sektion "Booket i anden underafdeling" med tooltip der nævner underafdelingen.
2. Skal samme cross-scope-logik også gælde **vagter** (`on_call_duties`) og **ferier**, eller kun assignments + biler nu?
