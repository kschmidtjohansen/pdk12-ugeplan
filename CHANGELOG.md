# Changelog

## 2026-04-28 — UI-overhaul fase 2: Planner + dokumentation

Fortsætter Apple/Arc-overhaul fra fase 1. Funktionalitet uændret. Ingen DB-ændringer.

### Ændret
- **PlannerPage** (`src/pages/PlannerPage.tsx`): Erstattet primary-gradient header med blur-orbs af clean layout — `bg-primary/10`-ikon, neutral titel, segmenteret week-navigator (`rounded-lg border border-border bg-card`). Fjernet `bg-[#f8fafc]`, `animate-fade-in-up`, `backdrop-blur-sm`, hvide overlay-pile. View-toggle bruger nu `data-[state=on]:shadow-xs`. Loading/error-tilstande standardiseret til `bg-background` og `text-destructive`.
- **AssignmentCard** (`src/components/Planner/AssignmentCard.tsx`): Fjernet `hover:bg-blue-50/50` (nu `hover:bg-accent/40`), `animate-pulse hover:animate-none` på lager-pill, `text-blue-600` på responsible-icon (nu `text-primary`), `text-yellow-600` på debug (nu `text-amber-600`). Status-stripe er nu `border-l-emerald-500` / `border-l-amber-400`.
- **AssignmentDetails** (`src/components/Planner/AssignmentDetails.tsx`): Erstattet farvede icon-pills (`bg-green-50/border-green-200`, `bg-blue-50`, `bg-purple-50`) med ensartet `bg-muted text-muted-foreground`. Tabular-nums på tider, `font-normal` på badges, dark-mode varianter på "delt bil"-advarsel.
- **AssignmentDetailsDialog** (`src/components/Dashboard/AssignmentDetailsDialog.tsx`): Header bruger `bg-card` (var `bg-gradient-to-b from-muted/30`). Detaljerækker er nu `rounded-lg border border-border bg-muted/40` med neutrale `text-muted-foreground` ikoner i stedet for `text-primary`. Messages-sidebar bruger `bg-muted/20` (var `bg-gradient-to-b`).
- **EmployeesPage** (`src/pages/EmployeesPage.tsx`): Konverteret fra inline `text-2xl font-bold`-titel til `<PageHeader>` for konsistens med Cars/Vacation/Warehouse. Tabel-container bruger nu `rounded-xl border border-border shadow-xs`.
- **Dokumentation** (`docs/ui-guidelines/design-system.md`): Komplet revision. Tilføjet sektioner for designprincipper, token-tabeller (radius/shadows/farver), standardmønstre per komponent-type, anti-patterns og reference-implementationer. Erstatter den tidligere version.

### Verificeret
- Dark mode: Header, kort, dialog og toolbar har korrekt kontrast.
- Funktionalitet: Week-navigation, view-toggle, expand-all, dialogs uændrede.
- Fase 1-konsistens: Cars/Vacation/Warehouse/Employees bruger nu identisk side-layout (`PageHeader` + `rounded-xl border border-border bg-card shadow-xs`).

---

## 2026-04-28 — Globalt UI-overhaul (fase 1: foundation + base + dashboard)

Stort visuelt overhaul mod et roligt, premium "Apple/Arc"-look. Funktionalitet uændret. Brand-farver og logo bevaret.

### Ændret
- **Design tokens** (`src/index.css`, `tailwind.config.ts`): Ny radius-skala (10px), kalibrerede shadow-tokens (xs/sm/md/lg/xl), strammere typografi-skala, polerede dark-mode-farver. Fjernet `gradient-primary`, `glass-effect`, `text-gradient`, `hover-lift`, `hover-glow`, `interactive-scale`, `pulse-glow`, `shimmer`, `bounce-gentle`, `float`, `glow`-skygger og `modern-*`-utilities.
- **Base UI**: `Button`, `Input`, `Card`, `Dialog`, `Badge` — fjernet hover-translateY, before-shimmer, store skygger, tunge borders, backdrop-blur på inputs. Konsistent rolig fokus-ring, neutrale hover-tilstande.
- **Layout**: `MainLayout`, `TopNavbar`, `PageHeader`, `RouteLoadingFallback` — fjernet gradient-baggrunde og glassmorphism. PageHeader er nu en flad titel + Separator.
- **Dashboard**: `WelcomeHeader`, `QuickAccessGrid`, `MetricCard`, `InteractiveMetricCard`, `DutySummaryWidget`, `WeeklyAssignments` — fjernet primary-gradient headere, blur-orbs, farverige ikon-bokse, `border-l-4`-accenter erstattet af tynd 3px-stribe via `::before`.
- **Sider**: `LoginPage`, `Index`, `CarsPage`, `VacationPage`, `WarehousePage`, `DashboardPage` — fjernet gradient-baggrunde og store glassy headers; standardiseret til `bg-background` + `PageHeader`.

