# Plan: Sidebar polish, favicon, and pastel pill colors

## 1. Sidebar header alignment

In `src/components/Layout/AppSidebar.tsx`:
- Increase `SidebarHeader` height slightly (`h-12`) and use proper centered flex with consistent padding so both states feel balanced.
- Collapsed state: render mark at `h-8 w-8`, perfectly centered (no surrounding container offset).
- Expanded state: wrap mark + wordmark in a flex row with `items-center justify-center gap-2.5 w-full`, mark at `h-7 w-7`, wordmark at `h-5`. Use `mx-auto` so the pair sits centered, not left-biased.
- Remove the gradient/border quirks so the divider line under the header is clean across collapsed/expanded transitions.

## 2. Polygon favicon

- Copy `src/assets/polygon-mark.png` to `public/favicon.png`.
- Delete `public/favicon.svg` (and `public/favicon.ico` if present) so the new PNG is the only icon source.
- Update `index.html`:
  - `<link rel="icon" href="/favicon.png" type="image/png">`
  - `<link rel="apple-touch-icon" href="/favicon.png">`
  - Update `og:image` to use `/favicon.png` as well.

## 3. Assignment card color scheme (pastel pills)

Reference image: soft pastel pills with colored icons inside small tinted circles, neutral card surface, status pill in mint green, destructive icon in red.

### `src/index.css` — add pastel chip variants
Extend existing `.chip` system with pastel tonal variants (light bg + matching foreground), all using HSL tokens so dark mode still works:

```css
@layer components {
  /* Base neutral chip stays as is */

  /* Pastel tonal variants */
  .chip-time   { @apply bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20; }
  .chip-car    { @apply bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20; }
  .chip-person { @apply bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20; }
  .chip-resp   { @apply bg-transparent border-transparent px-0 text-foreground; }

  /* Round icon badge that sits to the LEFT of a pill (not inside it) */
  .icon-bubble { @apply inline-flex items-center justify-center h-6 w-6 rounded-full shrink-0; }
  .icon-bubble-time   { @apply bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400; }
  .icon-bubble-car    { @apply bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400; }
  .icon-bubble-person { @apply bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400; }
  .icon-bubble-resp   { @apply bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400; }
}
```

Status badge (`AssignmentStatusBadge` for `Aftalt` / "agreed"):
- Use mint pastel: `bg-emerald-50 text-emerald-700 border-emerald-100` (dark: emerald 500/10).

### `src/components/Planner/AssignmentDetails.tsx` — restructure rows
Replace current row markup with the bubble-icon + pastel-pill pattern from the reference:

- **Row 1 (time + cars):**
  - Left: `<span class="icon-bubble icon-bubble-time"><Clock/></span>` followed by a single `chip chip-time` pill containing `08:00 - 16:00` (no inline icon inside the pill).
  - Spacer pushes cars to far right (or wraps below on narrow): `icon-bubble icon-bubble-person` containing the `Users` icon, then person pills with `chip chip-person`.
- **Row 2 (cars on its own row, like screenshot):**
  - `<span class="icon-bubble icon-bubble-car"><Car/></span>` then car name(s) as `chip chip-car`.
- Remove the inline `Clock`, `Car`, `Users` lucide icons from inside chips; they live in the icon bubbles now.
- Keep conflict logic: a conflicting car keeps a destructive ring + small `AlertTriangle` to the right, but background stays the pastel base.

### `src/components/Planner/AssignmentCard.tsx` — header polish
- Title row: keep `12-013828` style number + address line below.
- Responsible user: drop the bordered chip wrapper. Render as plain inline row: `icon-bubble icon-bubble-resp` (small) + `Sagsansvarlig: <name>` text. Use a light-blue `UserCheck` icon to match the reference.
- Status dot: keep but tone down to subtle gray for draft, emerald for published, amber for conflict.
- Card surface: drop the gradient (`from-card to-card/70`), use flat `bg-card` with `border-border/60` and `shadow-xs` for the calmer reference look.
- Action icons (pencil/copy/screen/trash): ensure colors match — neutral gray normally, red for delete, all `h-4 w-4`. (Done in `AssignmentActionButtons`; only adjust if currently colored.)

### `src/components/Planner/CompactAssignmentRow.tsx`
Apply the same pastel pill + bubble icon pattern in compact rows so list/grid views match.

## 4. Files touched

- `src/components/Layout/AppSidebar.tsx` — header centering
- `index.html` — favicon links + og:image
- `public/favicon.png` — new (copied from `src/assets/polygon-mark.png`)
- `public/favicon.svg` — delete
- `src/index.css` — pastel chip + icon-bubble utilities, status badge tweak
- `src/components/Planner/AssignmentDetails.tsx` — row restructure
- `src/components/Planner/AssignmentCard.tsx` — flat surface, responsible-user row
- `src/components/Planner/AssignmentStatusBadge.tsx` — mint pastel for "Aftalt"
- `src/components/Planner/CompactAssignmentRow.tsx` — same pastel system
- `CHANGELOG.md` + `docs/implementation-plan/tasks.md` — log changes per project rules

## Out of scope
- No data/logic changes. No new dependencies. No translations changes.
