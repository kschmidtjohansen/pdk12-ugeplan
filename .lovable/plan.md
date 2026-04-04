

## Plan: Kompakt, Professionelt Dashboard-design

### Overblik
Transformerer designet fra det nuvarende "Bento Box" (rounded-3xl, store skygger, stor padding) til et stramt, datatæt dashboard med subtile borders, kompakt spacing og kirurgisk brug af blå brand-farve.

### Design Tokens (ny stil)

```text
Page background:     bg-[#f8fafc] (light) / bg-slate-950 (dark)
Card background:     bg-white / dark:bg-slate-900
Card corners:        rounded-xl (ned fra rounded-3xl)
Card shadow:         NONE (fjernet)
Card border:         border border-slate-200/60 dark:border-slate-700/60
Card padding:        p-4 (ned fra p-6)
Card gap:            gap-4 (ned fra gap-6)
Hover (kort/rækker): hover:bg-blue-50/50 dark:hover:bg-slate-800/50
Button hover:        hover:-translate-y-0.5 hover:shadow-sm (reduceret)
Today accent:        border-t-2 border-t-primary
Status indicator:    border-l-2 (vertikal stribe på assignment cards)
Secondary text:      text-xs / text-[13px]
Headers:             font-semibold tracking-tight
```

### Filer der ændres

| Fil | Hvad ændres |
|-----|------------|
| **`src/index.css`** | Opdater `--background` til `#f8fafc` equivalent. Tilføj `.glass-card` utility class med `backdrop-blur-sm bg-white/80`. |
| **`src/components/ui/card.tsx`** | `rounded-3xl` → `rounded-xl`. Fjern `shadow-[0_8px_30px...]`. Tilføj `border border-slate-200/60`. Reducer CardHeader padding `p-6 pb-4` → `p-4 pb-2`. Reducer CardContent `p-6 pt-0` → `p-4 pt-0`. Reducer CardFooter `p-6 pt-0` → `p-4 pt-0`. Reducer CardTitle `text-xl` → `text-base`. |
| **`src/components/ui/button.tsx`** | Fjern `shadow-md`, `shadow-lg` fra varianter. Reducer hover-skygge fra `hover:shadow-lg` → `hover:shadow-sm`. Reducer `rounded-xl` → `rounded-lg`. Reducer default size `h-11 px-6` → `h-9 px-4`. |
| **`src/components/Layout/MainLayout.tsx`** | Ændr `bg-slate-50` → `bg-[#f8fafc]`. |
| **`src/components/Layout/TopNavbar.tsx`** | Reducer navbar height `h-20` → `h-14`. Tilføj `border-b border-slate-200/60`. Fjern `shadow-soft`. |
| **`src/pages/DashboardPage.tsx`** | `bg-slate-50` → `bg-[#f8fafc]`. `space-y-8` → `space-y-5`. `py-6` → `py-4`. |
| **`src/pages/PlannerPage.tsx`** | `bg-slate-50` → `bg-[#f8fafc]`. `space-y-8` → `space-y-4`. `py-6` → `py-4`. Reducer header fra `rounded-3xl p-6 lg:p-8` → `rounded-xl p-4 lg:p-5`. |
| **`src/components/Dashboard/WelcomeHeader.tsx`** | `rounded-3xl p-6` → `rounded-xl p-4`. Reducer ikon-box `w-12 h-12 rounded-2xl` → `w-10 h-10 rounded-xl`. Reducer titel `text-3xl` → `text-2xl`. Reducer quote `text-lg` → `text-sm`. |
| **`src/components/Dashboard/MetricCard.tsx`** | Fjern `rounded-3xl shadow-[...]`. Tilføj `rounded-xl border border-slate-200/60`. Reducer ikon-box `p-3 rounded-2xl border-2` → `p-2 rounded-lg border`. Reducer value `text-3xl` → `text-2xl`. Tilføj `hover:bg-blue-50/50` effekt. |
| **`src/components/Dashboard/QuickAccessGrid.tsx`** | `rounded-3xl shadow-[...]` → `rounded-xl border border-slate-200/60`. `gap-6` → `gap-4`. `hover:-translate-y-1 hover:shadow-[...]` → `hover:bg-blue-50/50 hover:border-primary/30`. Reducer ikon-box `p-3 rounded-2xl` → `p-2 rounded-lg`. |
| **`src/components/Planner/DaySection.tsx`** | `rounded-3xl shadow-[...] p-6` → `rounded-xl border border-slate-200/60 p-4`. Tilføj `border-t-2 border-t-primary` for dagens dato. Reducer chevron og tekst-størrelser. `gap-4` → `gap-3`. Reducer empty state `py-8 rounded-2xl` → `py-4 rounded-lg`. |
| **`src/components/Planner/AssignmentCard.tsx`** | Tilføj vertikal farve-stribe `border-l-2` (grøn=published, gul=draft). Reducer `p-4` → `p-3`. Reducer titel `text-lg` → `text-sm font-medium`. Tilføj `hover:bg-blue-50/50`. |
| **`src/components/Planner/CompactDaySection.tsx`** | `rounded-lg border shadow-sm` → `rounded-xl border border-slate-200/60`. Reducer header padding. |
| **`src/components/Planner/CompactAssignmentRow.tsx`** | Tilføj `hover:bg-blue-50/50` (erstatter `hover:bg-muted/50`). Tilføj vertikal `border-l-2` farvekode. |
| **`src/components/Planner/PlannerContent.tsx`** | `space-y-6` → `space-y-4`. `gap-4` → `gap-3`. |
| **`src/components/ui/status-badge.tsx`** | Gør badges mere kompakte: tilføj `text-xs px-1.5 py-0.5 rounded`. |
| **`CHANGELOG.md`** | Dokumenter redesign. |

### Nøgledesign-detaljer

**Vertikal farvekode-stribe (Assignment Cards)**:
- Published: `border-l-2 border-l-green-500`
- Draft/unpublished: `border-l-2 border-l-amber-400`
- Erstatter farvet baggrund — renere og mere professionelt

**"I dag"-markering (DaySection)**:
- Blå top-border: `border-t-2 border-t-primary`
- Kun på den dag der matcher `new Date()`

**Hover-effekt**:
- Kort og rækker: `hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors`
- Ingen translate/lift, kun farve-skift

**Glass-effekt** (CSS utility):
```css
.glass-card {
  @apply bg-white/80 backdrop-blur-sm border border-slate-200/60;
}
```

### Scope
~16 filer, udelukkende CSS/className-ændringer. Ingen logik, data eller oversættelsesændringer.

