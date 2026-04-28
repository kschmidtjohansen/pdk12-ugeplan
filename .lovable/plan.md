## Plan: Globalt UI-overhaul — "Apple/Arc" premium look

### Mål
Strippe det "lovable made"-look (gradients, glow, pulse, shimmer, hover-lift, tunge skygger) og erstatte med et roligt, premium, Apple/Arc-inspireret udtryk. **Behold:** primær blå (`#00aeef`), logo, semantiske farve-tokens, dansk terminologi, høj informationstæthed jf. core memory.

### Designprincipper (de nye regler)
- **Roligt og fladt-med-dybde:** Subtile borders (`border-border/60`) + ultra-lette skygger (`shadow-[0_1px_2px_rgba(0,0,0,0.04)]`). Ingen gradient-headers, ingen glow, ingen pulse.
- **Konsistent radius:** `--radius: 0.625rem` (10px). Kort `rounded-xl` (12px), inputs/knapper `rounded-lg` (10px), pills/badges `rounded-md` (8px). Ingen `rounded-2xl/3xl` undtagen modal-overlays.
- **Whitespace:** Stadig kompakt jf. memory (`p-4 gap-4`), men luftigere headere (`pb-3 mb-4` separator i stedet for tunge kort-headers).
- **Typografi:** Inter beholdes, men `tracking-tight` på h1/h2, normal tracking ellers. Drop `text-balance` globalt (kun på h1). Sideoverskrifter ned fra `text-3xl` til `text-xl font-semibold`.
- **Farvebrug:** Primær blå reserveres til CTA, aktive states og fokus. Ikke længere baggrunde for hele headers. Ikon-baggrunde bliver `bg-muted text-foreground` i stedet for farverige `bg-blue-50 text-blue-600`.
- **Bevægelse:** Kun `transition-colors` + `transition-opacity` (150ms). Fjern `hover:-translate-y-0.5`, `hover:scale`, `animate-fade-in-up` på sider, `animate-scale-in` på kort. Behold subtile tilstandsskift.
- **Skygger:** Ny skala — `shadow-xs` for hvilende kort, `shadow-sm` på popovers/dropdowns, `shadow-md` kun på dialogs. Fjern `shadow-xl/2xl/glow/glow-lg` fra UI (beholdes i tokens men bruges ikke).
- **Dark mode:** Polishes parallelt — baggrund `222 20% 7%`, kort `222 18% 10%`, borders med 6% lysere tone. Samme skala for skygger men reducerede.

### Hvad fjernes (komponent-for-komponent)
| Komponent | Fjernes / ændres |
|---|---|
| `WelcomeHeader` | Gradient-baggrund, blur-orbs, `bg-white/20 backdrop-blur` chips. Bliver flad card med dato højre, hilsen venstre, tynd border-bottom på primary-accent. |
| `QuickAccessGrid` | Farverige ikon-bokse (`bg-blue-50` etc.), `animate-scale-in`, `hover:bg-blue-50/50`. Bliver neutral ikon (foreground), `hover:bg-accent`, ingen lift. |
| `Button` | Fjern `hover:-translate-y-0.5`, `hover:shadow-sm`, `before:` shimmer, `gradient`+`glass` varianter. Ny default: rene farveskift + `active:opacity-90`. Bevarer alle størrelser. |
| `Input` | Fjern `border-2`, `h-12`, `bg-background/50 backdrop-blur`, `shadow-sm hover:shadow-md focus:shadow-lg`, `rounded-xl`. Ny: `h-9`, `border`, `rounded-lg`, fokus-ring kun. |
| `Card` | Fjern tung `shadow-md` default. Ny: `border bg-card shadow-xs rounded-xl`. |
| `Dialog` | Behold sticky header/footer (memory). Ændr radius til `rounded-xl`, skygge til `shadow-md`, custom scrollbar slankere. |
| `PageHeader` | Fjern `shadow-md`, `p-6`, `rounded-2xl`. Ny: ren tekst-blok + `Separator` under, ingen kort-wrapper. |
| `TopNavbar` | Tyndere (h-12 → h-12 behold), fjern evt. backdrop-blur tunghed, klar border-bottom. |
| `index.css` | Fjern `glass-card`, `glass-effect`, `gradient-primary/secondary/radial`, `text-gradient`, `hover-lift`, `hover-glow`, `interactive-scale`, `border-gradient`, `shimmer-effect`, `animate-pulse-glow`, `animate-shimmer`, `animate-float`, `animate-bounce-gentle`, `pulse-glow` keyframes. Behold `fade-in`, `accordion-*`, `scale-in` (til Radix), `slide-in-*`. |
| `tailwind.config.ts` | Fjern `boxShadow.glow`, `glow-lg`, `keyframes.pulse-glow`, `bounce-gentle`, `float`, `gradient`, `shimmer`. Justér radius-skala. |
| Dashboard-widgets (Metrics, MineOpgaver, WeeklyAssignments, Vehicle/Vacation/Duty Widgets) | Fjern hover-lift, tunge skygger, gradient-baggrunde i InteractiveMetricCard. Standardiser til `Card` med `shadow-xs`. |
| Planner (`AssignmentCard`, `DaySection`, `CompactDaySection`) | Slankere borders, ingen `hover:shadow-xl`, kun `hover:bg-accent/40` og `transition-colors`. |
| Tabeller (Cars, Warehouse, Employees, Duty) | Konsistent header-styling: `text-xs uppercase tracking-wide text-muted-foreground` + `bg-muted/40`. Rækker: `hover:bg-muted/40` (lavere intensitet). |
| Selectors (Employee/Car/Duty) | Allerede tæt på målbilledet — kun radius-justering og fjern evt. shadow på popover-content. |
| Login (`LoginPage`) | Fjern gradient-baggrund hvis nogen, brug roligt off-white kort på subtil tonet baggrund. Logo og copy beholdes (memory). |
| `LoadingSpinner`, `RouteLoadingFallback` | Roligere — fjern gradient-baggrunde i fallback. |

