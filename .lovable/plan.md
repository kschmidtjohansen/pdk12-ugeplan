

## Plan: Premium UI Refinement for Weekly Planner

### Scope
Refine the planner page and its components to achieve a Stripe/Linear-quality visual design while strictly maintaining the existing color palette and semantic tokens.

### 1. Page Header (PlannerPage.tsx, lines 401-472)
- Replace heavy `rounded-3xl` gradient hero with a cleaner, flatter header: `rounded-xl` (8px), remove decorative blur circles
- Use a subtle `border border-border` with light `bg-primary/5` instead of solid primary gradient
- Title and week number in `text-foreground` with primary accent only on the icon badge
- Week navigation buttons: clean `border-border` outline style, not white-on-primary
- Overall feel: Linear-style minimal header, not a marketing banner

### 2. Search & View Toggle Bar (PlannerPage.tsx, lines 474-523)
- Tighten padding, use `rounded-lg` with `border border-border/60`
- ToggleGroup items: add `transition-all duration-150` for smooth state changes
- Search input: subtle `focus:ring-1 focus:ring-primary/30` instead of heavy ring

### 3. DaySection (DaySection.tsx) — Standard/Grid View
- Wrap each day in a subtle card container: `border border-border/60 rounded-lg bg-card`
- Day header: clean horizontal bar with `border-b border-border/40`, `px-4 py-3`
- Replace `ChevronDown`/`ChevronRight` toggle with smoother `transition-transform duration-150 rotate-0`/`rotate-90` on a single chevron
- Task count badge: use refined pill `bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full`
- Publish button: subtle `bg-green-50 text-green-700 border border-green-200 hover:bg-green-100` instead of solid `bg-green-600`
- Empty state: softer `border-border/30` dashed border

### 4. AssignmentCard (AssignmentCard.tsx) — Standard View
- Reduce Card radius to `rounded-lg` (8px)
- Remove heavy `shadow-lg` from Card base; use `border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]`
- Hover: `hover:border-primary/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]` — subtle elevation, not `shadow-xl`
- Title: `text-base font-semibold tracking-tight` (not `text-lg`)
- Smooth `transition-all duration-150` on the card
- Warehouse indicator: tone down `animate-pulse`, use static badge with `bg-amber-50 text-amber-700 border border-amber-200`

### 5. AssignmentStatusBadge (AssignmentStatusBadge.tsx)
- Published: refined pill — `bg-green-50 text-green-700 border border-green-200 text-[11px] font-medium tracking-wide uppercase`
- Not published: `bg-amber-50 text-amber-700 border border-amber-200` same style
- Remove `hover:scale-105` from Badge base — enterprise badges should be static

### 6. AssignmentDetails (AssignmentDetails.tsx)
- Icon containers: reduce from `p-1.5 rounded-lg` to `p-1 rounded-md` for tighter feel
- Badge pills for cars/employees: consistent `text-[11px] font-medium border` styling
- Ensure all icons are `h-3.5 w-3.5` consistently

### 7. AssignmentActionButtons (AssignmentActionButtons.tsx)
- Add `transition-colors duration-150` to all ghost buttons
- Ensure consistent `h-7 w-7` sizing with `rounded-md`

### 8. CompactDaySection (CompactDaySection.tsx)
- Header: `bg-muted/30` instead of `bg-primary/5` for subtlety
- Hover: `hover:bg-muted/50 transition-colors duration-150`
- Table header: `text-[11px] uppercase tracking-wider font-medium text-muted-foreground`
- Publish button: match refined green style from DaySection

### 9. CompactAssignmentRow (CompactAssignmentRow.tsx)
- Add `transition-colors duration-150` to row hover
- Action buttons: `opacity-0 group-hover:opacity-100 transition-opacity duration-150` instead of `invisible/visible`
- Consistent icon sizing at `h-3.5 w-3.5`

### 10. PastAssignments (PastAssignments.tsx)
- Fix hardcoded `text-gray-700` → `text-muted-foreground`
- Section divider: use `border-border/40` instead of plain `border-b`

### 11. Badge base component (badge.tsx)
- Remove `hover:scale-105` from base — badges shouldn't scale on hover in enterprise UI
- Reduce default padding slightly: `px-2.5 py-0.5` for tighter pills

### 12. Card base component (card.tsx)
- Reduce from `rounded-2xl` to `rounded-lg` (8px)
- Remove the `before:` gradient overlay pseudo-element
- Simplify to `border border-border/50 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]`
- Remove `backdrop-blur-sm` (unnecessary, performance cost)

### 13. Global CSS micro-interactions (index.css)
- Add utility class for premium card hover: `.card-interactive { transition: border-color 150ms, box-shadow 150ms; }`

### Files to edit
| File | Change |
|------|--------|
| `src/pages/PlannerPage.tsx` | Flatten header, refine toolbar |
| `src/components/Planner/DaySection.tsx` | Card wrapper, refined header, chevron animation |
| `src/components/Planner/AssignmentCard.tsx` | Subtle borders/shadows, tighter typography |
| `src/components/Planner/AssignmentStatusBadge.tsx` | Refined pill badges |
| `src/components/Planner/AssignmentDetails.tsx` | Tighter icon/badge styling |
| `src/components/Planner/AssignmentActionButtons.tsx` | Transition classes |
| `src/components/Planner/CompactDaySection.tsx` | Refined header/table styles |
| `src/components/Planner/CompactAssignmentRow.tsx` | Smooth hover transitions |
| `src/components/Planner/PastAssignments.tsx` | Fix hardcoded color |
| `src/components/Planner/PlannerSearchFilter.tsx` | Subtle focus ring |
| `src/components/ui/badge.tsx` | Remove scale-on-hover, tighten padding |
| `src/components/ui/card.tsx` | Reduce radius, remove overlay, subtle shadow |
| `src/index.css` | Add card-interactive utility |

