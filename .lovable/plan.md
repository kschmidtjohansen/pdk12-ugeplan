

## Plan: Multi-Date Aware Car Selector

### Current State
- **EmployeeSelector**: Already fully context-aware. It receives `allSelectedDates` and computes per-employee availability across all selected dates, rendering green/yellow/red dots. No changes needed.
- **MultipleCarSelector**: Only checks availability against a single `currentDate` string. It does not account for multiple selected dates.

### Problem
When a user selects multiple dates, the car selector only shows availability for the first selected date. A car might be free on Monday but booked on Wednesday — the user can't see this.

### Solution
Add multi-date awareness to `MultipleCarSelector`, mirroring the pattern already used in `EmployeeSelector`.

### Changes

| File | Change |
|------|--------|
| `src/components/Planner/MultipleCarSelector.tsx` | Add `allSelectedDates?: Date[]` prop. Compute per-car multi-date availability (full/partial/none) by checking bookings across all dates. Render green/yellow/red dot next to car name (same pattern as EmployeeSelector). Update conflict dialog to show which dates have conflicts. |
| `src/components/Planner/AssignmentFormFields.tsx` | Pass `allSelectedDates={selectedDates}` to `MultipleCarSelector`. |
| `src/translations/da/planner.ts` | Add `cars.partiallyBooked: 'Delvist booket'` |
| `src/translations/en/planner.ts` | Add `cars.partiallyBooked: 'Partially booked'` |
| `CHANGELOG.md` | Document the change |

### MultipleCarSelector Detail

New `useMemo` block (mirrors EmployeeSelector lines 89-128):
```text
For each car:
  For each selected date:
    Check if car is booked by another assignment on that date
  Result: 'full' (free all dates), 'partial' (some conflicts), 'none' (all dates booked)
```

Render a colored dot (`bg-green-500` / `bg-yellow-500` / `bg-red-500`) inline with the car name, identical to the employee dot pattern. The existing single-date badge ("Available" / "In use until X") remains for backwards compatibility when only one date is selected.

### No database changes needed

