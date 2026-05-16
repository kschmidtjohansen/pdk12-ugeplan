## Department pill in AppSidebar footer

### Goal
Show the current department as a coloured pill in the sidebar footer. Clicking it opens a department switcher dropdown. Pill format: `[dot] [Department name] [sub-dept name muted]`, with a deterministic colour derived from the department UUID.

### Current state
- `AppSidebar` footer only renders the static text "Polygon Ugeplan" (no department info).
- The "existing department switcher" lives in `UserMenu` (avatar dropdown in the top bar) as a `DropdownMenuRadioGroup` over `userDepartments` + `userSubDepartments` from `DepartmentContext`.

### What will be built

**1. New utility** `src/utils/departmentColor.ts`
- `getDepartmentColorClasses(id: string)` returns `{ dot: string, pill: string }`
- Hash UUID → index in `[0..5]` (simple `charCodeAt` sum mod 6)
- 6 palettes (background + text + dot):
  - `bg-blue-100 text-blue-800` + `bg-blue-500` dot
  - `bg-emerald-100 text-emerald-800` + `bg-emerald-500`
  - `bg-amber-100 text-amber-800` + `bg-amber-500`
  - `bg-rose-100 text-rose-800` + `bg-rose-500`
  - `bg-violet-100 text-violet-800` + `bg-violet-500`
  - `bg-sky-100 text-sky-800` + `bg-sky-500`

**2. New component** `src/components/Layout/NavComponents/DepartmentSwitcherPill.tsx`
- Reads `selectedDepartmentId`, `userDepartments`, `userSubDepartments`, `selectedSubDepartmentId`, `switchDepartment`, `setSelectedSubDepartmentId` from `DepartmentContext`.
- Renders a `<DropdownMenu>` whose trigger is a `<button>` styled as a pill:
  - `inline-flex items-center gap-1.5 max-w-[180px] px-2 py-1 rounded-full text-xs font-medium truncate`
  - Coloured background from the util
  - Inner: coloured dot (h-1.5 w-1.5 rounded-full), department name (truncate), sub-department name in `text-muted-foreground` (only if a sub-dept is selected and more than one exists)
  - `title` attribute = full "Dept · Sub" string for hover tooltip
- Dropdown content mirrors the dept/sub-dept radio groups from `UserMenu`.
- Hidden entirely if `userDepartments.length <= 1` AND `userSubDepartments.length <= 1` (no switching possible).
- Hidden when sidebar is collapsed (icon-only mode).

**3. Wire into `AppSidebar.tsx`**
- Import `DepartmentSwitcherPill`.
- In `SidebarFooter`, render the pill above the "Polygon Ugeplan" tagline, only when `!collapsed`.

### Out of scope
- `UserMenu` department selector stays as-is (no removal). Both entry points coexist.
- No translation key changes.
- No new dependencies.

### Files changed
- `src/utils/departmentColor.ts` (new)
- `src/components/Layout/NavComponents/DepartmentSwitcherPill.tsx` (new)
- `src/components/Layout/AppSidebar.tsx`
