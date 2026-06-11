## Findings

`src/hooks/useDashboardMetrics.ts` afgør "tællbare medarbejdere" sådan:
- **Ingen underafdeling valgt** → kun `servicemedarbejder` (giver fx 10).
- **Underafdeling valgt** → `servicemedarbejder` + `fugttekniker` + `skadeleder` (giver de 17 Jonas ser, da han har Fugt-underafdelingen aktiv).

Logikken er rolle-uafhængig; en fugttekniker får derfor samme udvidede tæller som en administrator.

## Plan

Fugtteknikere skal — ligesom servicemedarbejdere — kun se ledige servicemedarbejdere i KPI-stakken, uanset om en underafdeling er valgt.

**`src/hooks/useDashboardMetrics.ts`:**
1. Importér `useAuth` og hent `effectiveRole`.
2. Definér `restrictToServicemedarbejder = effectiveRole === 'servicemedarbejder' || effectiveRole === 'fugttekniker'`.
3. Opdatér `isCountableEmployee`:
   ```ts
   if (restrictToServicemedarbejder) return roles.includes('servicemedarbejder');
   if (selectedSubDepartmentId) return roles.some(r => SUB_DEPT_ROLES.includes(r));
   return roles.includes('servicemedarbejder');
   ```
4. Tilføj `effectiveRole` til `useMemo`-dependencies.

Ingen ændringer i `CompactKpiStack.tsx`, ingen DB-/schema-ændringer, ingen ændring for administrator/skadeleder/IT Support.

### Changelog
`2026-06-11 — Fugttekniker ser kun ledige servicemedarbejdere i dashboard-KPI (samme view som servicemedarbejder)`.

## Verifikation
- Jonas Poulsen (fugttekniker) på dashboardet med Fugt-underafdeling aktiv: "Ledige medarbejdere" viser `x / 10` i stedet for `9 / 17`.
- Administrator/skadeleder/IT Support: uændret adfærd (17 ved valgt underafdeling).
- Servicemedarbejder: uændret (10).