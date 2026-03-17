

## Plan: Premium HR App Redesign — Vibrant Headers, Deep UI & Refined Cards

A complete visual overhaul transforming the app into a premium HR portal with vibrant gradient headers, layered depth, tactile card interactions, and refined status indicators. No new dependencies — all achieved with CSS/Tailwind.

---

### Phase 1: Base Components (6 files)

**card.tsx** — Clean up the heavy base:
- Remove `before:` gradient overlay, `backdrop-blur-sm`, `bg-card/80`
- New base: `rounded-2xl border border-border/40 bg-card text-card-foreground shadow-sm overflow-hidden`
- CardHeader/Content/Footer: `p-8` → `p-6`, remove `relative z-10` (no overlay to layer above)

**button.tsx** — Remove all `hover:scale-[1.02] active:scale-[0.98]` from every variant. Remove `shadow-md` → `shadow-sm` for default. Outline: `border-2` → `border`, remove `backdrop-blur-sm`. Keep `rounded-xl`. Add `min-h-[44px]` to default size.

**input.tsx** — `border-2` → `border`, remove `backdrop-blur-sm`, `shadow-sm hover:shadow-md focus:shadow-lg`. Keep `rounded-xl`. Add `text-base` to prevent iOS zoom. Clean: `h-11 rounded-xl border border-input bg-background px-4 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring`

**badge.tsx** — Remove `hover:scale-105`. `font-semibold` → `font-medium`.

**dialog.tsx** — Overlay: keep `bg-black/60 backdrop-blur-sm`. Content: remove `before:` gradient overlay, `border-2` → `border`, keep `rounded-2xl`. Close button already 44px.

**status-badge.tsx** — Add subtle borders per variant:
- success/approved: `border border-green-200/60`
- warning/pending: `border border-yellow-200/60`
- error/rejected/destructive: `border border-red-200/60`
- info: `border border-blue-200/60`

---

### Phase 2: Layout (3 files)

**MainLayout.tsx** (line 104) — `bg-gradient-to-br from-muted/20 via-background to-muted/30` → `bg-muted/10`. Keep `pt-20`.

**TopNavbar.tsx** (line 135) — `h-20` → `h-16`. Mobile menu button (line 155): add `min-h-[44px] min-w-[44px]`.

**PageHeader.tsx** — `rounded-2xl` → `rounded-2xl` (keep), `border-border/50` → `border-border/40`, `shadow-md` → `shadow-sm`.

---

### Phase 3: Vibrant Hero Headers (5 pages)

Keep the existing vibrant gradient hero pattern (`bg-gradient-to-br from-primary via-primary/90 to-primary/80`) — this is the premium look. Refine it:

- Keep `rounded-3xl`, gradient, white text, blur circles — they look premium
- Add `text-shadow` via inline style on titles for crispness: `style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}`
- Reduce `shadow-2xl` → `shadow-lg` for subtlety
- Ensure all hero buttons have `min-h-[44px]` touch targets

Apply to: **PlannerPage.tsx** (line 401), **CarsPage.tsx** (line 56), **VacationPage.tsx** (line 16), **WelcomeHeader.tsx** (line 34)

**WarehousePage.tsx** (line 85) — Upgrade to match the same vibrant hero pattern (currently uses a weaker `bg-gradient-to-r from-primary/10` style).

**DashboardPage.tsx** (line 45) — `bg-gradient-to-br from-gray-25 via-background to-gray-50` → `bg-muted/10`

**EmployeesPage.tsx** (line 100) — `bg-background` → `bg-muted/10`, padding `px-4 sm:px-6 lg:px-8`

**DutyPage.tsx** (line 116) — Add consistent padding `px-4 sm:px-6 lg:px-8`

**AdminPage.tsx** (line 60) — Add consistent padding wrapper

**ChangeLogPage.tsx** (line 150) — Remove double `<MainLayout>` wrapping

---

### Phase 4: Planner — Tactile Cards & Depth (4 files)

**DaySection.tsx** — Wrap each day in an elevated container:
- Outer: `border border-border/40 rounded-2xl bg-card shadow-sm p-4 sm:p-5`
- Chevron: single `ChevronRight` with `transition-transform duration-200` + conditional `rotate-90`
- Task count: pill badge `bg-muted text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded-full`
- Publish button: keep `bg-green-600` (vibrant, intentional) but ensure `min-h-[44px]`
- Empty state: use `bg-muted/10 border border-dashed border-border/30 rounded-xl` with softer icon

