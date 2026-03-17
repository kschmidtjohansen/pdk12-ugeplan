

## Plan: Global Mobile-First UI Overhaul

This is a large-scale visual refinement across the entire application. The goal is to create a cohesive, welcoming, mobile-optimized HR portal feel (Planday/BambooHR-inspired) while strictly preserving the existing color palette.

### Current State Analysis
The app has inconsistent styling across pages:
- Some pages use heavy gradient hero headers (Planner, Cars, Vacation, Dashboard) with `rounded-3xl shadow-2xl` decorative blur circles
- Others use minimal headers (Employees, Duty, Admin)
- Cards use `rounded-2xl` with `backdrop-blur-sm` and gradient overlays
- Buttons have aggressive `hover:scale-[1.02] active:scale-[0.98]` animations
- Badges have `hover:scale-105`
- Hardcoded colors exist in MetricCard, QuickAccessGrid, status-badge
- Input fields are overly styled with `border-2`, `backdrop-blur-sm`, `shadow-sm hover:shadow-md focus:shadow-lg`
- Mobile padding/touch targets are inconsistent

### Design Principles
- Replace heavy gradient hero banners with clean, subtle headers
- Standardize all cards to `rounded-xl border border-border/40 bg-card shadow-sm`
- Remove aggressive scale/lift animations; use only `transition-all duration-200` color/border shifts
- Ensure 44px minimum touch targets on mobile
- Use `px-3 sm:px-4 lg:px-8` globally for breathing room on mobile
- 16px base font on inputs to prevent iOS zoom

---

### Phase 1: Base Components (affects everything downstream)

#### 1.1 `src/components/ui/card.tsx`
- Change `rounded-2xl` to `rounded-xl`
- Remove `before:` gradient overlay pseudo-element
- Remove `backdrop-blur-sm`
- Simplify to: `rounded-xl border border-border/40 bg-card text-card-foreground shadow-sm overflow-hidden`

#### 1.2 `src/components/ui/badge.tsx`
- Remove `hover:scale-105` from base cva
- Tighten to `px-2.5 py-0.5 text-xs font-medium` (remove `font-semibold`)
- Keep existing variant colors but ensure they use semantic tokens

#### 1.3 `src/components/ui/button.tsx`
- Remove all `hover:scale-[1.02] active:scale-[0.98]` from every variant
- Remove `shadow-md` from default/destructive; use `shadow-sm`
- Change base `rounded-xl` to `rounded-lg`
- Remove `backdrop-blur-sm` from outline variant
- Remove `border-2` from outline, use `border`
- Remove gradient/glass variants' heavy effects
- Ensure `min-h-[44px]` on default size for mobile touch

#### 1.4 `src/components/ui/input.tsx`
- Change `border-2` to `border`
- Remove `backdrop-blur-sm`, `shadow-sm hover:shadow-md focus:shadow-lg`
- Change `rounded-xl` to `rounded-lg`
- Add `text-base` (16px) to prevent iOS zoom
- Simplify to clean: `h-11 rounded-lg border border-input bg-background px-3 text-base transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-primary/40`

#### 1.5 `src/components/ui/dialog.tsx`
- Change overlay from `bg-black/60` to `bg-background/80 backdrop-blur-sm`
- Remove `before:` gradient overlay on DialogContent
- Simplify to `rounded-xl border border-border bg-background p-6 shadow-lg`
- Ensure close button is 44x44px touch target

#### 1.6 `src/components/ui/status-badge.tsx`
- Add subtle borders to each variant (e.g., `border border-green-200` for success)

#### 1.7 `src/components/Layout/PageHeader.tsx`
- Already clean; standardize to `rounded-xl border border-border/40 bg-card shadow-sm p-4 sm:p-6`

---

### Phase 2: Global Layout

#### 2.1 `src/components/Layout/MainLayout.tsx`
- Change main padding from `pt-20` to `pt-16` (tighter navbar assumption)
- Remove gradient on main: just `bg-background`

#### 2.2 `src/components/Layout/TopNavbar.tsx`
- Reduce height from `h-20` to `h-14 sm:h-16`
- Mobile menu button: ensure `min-h-[44px] min-w-[44px]`

#### 2.3 `src/index.css`
- Remove `animate-fade-in-up` translateY(30px) — reduce to 10px for subtlety
- Remove `hover:scale-110` from icon containers in MetricCard
- Add `.card-interactive` utility: `transition: border-color 200ms, box-shadow 200ms`
- Tone down scrollbar styling

---

### Phase 3: Page Headers (Flatten all gradient heroes)

Replace the heavy gradient hero pattern used on PlannerPage, CarsPage, VacationPage, DashboardPage/WelcomeHeader, WarehousePage with a consistent clean header:

Pattern: `bg-card rounded-xl border border-border/40 shadow-sm p-4 sm:p-6`
- Title: `text-xl sm:text-2xl font-semibold text-foreground`
- Subtitle: `text-sm text-muted-foreground`
- Icon: small `p-2 rounded-lg bg-primary/10 text-primary` badge beside title
- Remove all decorative blur circles and absolute-positioned gradients

#### 3.1 `src/pages/PlannerPage.tsx` (lines 401-472)
- Replace gradient hero with clean card header
- Week nav buttons: standard outline buttons
- Action buttons: standard primary/outline

#### 3.2 `src/pages/CarsPage.tsx` (lines 56-87)
- Replace gradient hero with clean card header

#### 3.3 `src/pages/VacationPage.tsx` (lines 16-36)
- Replace gradient hero with clean card header

#### 3.4 `src/components/Dashboard/WelcomeHeader.tsx`
- Replace gradient hero with clean card header
- Move date/week info inline