### Tokens (nye værdier i `:root`)
```text
--radius: 0.625rem            (var: 0.75rem)
--background: 0 0% 99%        (var: 210 40% 99%)
--foreground: 222 20% 14%     (mørkere, mere kontrast)
--card: 0 0% 100%
--border: 220 13% 91%         (uændret)
--muted: 220 14% 96%
--muted-foreground: 220 9% 46%
--primary: 197 100% 47%       (uændret — bevar brand)
--ring: 197 100% 47%          (uændret)
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.04)
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.06)
--shadow-md: 0 4px 12px -2px rgb(0 0 0 / 0.08)
```
Dark mode tilsvarende kalibreret (lysere borders, dybere baggrund).

### Implementeringsrækkefølge (alt i én PR)
1. **Tokens & globals** — `src/index.css` + `tailwind.config.ts`. Strip ubrugte utility-klasser/keyframes.
2. **Base UI** — `Button`, `Input`, `Card`, `Dialog`, `Badge`, `Tabs`, `Tooltip`, `Popover`, `DropdownMenu`, `Select`, `StatusBadge`, `Skeleton`. Sikre at API/props er uændret.
3. **Layout** — `MainLayout`, `TopNavbar`, `PageHeader`, `UserMenu`, `Logo` (uændret asset).
4. **Dashboard** — `WelcomeHeader`, `QuickAccessGrid`, `MetricCard`/`InteractiveMetricCard`, `DashboardMetrics`, `MineOpgaver`, `WeeklyAssignments`, alle widgets.
5. **Planner** — `PlannerContent`, `AssignmentCard`, `DaySection`/`CompactDaySection`, `AssignmentForm`, `AssignmentDetails`, selectors.
6. **Feature-sider** — Cars (List/Table/MobileCard), Warehouse, Employees, Vacation, Duty, Admin, ChangeLog, ScreenDisplay-header, Login.
7. **Dark-mode QA-pass** — gennemgå hver opdateret komponent i dark mode, justér tokens hvis kontrast svigter.
8. **CHANGELOG.md** — log overhaul som ét entry.

### Ikke-mål (dette overhaul gør IKKE)
- Ingen ændring af logik, datalag, hooks, RLS, routing.
- Ingen ny side, intet fjernet feature.
- Ingen ændring af dansk tekst eller terminologi.
- Ingen ændring af navigation-struktur (departement-selector forbliver i UserMenu).
- Logo (`Logo.tsx`) og brand-blå rører vi ikke.

### Risici & mitigation
- **Mange filer (~50–70):** Vi bruger semantiske tokens, så de fleste komponenter opdateres "automatisk" via `index.css` + base UI. Per-komponent ændringer reduceres til at fjerne hardcoded `bg-blue-50`, `hover:-translate-y-*`, `shadow-xl` etc.
- **Visuel regression:** Efter hver gruppe (Layout / Dashboard / Planner / Features) kan du give visuel feedback før vi går videre.
- **Brugere vænner sig:** Funktionel adfærd er identisk; kun udtryk ændres.

### Leverance
- Opdaterede tokens, ~10 base UI-komponenter, ~15 dashboard/planner-komponenter, ~20 feature-side-komponenter.
- Opdateret `docs/ui-guidelines/design-system.md` så det matcher nye tokens og regler.
- `CHANGELOG.md`-entry: "Globalt UI-overhaul: roligt premium-look, fjernet gradients/glow/lift, ny tokenskala. Ingen funktionel ændring."
