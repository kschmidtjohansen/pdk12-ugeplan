## Mål
Når en medarbejder har et aktivt kursus (dags dato ligger i `trainings.start_date`–`end_date`), skal de:
1. Vises med en gul "Kursus"-label i statuskolonnen på medarbejdersiden (i stedet for "Tilgængelig").
2. Tælle med under fanen "Fraværende" (de er ikke tilgængelige for arbejde).

## Ændringer

### 1. Ny hook: `src/hooks/useActiveTrainings.ts`
Henter alle aktive kurser for den valgte afdeling (hvor `start_date <= today <= end_date`). Returnerer `Set<string>` af `user_id`'er + `Map<string, {title, end_date}>` så vi kan vise titel i tooltip. Bruger React Query, respekterer `selectedDepartmentId` (multi-tenant isolation), lytter på `trainings` realtime via eksisterende mønster.

### 2. `src/pages/EmployeesPage.tsx`
- Kald `useActiveTrainings()` → få `trainingIds`.
- Send `trainingIds` videre til `EmployeesTable`.
- Inkluder kursus-IDs i `onleave`-segmentets filter og tæller: `e.onLeave || onLeaveTodayIds.has(e.id) || trainingIds.has(e.id)`.
- Ekskluder kursus-IDs fra `active`-segmentet på samme måde.

### 3. `src/components/Employees/EmployeesTable.tsx`
- Ny prop `trainingIds: Set<string>` (+ valgfri `trainingInfo` map).
- Send `isOnTraining` (bool) videre til `EmployeeTableRow` og `MobileEmployeeCard`.

### 4. `src/components/Employees/EmployeeTableRow.tsx` + `MobileEmployeeCard.tsx`
- Ny prop `isOnTraining?: boolean`.
- Hvis `isOnTraining`, render gul `<StatusBadge variant="warning">Kursus</StatusBadge>` i stedet for `availabilityInfo` badge (kursus har prioritet over "Tilgængelig", men ferie/fravær beholder forrang hvis aktivt).
- Prioritetsrækkefølge i status: Ferie (sort/destructive) > Fravær (rød) > Kursus (gul) > Tilgængelig (grøn).

### 5. `CHANGELOG.md`
Tilføj entry under 2026-06-17: "Medarbejdere på aktivt kursus vises nu med gul 'Kursus'-status og tælles som fraværende."

## Teknisk note
Ingen DB-ændringer. `trainings`-tabellen findes allerede med RLS og realtime. Ingen ændringer i `getEmployeeAvailabilityStatus` (holdes simpelt — kursus-overrider sker i row/card-komponenten).
