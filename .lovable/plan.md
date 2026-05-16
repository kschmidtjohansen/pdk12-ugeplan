Layout-only restructure of `AssignmentFormFields.tsx` plus a small footer-styling tweak in `AssignmentForm.tsx`. No validation, state, handler, or business logic touched.

### 1. `src/components/Planner/AssignmentFormFields.tsx`

Replace the single-column `<div className="space-y-4">` wrapper around all fields with a responsive two-column grid:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="space-y-4">
    {/* LEFT COLUMN */}
    {title block}
    {location / AddressAutocomplete block}
    {date picker block (incl. selected-date chips)}
    {fromTime / toTime grid}
    {description Textarea}
  </div>

  <div className="space-y-4">
    {/* RIGHT COLUMN */}
    {canAssignResponsibleUser && <ResponsibleUserSelector />}
    <EmployeeSelector />
    <MultipleCarSelector wrapper />
  </div>
</div>
```

Notes:
- The description moves to the left column per spec ("title, address, date, time range, description").
- "Status" and "series options" do not exist as separate fields in this form today — the multi-date selector inside the date block IS the series mechanism, and there is no status field. The right column will hold the three selectors the form actually has (responsible person, employees, cars). I'll note this rather than invent new UI.
- All field props, handlers, `useState`, `useEffect`, and conditional rendering remain identical — only JSX nesting and wrapper class names change.

### 2. `src/components/Planner/AssignmentForm.tsx`

The sticky footer already exists (lines 417–433) but uses `-mx-8 -mb-8 px-8 py-4` which assumes a specific dialog padding. Align it with the spec:

```tsx
<div className="sticky bottom-0 bg-background border-t border-border pt-3 pb-3 flex flex-col sm:flex-row gap-3 z-10">
  …existing buttons unchanged…
</div>
```

Buttons, disabled state, click handlers, and conditional rendering (`canPublishAssignment`, `currentAssignment && canEdit`, `canPublishTasks && selectedDay`) are kept exactly as-is.

No other files change.