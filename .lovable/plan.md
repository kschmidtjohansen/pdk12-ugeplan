# Klikbar ConflictBadge med løsningspopover

Gør konfliktbadgen interaktiv: ved klik åbnes en popover, der viser de to konfliktende opgaver side om side og tilbyder to hurtige handlinger, som begge bruger den eksisterende `updateAssignment`-mutation. Ingen nye Supabase-queries.

## Filer

**Ny:** `src/components/Planner/ConflictResolutionPopover.tsx`
**Ændret:** `ConflictBadge.tsx`, `AssignmentCard.tsx`, `CompactAssignmentRow.tsx`, `translations/{da,en}/planner.ts`

## 1. ConflictBadge bliver en knap

- Konvertér det nuværende `<span>` til en `<button>` inde i `Popover` (shadcn) i stedet for `Tooltip`. Samme udseende (`chip-glass-destructive`), men nu `cursor-pointer` og `aria-label="Løs konflikt"`.
- Nye props: `assignment: Assignment`, `allAssignments: Assignment[]`, `employees`, `cars`, `onResolve?: () => void`. Disse sendes ned fra `AssignmentCard` / `CompactAssignmentRow` (begge har dem allerede tilgængelige via deres props/context).
- Popover-indholdet rendrer den nye `ConflictResolutionPopover`-komponent og videresender de unikke konflikter.

## 2. ConflictResolutionPopover (ny)

Layout: header "Dobbeltbooking" + liste over unikke konflikter. For hver konflikt vises to kort side om side:

```text
┌─ Denne opgave ─────┐  ┌─ Konflikt med ──────┐
│ Titel              │  │ Titel               │
│ 08:00–10:00        │  │ 09:30–11:00         │
│ 👤 Peter / 🚗 Bil2 │  │ 👤 Peter / 🚗 Bil2  │
└────────────────────┘  └─────────────────────┘
[ Ændr tidspunkt ]  [ Skift medarbejder / bil ]
```

Knapperne virker på *denne* opgave (`assignment`), ikke modparten. State i komponenten:

- `mode: 'idle' | 'time' | 'resource'`
- `idle`: viser de to handlingsknapper.
- `time`: viser to `<Input type="time">` (fra/til) forudfyldt med `assignment.fromTime/toTime` + `Gem`-knap. Ved gem:
  ```ts
  await updateAssignment(assignment.id, { fromTime, toTime });
  ```
- `resource`: Hvis konflikten er `kind: 'employee'` → vis en `Select` med tilgængelige `employees` (ekskl. nuværende konflikt-ID). Hvis `kind: 'car'` → samme med `cars`. Ved valg:
  ```ts
  // employee-konflikt: erstat den konfliktende medarbejder
  const newAssigned = assignment.assignedEmployees
    .filter(e => e.id !== conflict.resourceId)
    .concat([{ id: newId, name: ... }]);
  await updateAssignment(assignment.id, { assignedEmployees: newAssigned });

  // car-konflikt: erstat car-id i cars[]
  const newCars = (assignment.cars ?? []).map(c => c === conflict.resourceId ? newId : c);
  await updateAssignment(assignment.id, { cars: newCars });
  ```

Efter en succesfuld mutation:
```ts
toast.success(t('planner.conflict.resolved')); // "Konflikt løst"
onResolve?.();        // lukker popover
```

Badgen forsvinder automatisk i næste render, fordi `computeConflicts` ikke længere finder overlap (ingen ekstra logik nødvendig — den nuværende `useAssignmentConflicts`-hook recomputer ved data-ændring).

Loading-state: deaktivér knapper mens mutationen kører; vis fejltoast ved exception.

## 3. AssignmentCard / CompactAssignmentRow

Send de nye props videre til `ConflictBadge`. Begge komponenter har allerede `assignment` og `conflicts`; `allAssignments`, `employees`, `cars` hentes fra samme hooks/props de allerede bruger (`useOptimizedAssignments`, `useEmployees`, `useCars`) — videregives via eksisterende kontekst/props uden nye queries.

Hvis det er lettere, kan `ConflictResolutionPopover` selv kalde `useOptimizedAssignments()` for at hente `updateAssignment` og `useEmployees()/useCars()` for navne — så undgår vi prop-drilling. Den eksisterende tooltip-info (resourceName) er nok til at vise konfliktdetaljer; vi behøver kun employees/cars-listerne til selectoren i `resource`-mode.

## 4. Oversættelser

`planner.conflict.*`:
- `da`: `resolved: "Konflikt løst"`, `changeTime: "Ændr tidspunkt"`, `changeResource: "Skift medarbejder / bil"`, `thisAssignment: "Denne opgave"`, `conflictsWith: "Konflikt med"`, `save: "Gem"`, `cancel: "Annullér"`.
- `en`: tilsvarende.

## Ude af scope

- Ingen ændring af `computeConflicts`, RLS, eller datakilder.
- Ingen ændring af modpart-opgaven (B) — kun "denne" opgave (A) redigeres; brugeren kan åbne B's badge for at justere den anden vej.
- Ingen drag/drop, batch-resolve, eller persisteret "ignored"-state.
