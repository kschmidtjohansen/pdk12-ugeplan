## Mål
"Ledige medarbejdere" på dashboardet skal kun vise servicemedarbejdere — også når brugeren har en multi-rolle (fx Servicemedarbejder + Fugttekniker, eller Skadeleder + Servicemedarbejder). I dag dropper filtreringen folk hvis deres "primære" rolle er noget andet end servicemedarbejder, og omvendt vises folk hvis deres effektive rolle tilfældigvis er servicemedarbejder selvom de også er skadeleder/fugttekniker.

Undtagelse: når en **underafdeling** er valgt, skal listen vise begge dele (servicemedarbejdere + fugtteknikere + skadeledere), så sub-dept fungerer som "alle relevante medarbejdere i denne underafdeling".

## Rod
1. `src/hooks/employee/useEmployeeData.ts` bygger `rolesMap: Map<userId, string>` og overskriver ved hver række — multi-rolle brugere får kun én vilkårlig rolle.
2. `src/hooks/useDashboardMetrics.ts` filtrerer på `e.role === 'servicemedarbejder'` (én rolle), uden hensyn til om brugeren også har servicemedarbejder.
3. Ingen sub-dept-bevidsthed i dashboard-metrics.

## Ændringer

### 1) `src/types/employee.ts`
- Tilføj valgfri `roles?: UserRole[]` på `Employee` for at bære alle roller (uden at bryde eksisterende `role`-felt).

### 2) `src/hooks/employee/useEmployeeData.ts`
- Ændr `rolesMap` til `Map<string, string[]>` og push alle roller per user_id.
- For hver employee:
  - `roles`: array fra map.
  - `role`: bestem via `getEffectiveRole(roles)` (højest rangerede) — bagudkompatibel med eksisterende UI.
- Realtime subscription på `user_roles` re-fetcher allerede.

### 3) `src/hooks/useDashboardMetrics.ts`
- Importer `useDepartment` og brug `selectedSubDepartmentId`.
- Ny `isCountableEmployee`:
  ```ts
  const isCountableEmployee = (e) => {
    const roles = e.roles || [e.role];
    if (selectedSubDepartmentId) {
      // I underafdeling: inkludér service + fugttekniker + skadeleder
      return roles.some(r => ['servicemedarbejder','fugttekniker','skadeleder'].includes(r));
    }
    // Default: kun rene servicemedarbejdere
    return roles.includes('servicemedarbejder');
  };
  ```
- Brug samme filter både til `availableEmployees` og `absentEmployees`.
- Tilføj `selectedSubDepartmentId` til `useMemo` deps.

### 4) `src/components/Dashboard/EmployeeAvailabilityDialog/hooks/useEmployeeDialogData.ts`
- Samme servicemedarbejder-filter i navigations-grenen skal også respektere multi-rolle: `employee.roles?.includes('servicemedarbejder') ?? employee.role === 'servicemedarbejder'`. Sub-dept logik kan vente — initialEmployees kommer fra metrics, så når sub-dept er valgt og dato ikke ændres, ser man allerede de rigtige.

## Verifikation
- Som fugttekniker-bruger på dashboard (uden sub-dept valgt): "Ledige medarbejdere" viser kun servicemedarbejdere.
- En bruger med multi-rolle (Skadeleder + Servicemedarbejder) tæller med som ledig.
- En ren skadeleder/fugttekniker tæller IKKE med.
- Når en underafdeling er valgt: listen viser servicemedarbejdere + fugtteknikere + skadeledere.

## Changelog
`2026-06-11 — Dashboard "Ledige medarbejdere" respekterer multi-rolle og underafdelings-kontekst (kun servicemedarbejdere uden sub-dept, alle 3 roller med sub-dept)`

## Tekniske noter
- Ingen DB-ændringer.
- `getEffectiveRole` findes i `src/utils/roleHierarchy.ts`.
- `Employee.role` bevares for bagudkompatibilitet — sættes til den højest rangerede rolle som før.
