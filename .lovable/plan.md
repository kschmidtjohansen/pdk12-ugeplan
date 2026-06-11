## Problem

Når du opretter en opgave mens du står på en underafdeling (fx Fugt), tagges opgaven automatisk med den underafdelings `sub_department_id` — uden mulighed for at vælge "Alle". Det er derfor 12-00000 dukker op i Fugt-visningen: koden i `useOptimizedAssignments.createAssignment` sætter `sub_department_id: selectedSubDepartmentId || null` direkte fra context.

Derudover ligger den nuværende 12-00000 (`9d7de1bb-e980-469e-bf53-c133f29cb32f`) allerede forkert i DB med `sub_department_id = Fugt`. Den skal nulstilles til NULL.

## Løsning

### 1. UI: Sub-dept vælger i opgave-dialogen

Tilføj en "Underafdeling"-dropdown i `AssignmentDialog` (samme dialog som "Ny Opgave" og redigér). Indhold:
- `Alle` (= NULL) som default-option
- Liste over alle aktive underafdelinger for den valgte hovedafdeling

Default-værdi:
- Ny opgave: forudvælg `selectedSubDepartmentId` hvis sat, ellers "Alle". Brugeren kan altid skifte.
- Redigér: vis nuværende værdi fra opgaven.

Vælgeren placeres sammen med de øvrige meta-felter (dato, tid, lokation) — kompakt, samme stil som resten af dialogen.

### 2. Hook: Send det valgte sub_department_id

I `useOptimizedAssignments.createAssignment` og `updateAssignment`:
- Læs `data.sub_department_id` (sat af dialogen) i stedet for at falde tilbage på `selectedSubDepartmentId`.
- Hvis feltet er `undefined` (gammelt kald), behold nuværende fallback for bagudkompatibilitet.
- `department_id` ændres ikke — kommer stadig fra `selectedDepartmentId`.

### 3. Type/Assignment

Tilføj `subDepartmentId?: string | null` til `Assignment`-typen og mapping i `convertToAssignment` (læs `data.sub_department_id`).

### 4. Data-fix

Manuel UPDATE: sæt `sub_department_id = NULL` på opgave `9d7de1bb-e980-469e-bf53-c133f29cb32f`, så den dublerede 12-00000 forsvinder fra Fugt-visningen og kun ligger under "Alle".

### 5. Dokumentation

- `CHANGELOG.md` — entry: "Opgave-dialog: ny underafdelings-vælger (Alle / Fugt / …) så opgaver ikke længere låses fast til den aktive sub-dept."
- `docs/implementation-plan/tasks.md` — marker som færdig.

## Filer

- `src/components/Planner/AssignmentDialog.tsx` (eller den eksisterende create/edit-dialog)
- `src/hooks/useOptimizedAssignments.ts` — brug `data.sub_department_id`
- `src/services/optimizedAssignmentService.ts` — `updateAssignment` skal forwarde `sub_department_id`
- `src/types/assignment.ts` — tilføj felt
- Migration (data-fix) for den eksisterende række
- `CHANGELOG.md`, `docs/implementation-plan/tasks.md`

## Bekræftelse

- Stå på Fugt → opret opgave, vælg "Alle" → opgaven vises kun i hoveddept-visning, ikke i Fugt.
- Stå på Fugt → opret opgave, behold "Fugt" → opgaven vises i Fugt-visningen.
- Redigér eksisterende opgave → vælgeren afspejler nuværende værdi og kan ændres.
