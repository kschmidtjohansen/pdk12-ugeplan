

## Plan: Bento Box / Spatial UI Redesign

### Overview
Update the global design system to a clean, spacious "Bento Box" layout while preserving the existing blue brand color (`--primary: 197 100% 47%`, polygon blue `#00aeef`). Changes are concentrated in 4 foundational files — most component-level styling inherits automatically.

### Changes

| File | What changes |
|------|-------------|
| **`src/index.css`** | Update `:root` background to `slate-50` equivalent (`210 40% 98%`). Update `.page-container` to use `bg-slate-50`. Update `.modern-card` class to use borderless bento style. |
| **`src/components/ui/card.tsx`** | Replace current Card classes: remove `border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg` and the `before:` gradient pseudo-element. New: `bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0`. Dark mode: `dark:bg-slate-900`. Increase CardHeader/CardContent/CardFooter padding from `p-8` to match bento spacing (`p-6`). |
| **`src/components/ui/button.tsx`** | Add `hover:-translate-y-0.5 hover:shadow-md` to the default variant (replacing `hover:scale-[1.02]`). Apply same lift pattern to all solid variants. Keep `active:scale-[0.98]`. |
| **`src/components/Layout/MainLayout.tsx`** | Change `<main>` background from `bg-gradient-to-br from-muted/20 via-background to-muted/30` to `bg-slate-50 dark:bg-slate-950`. |
| **`src/components/Dashboard/MetricCard.tsx`** | Remove `border-2 border-border/50 shadow-lg bg-gradient-to-br from-card to-card/50` and inner gradient overlay. New: `bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0`. Keep the `border-l-4` color accent. |
| **`src/components/Dashboard/QuickAccessGrid.tsx`** | Remove `border-2` from Card. Add `gap-6`. Apply bento hover: `hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]`. |
| **`src/components/Dashboard/WelcomeHeader.tsx`** | Keep gradient hero as-is (brand blue). No changes needed — already follows bento rounded-3xl pattern. |
| **`src/components/Planner/DaySection.tsx`** | Wrap each day in a bento container: `bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6`. Remove dashed border on empty state, use softer empty card. |
| **`src/components/Planner/AssignmentCard.tsx`** | The Card component update will cascade here. No direct changes needed. |
| **`src/pages/DashboardPage.tsx`** | Change page background from `bg-gradient-to-br from-gray-25 via-background to-gray-50` to `bg-slate-50 dark:bg-slate-950`. Increase `space-y-6` to `space-y-8` for more breathing room. |
| **`src/pages/PlannerPage.tsx`** | Same background change. Update `space-y-6` to `space-y-8`. |
| **`CHANGELOG.md`** | Document the redesign. |

### Design tokens summary

```text
Page background:     bg-slate-50 (light) / bg-slate-950 (dark)
Card background:     bg-white (light) / dark:bg-slate-900
Card corners:        rounded-3xl
Card shadow:         shadow-[0_8px_30px_rgb(0,0,0,0.04)]
Card border:         none (border-0)
Card padding:        p-6
Card gap:            gap-6
Headings:            text-slate-800 (via existing --foreground)
Secondary text:      text-slate-500 (via existing --muted-foreground)
Button hover:        hover:-translate-y-0.5 hover:shadow-md transition-all
Brand accent:        primary (blue #00aeef) — unchanged
```

### What stays the same
- Blue brand color on all buttons, icons, accents, hero headers
- Dark mode CSS variables (dark theme adjusts automatically)
- All component logic, data flow, translations
- WelcomeHeader hero gradient (already bento-compatible)
- TopNavbar styling

### Scope: ~10 files, purely CSS/className changes. No logic or data changes.

