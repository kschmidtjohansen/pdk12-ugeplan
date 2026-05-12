## Problem

**Bug 1 — "Rendered more hooks":** `DutySwapDialog.tsx` returns `null` *before* its `useState`/`useEffect`/`useMemo` calls. When `duty` toggles between `null` and a value, the hook count changes → React crashes the swap flow entirely (this also blocks point 2 from working).

**Bug 2 — Kan ikke tildele 2 vagter samme dag:** Databasen tillader det (ingen unique constraint, trigger blokerer ikke), men der er ingen UI-indgang fra månedskalenderen til at tilføje endnu en vagt på en dag, der allerede har én. Brugeren skal i dag bruge den globale "Tildel vagt"-knap, og der er intet, der signalerer at flere vagter pr. dag er tilladt.

## Fix

### 1. `src/components/Duty/DutySwapDialog.tsx`
- Flyt **alle** hooks (`useState`, `useEffect`, `useMemo`, `useDutyActions`) op *før* `if (!duty) return null;`.
- Gør hook-bodies sikre mod `duty === null` (f.eks. `useMemo` returnerer `[]` hvis `!duty`, `useEffect` deps bruger `duty?.id`).
- Beholdt opførsel: dialog rendrer ikke uden duty.

### 2. Multi-vagt pr. dag (UI-indgang)
- I `DutyMonthCalendar.tsx`: når `canManage` er sand, tilføj en lille "+"-knap i hver dagscelle (ved siden af datoen) der åbner `DutyAssignmentDialog` med datoen forudvalgt.
- Udvid `DutyAssignmentDialogProps` med valgfri `initialDate?: Date` og `initialDutyType?: DutyType`; sættes som standard-`dates`/`duty_type` i `useDutyFormState`'s init.
- I `DutyPage.tsx`: hold `pendingNewDuty` state, send til `DutyAssignmentDialog`, åbn den når "+" klikkes.
- Bekræft i `DutyCalendar.tsx` at allerede-bookede datoer stadig kan multi-vælges (de kan — ingen `disabled`-prop sat).
- Tilføj kort hjælpetekst under kalenderen: "Flere vagter pr. dag er tilladt."

### Ingen ændringer
- Database/migrations (constraint og trigger tillader allerede flere vagter pr. dag/type).
- Backend swap-flow (kun render-rækkefølge fixes i dialogen).

## Filer
- `src/components/Duty/DutySwapDialog.tsx` — hook-rækkefølge
- `src/components/Duty/DutyMonthCalendar.tsx` — "+"-knap pr. dag
- `src/components/Duty/DutyAssignmentDialog.tsx` — accepter `initialDate`/`initialDutyType`
- `src/hooks/duty/useDutyFormState.ts` — init fra props
- `src/pages/DutyPage.tsx` — state for "tilføj på dato"
- `src/translations/da/duty.ts` + `en/duty.ts` — hjælpetekst
- `CHANGELOG.md`
