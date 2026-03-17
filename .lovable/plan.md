

## Plan: Fugtpartner-Inspired Global Redesign

Adopt the clean, minimal Fugtpartner AI design system: animated mesh background, glass utilities, compact navigation, simple text headers (no hero banners), and refined component styling. Preserve existing color palette.

---

### Design System Differences (Current → Target)

| Aspect | Current | Fugtpartner Target |
|--------|---------|-------------------|
| Background | Flat `bg-muted/10` | Animated mesh gradient blobs (blurred, floating) |
| Navigation | `h-16`, solid bg | `h-12`, `glass` effect, compact |
| Page headers | Heavy gradient hero banners with blur circles | Simple text: `text-2xl font-semibold` + subtitle |
| Cards | `rounded-2xl`, heavy shadow | `rounded-lg`, `glass-card`, minimal border |
| Buttons | `rounded-xl`, many variants | `rounded-md`, `btn-premium` default gradient |
| Inputs | `rounded-xl`, `h-11` | `rounded-md`, `h-10`, clean |
| Interactivity | `hover:-translate-y-[2px]` | `card-hover-glow` (border glow + subtle scale) |
| Animations | CSS `animate-fade-in-up` | framer-motion `PageTransition` + `StaggerContainer` |
| Sections | No visual grouping | `section-accent` (border-l-3 primary) |

---

### Phase 1: Global CSS & Utilities (index.css)

Overhaul `src/index.css`:
- Add **animated mesh background** CSS: 3 floating blurred blobs using `--primary` colors, `mesh-bg` class with `mesh-float-1/2/3` keyframes (25-30s cycles)
- Add **glass utilities**: `.glass` (`bg-background/80 backdrop-blur-xl`), `.glass-card` (`bg-card/90 backdrop-blur-lg`), `.gradient-text`, `.card-hover-glow` (border glow + `translateY(-1px) scale(1.01)` on hover), `.btn-premium` (gradient bg + shadow), `.section-accent` (`border-l-[3px] border-l-primary pl-4`)
- Remove all heavy animation utilities (`animate-fade-in-up`, `animate-scale-in`, etc.) — replaced by framer-motion
- Remove `.modern-card`, `.modern-button`, `.modern-input`, `.modern-table` classes
- Remove `.page-container`, `.hover-lift`, `.hover-glow`, `.interactive-scale` utilities
- Simplify scrollbar to 5px, transparent track
- Simplify base heading styles (just `letter-spacing: -0.025em`, remove excessive size overrides)
- Change `--radius` from `0.75rem` to `0.5rem`
- Clean up `--card` to `210 20% 98%` (slightly off-white like Fugtpartner)

### Phase 2: Base UI Components (5 files)

**card.tsx** — Simplify to `rounded-lg border bg-card text-card-foreground shadow-sm`. Remove all `rounded-2xl`, overlay layers, backdrop-blur. CardHeader spacing to `space-y-1.5`.

**button.tsx** — Default variant becomes `btn-premium text-primary-foreground`. Outline gets `hover:border-primary/30`. Base `rounded-xl` → `rounded-md`. Default size `h-11 min-h-[44px]` → `h-10 px-4 py-2`. Remove `gradient`, `glass`, `success`, `warning`, `info` variants. Remove `xl` size.

**input.tsx** — `rounded-xl` → `rounded-md`, `h-11` → `h-10`, remove `hover:border-primary/30`, keep `text-base` + `md:text-sm`.

**badge.tsx** — Ensure `font-medium`, no `hover:scale`.

**dialog.tsx** — Remove `before:` gradient overlay on content. Keep `rounded-2xl` for dialogs. Simplify content borders.

### Phase 3: Layout (2 files)

**MainLayout.tsx** — Add animated mesh background div inside the layout wrapper:
```
<div className="mesh-bg">
  <div className="blob blob-1" />
  <div className="blob blob-2" />
  <div className="blob blob-3" />
</div>
```
Main content area: `flex-1 p-4 lg:p-6 overflow-auto relative z-10` with `max-w-7xl mx-auto` inner wrapper. Remove `bg-muted/10`.

**TopNavbar.tsx** — Change from `h-16 bg-background/95 backdrop-blur-md border-b shadow-soft` to `h-12 glass shadow-sm border-b sticky`. Make it more compact with tighter spacing. Keep all existing navigation logic intact.

### Phase 4: Remove All Hero Banners (6 pages)

Replace every vibrant gradient hero section with simple Fugtpartner-style text headers.

**PlannerPage.tsx** (lines 401-472) — Delete the entire `rounded-3xl bg-gradient-to-br from-primary...` hero block. Replace with:
- Simple header: date as `text-xs text-muted-foreground`, title as `text-2xl font-semibold tracking-tight`
- Week nav + action buttons on the same row, using standard outline buttons
- No blur circles, no gradient, no white text