### Bevaret
- Primær brand-farve `#00aeef`, Polygon-logo, dansk terminologi, semantiske farve-tokens, høj informationstæthed (`p-4 gap-4`, `rounded-xl`), sticky dialog header/footer, multi-tenant logik.

### Næste fase (planlagt)
- PlannerPage, ScreenDisplayPage, AssignmentCard, CompactAssignmentRow, UnassignedResourcesSection, DutyWeekWidget, AssignmentDetailsDialog, EmployeesPage, DutyPage, AdminPage — samme behandling.
- Dark-mode QA-pass på alle opdaterede komponenter.
- Opdater `docs/ui-guidelines/design-system.md`.

## 2026-04-28 — UX-fixes + UI overhaul fase 3

### UX
- **Login**: Personlig hilsen "Velkommen tilbage, {fornavn}" baseret på cachet `last_user_name` i localStorage (gemmes i `AuthContext` efter vellykket profil-fetch).
- **Password-felt**: Native browser-øje skjult via CSS (`::-ms-reveal`, `::-webkit-credentials-auto-fill-button`) — kun appens egen toggle vises nu. Påvirker både login, password reset og `PasswordInput`.
- **Series-prompt**: `PlannerPage` viser kun `SeriesActionDialog` ved redigering/sletning hvis `findSeriesSiblings(...).length > 1`. En enlig sag (fx 12-013700) går direkte til normal edit/delete uden prompt.
- **Selectors**: `CarSelector` udvidet fra `w-80` → `w-[420px]`, `EmployeeSelector` fra `w-96` → `w-[480px]` (med `max-w-[calc(100vw-2rem)]` for små skærme).

### Auto-refresh
- Ny helper `src/lib/realtimeUtils.ts` (`notifyOwnAction`) som dispatcher `supabase-own-action`-event.
- `MainLayout` invaliderer React Query-caches ved hver route-ændring (assignments, employees, cars, vacations, duties) og dispatcher own-action samtidig — fjerner unødvendige "Opdater"-bannere ved navigation.
- `notifyOwnAction()` tilføjet ved start af alle mutationer i: `useOptimizedAssignments` (create/update/updateSeries/delete/deleteByGroup/detach/publish/publishByDate), `useEmployeeActions` (create/update/delete/toggleLeave), `useCarActions` (confirmDelete/updateAvailabilityStatus), `useVacationActions` (submit/delete/approve/reject), `useDutyActions` (assign/update/reassign/swap/swapDuties).

### UI overhaul (fase 3)
- `MainLayout`: fjernet `animate-fade-in-up` wrapper ved hver navigation.
- `TopNavbar`: fjernet `bg-background/85 backdrop-blur-md` → flat `bg-background`.
- `Dialog overlay`: fjernet `backdrop-blur-[2px]`.
- `Toast`: fuld redesign — fjernet `rounded-2xl`, `border-2`, `bg-background/95 backdrop-blur-xl`, `shadow-2xl`, `hover:scale-[1.02]`, `before:` gradient. Nu: `rounded-xl border border-border bg-card shadow-md p-4`.
- `Table` ui-primitiv: standardiseret `TableHeader` (`bg-muted/40`), `TableHead` (`h-10 text-xs uppercase tracking-wide`) og `TableRow` (`hover:bg-accent/40`) — ramler igennem i Cars, Employees, Vacation, Duty.
- Fjernet alle `bg-gradient-to-br from-gray-*` og lignende lovable-rester fra: `Index.tsx`, `App.tsx`, `GlobalErrorBoundary`, `DashboardErrorBoundary`, `ScreenDisplayErrorBoundary`, `ScreenDisplayPage` (3x), `FalckSubscriptionButton`, `AssignmentForm`, `UnassignedResourcesSection`, `DutyWeekWidget`, `ScreenDisplayHeader`, `ScreenDisplayContent`.
- `EnhancedSecureLoginForm`: ryddet `Card`-overrides (`shadow-lg rounded-xl border-border/50`).
- `Button`: fjernet legacy `gradient` og `glass`-aliaser.

### Tokens
- `index.css`: tilføjet globale CSS-regler der skjuler native browser password-reveal-knapper, så kun appens egen øje-toggle vises.