**AssignmentCard.tsx** — Tactile card treatment:
- Card class: `rounded-2xl border-l-4 border-l-primary bg-card border border-border/40 shadow-sm hover:-translate-y-[2px] hover:shadow-md transition-all duration-300 ease-out`
- The `border-l-4 border-l-primary` provides the bold left accent for shifts
- Remove `hover:border-polygon-purple hover:shadow-xl` — replaced with subtle lift
- Warehouse indicator: remove `animate-pulse`, static pill `bg-amber-50 text-amber-700 border border-amber-200 rounded-lg`
- Add `active:scale-[0.98]` for tactile click feel

**CompactDaySection.tsx** (line 60) — Header: `bg-primary/5` → `bg-muted/30`. Chevron: single icon with rotation transition.

**CompactAssignmentRow.tsx** (line 71) — Add `transition-colors duration-200` to hover. Action buttons: `opacity-0 group-hover:opacity-100 transition-opacity duration-150`.

---

### Phase 5: Dashboard — Refined Metrics (3 files)

**MetricCard.tsx** — Remove heavy effects:
- Remove `shadow-lg hover:shadow-2xl` → `shadow-sm hover:shadow-md`
- Remove `hover:scale-[1.02]`
- Remove `border-2` → `border`
- Remove inner gradient overlay div
- Remove `hover:scale-110` from icon container
- Keep `border-l-4` colored accent (great design)
- Add `hover:-translate-y-[1px] transition-all duration-200`

**InteractiveMetricCard.tsx** — Same refinements. Remove `active:scale-[0.98]` from card level, `border-2` → `border`, remove inner gradient overlay, icon `hover:scale-105` → remove.

**QuickAccessGrid.tsx** (line 72) — Remove `hover:-translate-y-1`, `hover:shadow-lg hover:shadow-primary/10`, `border-2` → `border`. Use `hover:-translate-y-[2px] hover:shadow-md transition-all duration-300`.

---

### Phase 6: Global CSS (index.css)

- In `fadeInUp` keyframe: keep `translateY(20px)` (already good)
- Add `.card-interactive` utility: `@apply transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md`
- Remove excessive spacing variables (lines 106-140) — Tailwind already handles this

---

### Files to edit (25 files)

| File | Summary |
|------|---------|
| `src/components/ui/card.tsx` | Remove overlay/blur, clean base |
| `src/components/ui/button.tsx` | Remove scale animations |
| `src/components/ui/input.tsx` | Simplify borders, add text-base |
| `src/components/ui/badge.tsx` | Remove hover:scale |
| `src/components/ui/dialog.tsx` | Remove gradient overlay |
| `src/components/ui/status-badge.tsx` | Add subtle borders |
| `src/components/Layout/MainLayout.tsx` | Soft muted background |
| `src/components/Layout/TopNavbar.tsx` | Reduce height, touch targets |
| `src/components/Layout/PageHeader.tsx` | Soften shadow |
| `src/index.css` | Add utility, clean up |
| `src/pages/PlannerPage.tsx` | Refine hero, text-shadow |
| `src/pages/CarsPage.tsx` | Refine hero |
| `src/pages/VacationPage.tsx` | Refine hero |
| `src/pages/DashboardPage.tsx` | Muted bg |
| `src/pages/WarehousePage.tsx` | Upgrade to vibrant hero |
| `src/pages/EmployeesPage.tsx` | Consistent bg/padding |
| `src/pages/DutyPage.tsx` | Consistent padding |
| `src/pages/AdminPage.tsx` | Consistent padding |
| `src/pages/ChangeLogPage.tsx` | Remove double MainLayout |
| `src/components/Dashboard/WelcomeHeader.tsx` | Refine hero |
| `src/components/Dashboard/MetricCard.tsx` | Remove heavy effects |
| `src/components/Dashboard/InteractiveMetricCard.tsx` | Remove heavy effects |
| `src/components/Dashboard/QuickAccessGrid.tsx` | Soften hover |
| `src/components/Planner/DaySection.tsx` | Card wrapper, tactile |
| `src/components/Planner/AssignmentCard.tsx` | Lift hover, left accent |
| `src/components/Planner/CompactDaySection.tsx` | Soften header |
| `src/components/Planner/CompactAssignmentRow.tsx` | Smooth transitions |

### Technical notes
- Zero new dependencies (no framer-motion)
- CSS/Tailwind class changes only — no logic changes
- Strictly uses existing semantic CSS variables
- Vibrant headers preserved and refined (not flattened)
- Tactile card hover with `translate-y` + `shadow-md` for premium feel
- Left border accents (`border-l-4 border-l-primary`) on assignment cards for instant visual type recognition

