

## Plan: Availability Status Dots in Employee Selector

### Problem
The `EmployeeSelector` currently checks availability against a single date (`currentDate` = the first selected date). When multiple dates are selected, the user has no visual indication of multi-day availability per employee.

### Solution
Add a colored dot next to each employee name that reflects their availability across **all** selected dates. The dot updates dynamically when dates change.

### Changes

**1. `src/components/Planner/AssignmentFormFields.tsx`**
- Pass the full `selectedDates` array to `EmployeeSelector` as a new prop `allSelectedDates`.

**2. `src/components/Planner/EmployeeSelector.tsx`**
- Accept new optional prop `allSelectedDates: Date[]`.
- Add a `useMemo` that computes a per-employee availability summary across all selected dates:
  - For each employee × each date: call `getEmployeeAvailabilityStatus` + `getEmployeeVacationStatus`
  - Count how many dates are "unavailable" (full-day vacation, on leave, fully booked, terminated/expired)
  - Result: `'full'` (0 conflicts), `'partial'` (some conflicts), `'none'` (all dates have conflicts)
- Render a small dot (`w-2 h-2 rounded-full`) to the left of the employee name:
  - Green (`bg-green-500`) = fully available
  - Yellow (`bg-yellow-500`) = partially unavailable
  - Red (`bg-red-500`) = completely unavailable
- Dot only renders when `allSelectedDates.length > 0`.

### UI placement
The dot sits inline before the employee name, inside the existing `<span className="font-medium">` row. This keeps the list item design pattern intact (name + meta sub-text + right-aligned badges).

```text
[ ] 🟢 Anders Jensen
       3,2 km væk
[ ] 🟡 Ronnie Thomsen        [Delvis ferie]
[ ] 🔴 Marie Larsen          [Fraværende]
```

### Files changed
| File | Change |
|------|--------|
| `src/components/Planner/EmployeeSelector.tsx` | Add `allSelectedDates` prop, availability dot logic + rendering |
| `src/components/Planner/AssignmentFormFields.tsx` | Pass `selectedDates` as `allSelectedDates` to `EmployeeSelector` |

No translation changes needed — dots are purely visual. CHANGELOG updated.

