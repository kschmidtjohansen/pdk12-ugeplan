## Problem
Min tidligere ændring fyldte automatisk `sub_department_ids` med ALLE underafdelinger, når brugeren fravalgte alle. Det betyder at "Fugt" bliver tilføjet igen, selvom brugeren netop har fjernet den. Bilen vises derfor stadig under Fugt.

## Mål
Når brugeren fravælger alle underafdelinger og gemmer:
- Bilen gemmes uden tilknytning til nogen specifik underafdeling.
- Junction-tabellen `car_sub_departments` får slettet alle rækker for bilen (ingen indsættes).
- Bilen vises kun, når underafdelingsfilteret er "Alle" (intet specifikt underafdeling-filter aktivt). Den optræder ikke længere under "Fugt".

## Ændringer

**`src/hooks/car/useCarFormState.ts`**
- Fjern auto-fill-logikken (`effectiveSubDeptIds` der peger på alle underafdelinger). Brug `formData.sub_department_ids || []` direkte i `createCar`, `updateCar` og `syncSubDepartments`.
- Fjern import af `useDepartment` igen — ikke længere nødvendig her.
- `syncSubDepartments` håndterer allerede tom liste korrekt (sletter alle, indsætter ingen).

**`src/components/Cars/CarFormDialog.tsx`**
- Opdater hjælpeteksten: "Hvis ingen vælges, vises bilen kun, når der ikke er filtreret på en underafdeling."

**Translations**
- `src/translations/da/cars.ts` og `src/translations/en/cars.ts`: opdater `subDepartmentOptionalHint`.

## Dokumentation
- `CHANGELOG.md`: Note om at tom underafdelingsliste nu betyder "ingen tilknytning" i stedet for "alle".

Ingen DB- eller RLS-ændringer.