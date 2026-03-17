

## Plan: Global Mobile-First UI Overhaul

A cohesive visual refinement across 27 files to create a welcoming, mobile-optimized HR portal feel while strictly preserving the existing color palette.

---

### Phase 1: Base UI Components (6 files)

**card.tsx** — Simplify Card base class:
- `rounded-2xl` -> `rounded-xl`
- Remove `before:` gradient overlay line
- Remove `backdrop-blur-sm`, `bg-card/80` -> `bg-card`
- `shadow-lg` -> `shadow-sm`
- `border-border/50` -> `border-border/40`
- CardHeader/Content/Footer: `p-8` -> `p-6`, `pb-6` -> `pb-4`

**badge.tsx** — Remove `hover:scale-105` from base cva. Change `font-semibold` to `font-medium`.

**button.tsx** — Remove all `hover:scale-[1.02] active:scale-[0.98]` from every variant. `shadow-md` -> `shadow-sm`. Base `rounded-xl` -> `rounded-lg`. Outline: `border-2` -> `border`, remove `backdrop-blur-sm`. Default size: add `min-h-[44px]`. Tone down gradient/glass variants.

**input.tsx** — `border-2` -> `border`, `rounded-xl` -> `rounded-lg`. Remove `backdrop-blur-sm`, `shadow-sm hover:shadow-md focus:shadow-lg`. Add `text-base` for iOS zoom prevention. Simplify to `h-11 rounded-lg border border-input bg-background px-3 text-base transition-colors duration-200`.

**dialog.tsx** — Overlay: `bg-black/60` -> `bg-background/80 backdrop-blur-sm`. Content: remove `before:` gradient overlay, `border-2` -> `border`, `p-8` -> `p-6`, `rounded-2xl` -> `rounded-xl`. Close button already 44px.

**status-badge.tsx** — Add subtle borders to each variant: `border border-green-200/50` for success, `border border-yellow-200/50` for warning, etc.

---

### Phase 2: Layout (3 files)

**MainLayout.tsx** (line 104) — `bg-gradient-to-br from-muted/20 via-background to-muted/30` -> `bg-background`. `pt-20` -> `pt-16`.

**TopNavbar.tsx** (line 135) — `h-20` -> `h-14 sm:h-16`. Mobile menu button (line 153-162): add `min-h-[44px] min-w-[44px]`.

**PageHeader.tsx** — `rounded-2xl` -> `rounded-xl`, `border-border/50` -> `border-border/40`, `shadow-md` -> `shadow-sm`.

---

### Phase 3: Page Headers — Flatten gradient heroes (10 files)

All pages with gradient hero banners get the same clean pattern:
```
bg-card rounded-xl border border-border/40 shadow-sm p-4 sm:p-6
```
Title: `text-xl sm:text-2xl font-semibold text-foreground`
Icon badge: `p-2 rounded-lg bg-primary/10 text-primary`
Remove all decorative blur circles and absolute-positioned gradients.

**PlannerPage.tsx** (lines 398-472) — Replace gradient hero. Week nav buttons: standard outline style. Action buttons: standard primary/outline (not white-on-primary).

**CarsPage.tsx** (lines 53-87) — Replace gradient hero. Buttons become standard.

**VacationPage.tsx** (lines 13-36) — Replace gradient hero.

**WelcomeHeader.tsx** (lines 33-71) — Replace gradient hero with card. Date widget becomes inline `bg-muted/50 rounded-lg border border-border/40 p-3`.

**WarehousePage.tsx** (lines 84-96) — Replace gradient banner with card header.

**DashboardPage.tsx** (line 45) — `bg-gradient-to-br from-gray-25 via-background to-gray-50` -> `bg-background`. Padding: keep as-is (already good).

**EmployeesPage.tsx** (line 100) — Already clean. Ensure padding `px-3 sm:px-4 lg:px-8`.

**DutyPage.tsx** (line 116) — Already clean. Standardize padding `px-3 sm:px-4 lg:px-8`.

**AdminPage.tsx** (line 60) — Already clean. Standardize padding `px-3 sm:px-4 lg:px-8`.

**ChangeLogPage.tsx** — Remove double `<MainLayout>` wrapping (lines 150, 249) since routing already wraps it.

---

### Phase 4: Planner Components (5 files)

**DaySection.tsx** — Wrap in card container: `border border-border/40 rounded-xl bg-card p-4`. Publish button: `bg-green-50 text-green-700 border border-green-200 hover:bg-green-100` instead of solid `bg-green-600`. Use single chevron icon with `transition-transform duration-200`.

**AssignmentCard.tsx** (line 137) — Remove `hover:shadow-xl`; use `hover:border-border/80 hover:shadow-md transition-all duration-200`. Warehouse indicator (line 144): remove `animate-pulse`, use static badge `bg-amber-50 text-amber-700 border border-amber-200 rounded-lg`.

**CompactDaySection.tsx** (line 60) — Header: `bg-primary/5` -> `bg-muted/30`. Publish button already refined.

**CompactAssignmentRow.tsx** (line 71) — Add `transition-colors duration-200` to row. Action buttons: `opacity-0 group-hover:opacity-100 transition-opacity duration-150`.

**AssignmentStatusBadge.tsx** — Already delegates to StatusBadge; no change needed (status-badge.tsx handles it).

---

### Phase 5: Dashboard Components (3 files)

**MetricCard.tsx** — Remove `shadow-lg hover:shadow-2xl` -> `shadow-sm hover:shadow-md`. Remove `hover:scale-[1.02]`. Remove `hover:scale-110` from icon container. Remove inner gradient overlay div. Remove `border-2` -> keep `border`. Remove `bg-gradient-to-br from-card to-card/50` -> just inherit card base.

**InteractiveMetricCard.tsx** — Same: `shadow-md hover:shadow-lg` -> `shadow-sm hover:shadow-md`. Remove `active:scale-[0.98]`. Remove `hover:scale-105` from icon. Remove `border-2` -> `border`. Remove inner gradient overlay.

**QuickAccessGrid.tsx** (line 72) — Remove `hover:-translate-y-1`, `hover:shadow-lg hover:shadow-primary/10`. Use `hover:border-border/80 hover:shadow-md transition-all duration-200`. `border-2` -> `border`.

---

### Phase 6: Global CSS (1 file)

**index.css** — In `fadeInUp` keyframe: `translateY(30px)` -> `translateY(10px)`. Add `.card-interactive` utility class. Remove `.modern-card` `backdrop-blur-sm`. Tone down `.page-container` gradient to just `bg-background`.

---

### Summary

- **27 files** modified
- CSS/Tailwind class changes only — zero logic changes
- Strictly uses existing semantic CSS variables
- No new dependencies
- No DB migration needed