#### 3.5 `src/pages/WarehousePage.tsx` (lines 85-96)
- Replace gradient banner with clean card header

#### 3.6 `src/pages/DashboardPage.tsx`
- Remove `bg-gradient-to-br from-gray-25 via-background to-gray-50` — use `bg-background`
- Standardize padding to `px-3 sm:px-4 lg:px-8`

#### 3.7 `src/pages/EmployeesPage.tsx`
- Already clean; just ensure consistent padding

#### 3.8 `src/pages/DutyPage.tsx`
- Already clean; ensure consistent padding `px-3 sm:px-4 lg:px-8`

#### 3.9 `src/pages/AdminPage.tsx`
- Standardize padding to match other pages

#### 3.10 `src/pages/ChangeLogPage.tsx`
- Remove double MainLayout wrapping (it's already wrapped by routing)

---

### Phase 4: Planner-Specific Components

#### 4.1 `src/components/Planner/DaySection.tsx`
- Wrap in subtle card container: `border border-border/40 rounded-xl bg-card p-4`
- Publish button: `bg-green-50 text-green-700 border border-green-200 hover:bg-green-100` instead of solid `bg-green-600`
- Chevron: single icon with `transition-transform duration-200 rotate-0/rotate-90`

#### 4.2 `src/components/Planner/AssignmentCard.tsx`
- Remove `hover:shadow-xl`; use `hover:border-border/80 hover:shadow-md transition-all duration-200`
- Warehouse indicator: remove `animate-pulse`, use static badge `bg-amber-50 text-amber-700 border border-amber-200`

#### 4.3 `src/components/Planner/CompactDaySection.tsx`
- Soften header bg from `bg-primary/5` to `bg-muted/30`
- Publish button: match refined green style

#### 4.4 `src/components/Planner/CompactAssignmentRow.tsx`
- Add `transition-colors duration-200` to row hover
- Action buttons: `opacity-0 group-hover:opacity-100 transition-opacity duration-150`

#### 4.5 `src/components/Planner/AssignmentStatusBadge.tsx`
- Use inline refined pills instead of StatusBadge: `bg-green-50 text-green-700 border border-green-200 text-[11px] font-medium`

#### 4.6 `src/components/Planner/PlannerSearchFilter.tsx`
- Ensure input matches new Input base style

---

### Phase 5: Dashboard Components

#### 5.1 `src/components/Dashboard/MetricCard.tsx`
- Remove `shadow-lg hover:shadow-2xl` — use `shadow-sm hover:shadow-md`
- Remove `hover:scale-[1.02]`
- Remove `hover:scale-110` from icon container
- Remove inner gradient overlay
- Keep colored left border accent (good design)

#### 5.2 `src/components/Dashboard/InteractiveMetricCard.tsx`
- Same refinements as MetricCard

#### 5.3 `src/components/Dashboard/QuickAccessGrid.tsx`
- Remove `hover:-translate-y-1`, `hover:shadow-lg hover:shadow-primary/10`
- Use `hover:border-border/80 hover:shadow-md transition-all duration-200`
- Remove `border-2` from Card — use `border`

---

### Files to edit (27 files)

| File | Summary |
|------|---------|
| `src/components/ui/card.tsx` | Simplify: remove overlay, blur, reduce radius |
| `src/components/ui/badge.tsx` | Remove hover:scale, tighten padding |
| `src/components/ui/button.tsx` | Remove scale animations, reduce shadows |
| `src/components/ui/input.tsx` | Simplify borders, add text-base for iOS |
| `src/components/ui/dialog.tsx` | Softer overlay, remove gradient overlay |
| `src/components/ui/status-badge.tsx` | Add subtle borders |
| `src/components/Layout/MainLayout.tsx` | Remove gradient bg on main |
| `src/components/Layout/TopNavbar.tsx` | Reduce height, ensure touch targets |
| `src/components/Layout/PageHeader.tsx` | Standardize card style |
| `src/index.css` | Tone down animations, add utilities |
| `src/pages/PlannerPage.tsx` | Flatten header |
| `src/pages/CarsPage.tsx` | Flatten header |
| `src/pages/VacationPage.tsx` | Flatten header |
| `src/pages/DashboardPage.tsx` | Remove gradient bg |
| `src/pages/EmployeesPage.tsx` | Consistent padding |
| `src/pages/DutyPage.tsx` | Consistent padding |
| `src/pages/AdminPage.tsx` | Consistent padding |
| `src/pages/WarehousePage.tsx` | Flatten header |
| `src/pages/ChangeLogPage.tsx` | Remove double MainLayout |
| `src/components/Dashboard/WelcomeHeader.tsx` | Flatten header |
| `src/components/Dashboard/MetricCard.tsx` | Remove heavy effects |
| `src/components/Dashboard/InteractiveMetricCard.tsx` | Remove heavy effects |
| `src/components/Dashboard/QuickAccessGrid.tsx` | Remove lift/scale |
| `src/components/Planner/DaySection.tsx` | Card wrapper, refined publish btn |
| `src/components/Planner/AssignmentCard.tsx` | Subtle hover, remove pulse |
| `src/components/Planner/CompactDaySection.tsx` | Soften header |
| `src/components/Planner/CompactAssignmentRow.tsx` | Smooth transitions |
| `src/components/Planner/AssignmentStatusBadge.tsx` | Refined pill style |

### Technical notes
- All changes are CSS/Tailwind class modifications only — no logic changes
- Strictly uses existing semantic CSS variables
- No new dependencies
- I will implement this in batches: base components first, then pages, then specific components

