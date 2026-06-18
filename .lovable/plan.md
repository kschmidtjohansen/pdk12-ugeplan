## Mål
Behandl medarbejdere på aktivt kursus på samme måde som fraværende/på ferie: ekskluder dem fra "tilgængelige ressourcer", dashboard-metrics og alle medarbejder-selectors, og vis et gult "Kursus"-label hvor de optræder.

## Ændringer

### 1. Dashboard metrics
**`src/hooks/useDashboardMetrics.ts`**
- Importer `useActiveTrainings()`.
- Træk `trainingIds` fra `availableEmployees` (på samme måde som fravær/ferie).
- Læg dem til i `absentEmployees`-tællingen (eller en separat "på kursus"-bucket hvis ønsket — default: tæl med i fraværende).

### 2. Planner – ikke-tildelte ressourcer
**`src/components/Planner/...` (UnassignedResources / EmployeePool – identificeres ved søgning)**
- Hent aktive trainings for den valgte dato (ikke kun "i dag") via en udvidet hook-variant `useActiveTrainingsForDate(date)`.
- Skjul medarbejdere med aktivt kursus fra listen over ikke-tildelte (samme adfærd som ferie/fravær).

### 3. Employee selectors (Planner-tildeling, DutyEmployeeSelector m.fl.)
- I selector-komponenter der vælger medarbejder til en assignment/vagt:
  - Marker medarbejdere på kursus som disabled.
  - Vis et gult "Kursus"-badge ved navnet (samme stil som det eksisterende ferie/fravær-indikator).
- Berørte filer (bekræftes ved søgning):
  - `src/components/Planner/.../EmployeeSelector*.tsx`
  - `src/components/Duty/DutyEmployeeSelector.tsx`
  - evt. `src/components/Assignment/...` selectors.

### 4. Ny hook
**`src/hooks/useActiveTrainings.ts`**
- Tilføj `useActiveTrainingsForDate(date: string)` der returnerer `Set<userId>` for trainings hvor `start_date <= date <= end_date` i valgt afdeling. Eksisterende `useActiveTrainings()` (i dag) bevares.

### 5. Conflict-validering (valgfrit men anbefalet)
**`src/hooks/useAssignmentConflicts.ts` / `src/utils/assignmentConflicts.ts`**
- Tilføj kursus som konflikttype, så booking af en medarbejder i kursusperioden giver advarsel ligesom ferie.

### 6. Dokumentation
- `CHANGELOG.md`: ny entry under 2026-06-17.
- `docs/implementation-plan/tasks.md`: marker tilhørende opgave `[x]`.

## Ingen DB-ændringer
`trainings`-tabellen er allerede på plads med RLS og realtime.

## Afklarende
1. På dashboardet: skal "På kursus" tælles ind under **Fraværende** (simpelt) eller vises som en **separat metric** (kræver UI-ændring i `DashboardCockpit`)?
2. I selectors: skal kursus-medarbejdere være **helt skjulte** eller **disabled med Kursus-badge** (sidstnævnte matcher hvordan ferie typisk vises)?
