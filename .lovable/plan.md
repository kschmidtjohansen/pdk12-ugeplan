## Problem
Du har oprettet underafdelingen **Fugt** i afdeling 12, men den vises ingen steder. Årsagen er at alle tre steder hvor underafdelinger surfaces er gated på "mere end én":

- `SubDepartmentQuickSwitcher` (dashboard): `userSubDepartments.length < 2` → returnerer `null`
- `UserMenu` (profil-dropdown): `userSubDepartments.length > 1`
- `DepartmentSwitcherPill` (sidebar-pill): `canSwitchSub = userSubDepartments.length > 1`

Med kun én underafdeling rammer du `length === 1` overalt, og samtidig auto-vælger `DepartmentContext` den ene sub-dept som standard — så data filtreres uden at du nogensinde ser kontrollen eller "Alle"-muligheden.

## Plan

1. **Vis sub-dept UI når der er ≥1 underafdeling** (ikke kun ≥2):
   - `src/components/Dashboard/SubDepartmentQuickSwitcher.tsx`: ændre guard til `length < 1`
   - `src/components/Layout/NavComponents/UserMenu.tsx`: betingelse `> 0`
   - `src/components/Layout/NavComponents/DepartmentSwitcherPill.tsx`: `canSwitchSub = userSubDepartments.length > 0`
   - Hvis 0 underafdelinger findes, vises intet (uændret).

2. **Standardvalg for administratorer = "Alle"** i `src/context/DepartmentContext.tsx`:
   - I `fetchSubDepartments` (både super-admin og almindelig sti): hvis brugeren er admin/super_admin og der ikke er gemt et gyldigt `selected_sub_department_id` i localStorage, så defaulte til `null` (Alle) i stedet for første sub.
   - Ikke-admins beholder nuværende adfærd (auto-vælg første/eneste sub).
   - Sikrer at en admin der opretter sin første underafdeling stadig ser hele afdelingens data og bevidst kan skifte til Fugt.

3. **Dashboard quick switcher**:
   - Allerede placeret i `DashboardPage` og rendereres af `SubDepartmentQuickSwitcher`. Med ændring (1) viser den `Alle` + alle sub-dept pills så snart der findes mindst én — præcis det du efterspørger ("Fugt" + senere "Løsøre"). Skjules helt når 0.

4. **Changelog**:
   - `2026-06-11 — Underafdelinger synlige fra første oprettelse + admin defaulter til "Alle"`.

## Verifikation
- Med 0 underafdelinger: ingen pill, ingen switcher, ingen menu-sektion (uændret).
- Med 1 underafdeling (Fugt): admin ser dashboard quick switcher med `Alle | Fugt`, defaultet til Alle. UserMenu og sidebar-pill viser også sub-dept-sektionen.
- Med 2+ underafdelinger: som i dag, plus admin starter på Alle med mindre andet er gemt.
- Skift mellem Alle og Fugt opdaterer data via eksisterende `unifiedDataService.clearCache()` i `setSelectedSubDepartmentId`.

Ingen DB-/schema-ændringer. Kun frontend-justeringer.