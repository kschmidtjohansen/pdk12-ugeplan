

## Plan: Employee Conflict Check Before Assignment Submission

### Problem
When creating/editing assignments with multiple employees across multiple dates, there is no pre-submission check for overlapping bookings, vacations, or absences. Users can unknowingly double-book employees.

### Solution
Add a conflict detection layer in `AssignmentForm.tsx` that runs before calling `onSubmit`. If conflicts are found, store them in state and display a warning dialog — the user can then choose to proceed or cancel.

### Architecture

```text
AssignmentForm
  ├─ handleFormSubmit()
  │    ├─ validation (existing)
  │    ├─ NEW: checkEmployeeConflicts()
  │    │    ├─ For each employee × each date:
  │    │    │   ├─ Check existing assignments (time overlap)
  │    │    │   ├─ Check vacations (full_day or partial_day overlap)
  │    │    │   └─ Check onLeave status
  │    │    └─ Return ConflictInfo[]
  │    ├─ If conflicts → set state, show dialog
  │    └─ If no conflicts → call onSubmit()
  └─ ConflictWarningDialog (inline AlertDialog)
       ├─ Lists each conflict (employee name, date, reason)
       ├─ "Opret alligevel" button → calls onSubmit()
       └─ "Annuller" button → closes dialog
```

### Files to change

| File | Change |
|------|--------|
| `src/components/Planner/AssignmentForm.tsx` | Add `conflictDetails` state, `checkEmployeeConflicts()` function, conflict warning AlertDialog UI, modify `handleFormSubmit` to run check before submit |
| `src/translations/da/planner.ts` | Add conflict-related keys (`conflictsFound`, `conflictBooking`, `conflictVacation`, `conflictLeave`, `proceedAnyway`, `conflictsTitle`) |
| `src/translations/en/planner.ts` | Same keys in English |
| `CHANGELOG.md` | Document the new conflict check feature |

### Conflict check logic (in AssignmentForm)

```typescript
interface EmployeeConflict {
  employeeId: string;
  employeeName: string;
  date: string;
  reason: 'booking' | 'vacation' | 'partialVacation' | 'onLeave';
  details: string; // e.g. "Booked 08:00-14:00 on Task X"
}

const checkEmployeeConflicts = (): EmployeeConflict[] => {
  const conflicts: EmployeeConflict[] = [];
  const selectedEmployeeIds = normalizeEmployees(formData.employees);
  const dates = (formData as any).dates || [formData.date];

  for (const empId of selectedEmployeeIds) {
    const emp = employees.find(e => e.id === empId);
    if (!emp) continue;

    for (const dateStr of dates) {
      const dateObj = new Date(dateStr); // local parse

      // 1. Check onLeave
      if (emp.onLeave) → push conflict

      // 2. Check vacations (reuse getEmployeeVacationStatus)
      const vacStatus = getEmployeeVacationStatus(empId, dateObj, vacations);
      if full_day → push conflict
      if partial_day + time overlap → push conflict

      // 3. Check existing assignments (exclude current if editing)
      Filter assignments by date + employee, check time overlap
      with formData.fromTime/toTime → push conflict with task title
    }
  }
  return conflicts;
};
```

### UI behavior
- Conflicts stored in `useState<EmployeeConflict[]>([])`.
- When conflicts exist, an `AlertDialog` opens listing each conflict.
- User can dismiss (cancel) or proceed anyway ("Opret alligevel" / "Fortsæt alligevel").
- Proceeding calls the original `onSubmit` flow unchanged.

### Knowledge compliance
- No new console.log without `import.meta.env.DEV` guard.
- Translations in both DA and EN.
- CHANGELOG updated.
- Uses existing `getEmployeeVacationStatus` from `src/utils/employeeAvailability.ts`.
- No database changes needed — all checks are client-side against already-loaded data.

