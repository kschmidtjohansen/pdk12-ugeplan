## Findings

**Fridage (`/vacation`):**
- `VacationPageContainer.tsx` bruger `isEffectiveServicemedarbejder` (kun sandt for `servicemedarbejder`) → Fugttekniker får admin-lignende tabs/knapper i stedet for service-medarbejder-visningen.
- Alle "manage"-actions (`handleApprove/Reject/Edit/Delete/ActionSubmit`, admin-dialog, "Anmod for medarbejder"-knap i `VacationHeader.tsx`) er kun gated på `isEffectiveAdmin` → Skadeleder kan ikke godkende/redigere/oprette på andres vegne.
- Super Admin er allerede dækket via `isEffectiveAdmin` (`administrator || super_admin`).

**Lager (`/warehouse`):**
- `WarehousePage.tsx`: `canEdit = super_admin || administrator || skadeleder` ✓ (dækker krav for admin/skadeleder/super admin).
- Fugttekniker og Servicemedarbejder får begge `canEdit=false` (samme læse-visning). Vil verificere `WarehouseList` ikke har skjulte rollegates, der ekskluderer fugttekniker ud over servicemedarbejder; tilføj ingen ekstra rollegates.

**"Super Admin" label:**
- Vises som "Super Admin" via 6 oversættelsesnøgler: `da/en` × `admin.roles.super_admin`, `common.roles.super_admin`, `employees.roles.super_admin` (præcise stier i filerne under `src/translations/`). Den interne rolle-nøgle `super_admin` ændres IKKE — kun det viste label.

## Plan

### 1. Vacation: Fugttekniker = Servicemedarbejder-visning, Skadeleder = fuld adgang
`src/components/Vacation/VacationPageContainer.tsx`:
- Hent også `isEffectiveSkadeleder` og `effectiveRole` fra `useAuth()`.
- Beregn `viewAsServicemedarbejder = isEffectiveServicemedarbejder || effectiveRole === 'fugttekniker'` og send som `isServicemedarbejder` prop til `VacationHeader`.
- Beregn `canManageVacations = isEffectiveAdmin || isEffectiveSkadeleder`. Erstat alle de fem `if (!isEffectiveAdmin) return;` / `if (isEffectiveAdmin)` checks med `canManageVacations`. Behold "kun service-medarbejder-visning hvis fugttekniker"-logikken adskilt fra manage-rettigheder.

`src/components/Vacation/VacationHeader.tsx`:
- Brug `isEffectiveAdmin || isEffectiveSkadeleder` til at vise "Anmod for medarbejder"-knappen.

Resultat: Fugttekniker ser samme forenklede tab-layout som servicemedarbejder; Skadeleder/Administrator/Super Admin (IT Support) kan godkende, redigere, slette og oprette ferie for andre.

### 2. Lager: bekræft fælles læse-visning for fugttekniker og servicemedarbejder
- Læs `WarehouseList.tsx` og evt. sub-komponenter; hvis der findes rollegates der specifikt ekskluderer `fugttekniker` (uden også at ekskludere `servicemedarbejder`), fjernes de så de matcher servicemedarbejder-visningen.
- `WarehousePage.tsx` `canEdit` lades urørt (allerede korrekt).

### 3. Omdøb visningslabel "Super Admin" → "IT Support" (rolle-nøgle uændret)
Opdater de 6 strenge:
- `src/translations/da/admin.ts` linje 337: `super_admin: 'IT Support'`
- `src/translations/en/admin.ts` linje 337: `super_admin: 'IT Support'`
- `src/translations/da/common.ts` linje 151: `super_admin: "IT Support"`
- `src/translations/en/common.ts` linje 149: `super_admin: "IT Support"`
- `src/translations/da/employees.ts` linje 114: `super_admin: 'IT Support'`
- `src/translations/en/employees.ts` linje 114: `super_admin: 'IT Support'`

Tilrettelse af forklarende noter:
- `da/admin.ts` linje 301: "…velegnet til IT-supportere med Super Admin-rolle." → "…velegnet til IT Support-brugere."
- `en/admin.ts` linje 301: tilsvarende engelsk justering ("Suitable for IT Support users.").

Ingen ændring af DB-enum, RLS-funktioner eller TypeScript-rolle-typer (`super_admin` forbliver intern nøgle — vi skifter kun visningsnavnet).

### 4. Changelog
Ny entry `2026-06-11 — Fugttekniker = Servicemedarbejder på Fridage, Skadeleder fuld vacation-adgang, "Super Admin" omdøbt til "IT Support"`.

## Verifikation
- Login som Fugttekniker → `/vacation` viser samme tab/header som Servicemedarbejder; `/warehouse` viser læse-visning uden rediger/slet (samme som Servicemedarbejder).
- Login som Skadeleder → kan godkende, afvise, redigere og slette ferieanmodninger samt åbne "Anmod for medarbejder".
- Login som Administrator / IT Support → uændret fuld adgang.
- UserMenu og medarbejder-rollelister viser "IT Support" i stedet for "Super Admin".

Ingen DB- eller edge-function-ændringer.