**CarsPage.tsx** — Remove gradient hero, replace with simple text header
**VacationPage.tsx** — Remove gradient hero, replace with simple text header  
**WarehousePage.tsx** — Remove gradient hero, replace with simple text header
**WelcomeHeader.tsx** — Remove gradient hero. Replace with simple greeting: `text-2xl font-semibold` with `gradient-text` on the name. Date as `text-xs text-muted-foreground`. Stats as a `glass-card` strip (like Fugtpartner Index page).
**DashboardPage.tsx** — Remove `bg-muted/10`, padding handled by MainLayout now

### Phase 5: Dashboard Components (3 files)

**MetricCard.tsx** — Rewrite to match Fugtpartner stats strip style: simpler, `glass-card` with icon in `bg-primary/10 rounded-lg`, clean typography. Remove `border-l-4` colored accents. Remove `animate-scale-in`.

**InteractiveMetricCard.tsx** — Same simplification as MetricCard.

**QuickAccessGrid.tsx** — Replace Card-based grid with `glass-card card-hover-glow` button pattern (like Fugtpartner action buttons): left icon area with `bg-muted/50 border-r`, title + description, `ArrowRight` on right. Remove colored icon backgrounds.

### Phase 6: Planner Components (4 files)

**DaySection.tsx** — Use `glass-card` container. Header becomes compact row with `text-xs font-semibold uppercase tracking-wider text-muted-foreground`. No heavy wrappers.

**AssignmentCard.tsx** — Simplify to `glass-card card-hover-glow rounded-lg border overflow-hidden`. Remove `border-l-4`, `hover:-translate-y-[2px]`, `active:scale-[0.98]`. Use `card-hover-glow` for hover effect instead.

**CompactDaySection.tsx** — Header: `bg-muted/40 border-b` instead of `bg-primary/5`.

**CompactAssignmentRow.tsx** — Add `hover:bg-muted/40 transition-colors`.

### Phase 7: Remaining Pages (4 files)

**EmployeesPage.tsx**, **DutyPage.tsx**, **AdminPage.tsx** — Remove any page-level background/padding overrides. Content is now wrapped by MainLayout's `max-w-7xl mx-auto`.

**ChangeLogPage.tsx** — Remove double `<MainLayout>` wrapping.

### Phase 8: PageHeader Component

**PageHeader.tsx** — Simplify to no card wrapper. Just a `div` with title as `text-2xl font-semibold tracking-tight` and description as `text-sm text-muted-foreground mt-0.5`. No border, no rounded, no shadow.

---

### Files to edit (22 files)

| File | Change |
|------|--------|
| `src/index.css` | Add mesh bg, glass utilities, remove bloat, change `--radius` |
| `src/components/ui/card.tsx` | Simplify to `rounded-lg` minimal |
| `src/components/ui/button.tsx` | `btn-premium` default, `rounded-md` |
| `src/components/ui/input.tsx` | `rounded-md`, `h-10` |
| `src/components/ui/badge.tsx` | Ensure clean |
| `src/components/ui/dialog.tsx` | Remove gradient overlay |
| `src/components/Layout/MainLayout.tsx` | Add mesh bg, `max-w-7xl` wrapper |
| `src/components/Layout/TopNavbar.tsx` | `h-12`, `glass`, compact |
| `src/components/Layout/PageHeader.tsx` | Simple text, no card |
| `src/pages/PlannerPage.tsx` | Remove hero, simple header |
| `src/pages/CarsPage.tsx` | Remove hero |
| `src/pages/VacationPage.tsx` | Remove hero |
| `src/pages/WarehousePage.tsx` | Remove hero |
| `src/pages/DashboardPage.tsx` | Remove bg overrides |
| `src/pages/EmployeesPage.tsx` | Remove bg/padding overrides |
| `src/pages/DutyPage.tsx` | Remove bg/padding overrides |
| `src/pages/AdminPage.tsx` | Remove bg/padding overrides |
| `src/pages/ChangeLogPage.tsx` | Remove double MainLayout |
| `src/components/Dashboard/WelcomeHeader.tsx` | Simple text + gradient-text |
| `src/components/Dashboard/MetricCard.tsx` | Glass-card strip style |
| `src/components/Dashboard/QuickAccessGrid.tsx` | Glass-card action buttons |
| `src/components/Planner/DaySection.tsx` | Glass-card container |
| `src/components/Planner/AssignmentCard.tsx` | Glass-card + card-hover-glow |
| `src/components/Planner/CompactDaySection.tsx` | Subtle header |
| `src/components/Planner/CompactAssignmentRow.tsx` | Clean hover |

### Technical notes
- Zero new dependencies (no framer-motion for now — CSS animations only in phase 1)
- Strictly preserves existing color palette variables
- All logic, props, handlers, callbacks untouched — only DOM structure and Tailwind classes change
- `--radius` changes from `0.75rem` to `0.5rem` globally (affects all `rounded-lg/md/sm`)
- Mesh background is purely decorative (`pointer-events: none`, `z-index: 0`)
- Dark mode handled via `.dark .mesh-bg .blob` opacity reduction and `.dark .glass` adjustments
- Memory document `ui/visual-design-system` must be updated after implementation

