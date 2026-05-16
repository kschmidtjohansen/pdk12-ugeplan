## 1. New shared component — `src/components/shared/AvatarStack.tsx`

Props:
```ts
interface AvatarStackEmployee { id?: string; name: string }
interface AvatarStackProps {
  employees: AvatarStackEmployee[];
  max?: number;        // default 3
  size?: number;       // default 20 (px)
  className?: string;
}
```

Render rules:
- Wrap in a `<TooltipProvider delayDuration={100}>` + single `<Tooltip>`; `<TooltipTrigger asChild>` wraps the row of bubbles.
- Row uses `inline-flex items-center` so overlap works.
- First `max` employees render as circles: `20×20px`, `rounded-full`, `bg-primary/20 text-primary text-[10px] font-semibold`, `ring-2 ring-background` (so the overlap reads cleanly), `flex items-center justify-center`. Each bubble after the first gets `style={{ marginLeft: -4 }}`.
- Initials: take first letter of first two whitespace-split tokens, uppercased; fallback "?".
- If `employees.length > max`, append one extra bubble showing `+N` (same styling, `-4px` overlap).
- Tooltip content: vertical list of all employee names (`<ul className="space-y-1">` with a small primary dot per row), matching the existing pattern in `AssignmentDetails.tsx` lines 167–174.
- Empty input → render nothing.

## 2. `src/components/Duty/DutyMonthCalendar.tsx`

- Import `AvatarStack`.
- After the existing per-duty buttons inside each day cell (after the `<div className="space-y-1">{dayDuties.map(...)}</div>` block, line 257), render — only when `dayDuties.length > 0`:
  ```tsx
  <div className="mt-1">
    <AvatarStack
      employees={dayDuties.map(d => ({
        id: d.id,
        name: d.employee?.name || getDisplayName(d),
      }))}
    />
  </div>
  ```
- Existing buttons, colors, and click handlers stay untouched.

## 3. `src/components/Planner/AssignmentDetails.tsx`

Replace the employee chip rendering (lines 144–178, both the `showInline` branch and the tooltip-fallback branch) with a single `<AvatarStack employees={...} />` that receives `employeeData.names.map(name => ({ name }))`. Keep the `Users` icon-bubble and the surrounding flex wrapper. Drop the now-unused `showInline` constant and the local `TooltipProvider/Tooltip` block for employees (Tooltip imports stay for the cars row).

## Notes

- No changes to data fetching, types, or business logic.
- Tooltip stays Radix — already used elsewhere via `@/components/ui/tooltip`.
- Colors use semantic tokens (`bg-primary/20`, `text-primary`, `ring-background`); no raw hex.