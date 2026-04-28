
# Fase 3 — Strukturelt + visuelt overhaul

Baseret på dine svar: **markant blå overalt**, **to-kolonne arbejdsbord-dashboard**, **tabel + inline filter/segmenter** på listesider. For layout (du sprang over) foreslår jeg **hybrid: smal ikon-sidebar venstre + tynd topbar** — dette frigør den horisontale plads og gør hele appen markant anderledes uden at skjule navigation. Sig til hvis du hellere vil have en bred sidebar eller beholde topbaren.

## 1. Ny app-shell (hybrid sidebar + topbar)

- Tilføj `SidebarProvider` i `App.tsx` / `MainLayout.tsx`.
- Bygger ny `AppSidebar` (`collapsible="icon"`, default 56px bred):
  - Logo øverst (kun ikon-mærket fra polygon-logoet).
  - Nav-items: Dashboard, Ugeplan, Medarbejdere, Biler, Fridage, Vagt, Lager, Admin (filtreret efter rolle/feature-toggles præcis som i dag).
  - Aktiv item: solid `bg-primary` baggrund, hvid ikon, tynd hvid stribe i venstre kant.
  - Hover: `bg-primary/10` + primary-tonet ikon.
  - Notifikations-badge på fridage (samme logik som nu).
  - Bunden: kollaps-knap + tema-toggle.
- Ny `TopBar` (44px høj, sticky):
  - Venstre: `SidebarTrigger` + sidens titel (auto fra route).
  - Midten: global søgning (kommandopalette-knap, Ctrl/Cmd+K-stil — fungerer foreløbig som placeholder med sidens egen søgning).
  - Højre: afdelingsvælger (chip-stil, blå outline når åben), notifikationer, ChangeLog, brugermenu.
- Mobil: sidebar bliver offcanvas-drawer; topbar viser hamburger.

## 2. Markant blå signatur (uden at blive "for meget")

Tilføjes i `index.css` og som genbrugelige utility-klasser:

- **Sidebar**: solid hvid baggrund i light, men aktive items + logo-bagside i `--primary`.
- **Topbar**: tynd 1px `bg-primary/15` accent-stribe under topbaren (let "varemærke"-streg).
- **Card-headers** på dashboard: `bg-gradient-to-b from-primary/5 to-transparent` + 1px `border-primary/10` top.
- **Sektion-titler** (h2 i widget-cards): lille blå prik (`bg-primary`) + label, à la Linear.
- **Stat-tal** (DashboardMetrics): primære tal i `text-primary` med tabular-nums, label i muted.
- **Aktive tabs / segmenter**: `bg-primary text-primary-foreground` + subtil `shadow-sm`.
- **Valgte rækker** i tabeller: `bg-primary/5` baggrund + 2px venstre `border-primary`.
- **Badges/chips** for status: nye blå-tintede varianter (`info`-token bruges allerede; udvides).
- **Focus-ringe**: allerede primary, polishes til 2px med 2px offset.
- **Knapper**: primary-knap får subtil indre highlight (`shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]`) for premium dybde.
- Dark mode: blå justeres til `197 100% 55%` på aktive flader, tints sænkes til `/8`–`/12` så det ikke gløder.

## 3. Dashboard — to-kolonne arbejdsbord

Erstatter den nuværende lange en-spaltes liste med et cockpit-layout (kun for admin/skadeleder; servicemedarbejder beholder sin specialiserede visning):

```text
+--------------------------------------+--------------------+
| WelcomeHeader (full-bredde)                               |
+--------------------------------------+--------------------+
| VENSTRE KOLONNE (lg:col-span-2)      | HØJRE KOLONNE      |
|                                      |                    |
|  • DagensOverblik (NY)               |  • KPI-stack       |
|    - 4 hurtige tal + dato/uge        |    (kompakt liste, |
|                                      |     ikke 5 kort)   |
|  • UgensOpgaver (WeeklyAssignments)  |                    |
|    fylder mest, blå header           |  • DutySummary     |
|                                      |                    |
|  • MineOpgaver                       |  • UpcomingVacation|
|                                      |                    |
|                                      |  • QuickAccess     |
|                                      |    (vertikal liste,|
|                                      |     ikke grid)     |
+--------------------------------------+--------------------+
```

- Grid: `grid grid-cols-1 lg:grid-cols-3 gap-4`.
- KPI-kortene konsolideres fra et 5-kolonne grid til en kompakt vertikal stak i højre kolonne (titel + stort blåt tal + delta), så fokus flyttes til opgaver.
- Sticky-opførsel: højre kolonne er `lg:sticky lg:top-16` så KPI'er altid er synlige mens man scroller venstre kolonne.
- WelcomeHeader får venstre 4px blå `border-l` + dato-blokken får blå tint.

## 4. Listesider — segmenteret filterbar (Medarbejdere, Biler, Fridage, Vagt, Lager)

Ny genbrugelig `ListPageShell`-komponent med konsistent struktur:

```text
+----------------------------------------------------------+
| PageHeader (titel + primær handling)                     |
+----------------------------------------------------------+
| FilterBar (sticky, hvid card med blå underkant)          |
|  [Segmenter: Alle (24) | Aktive (18) | Vikarer (4) | …]  |
|  [Søg ......]  [Filter ▾] [Sortér ▾]      [View: ▦ ☰]    |
+----------------------------------------------------------+
| Tabel (eller grid, view-toggle)                          |
|  - Sticky thead med blå-tintet baggrund (primary/5)      |
|  - Zebra-striping fjernet, i stedet 1px border-border    |
|  - Hover: bg-accent/40                                   |
|  - Valgt række: bg-primary/5 + venstre primary-stribe    |
+----------------------------------------------------------+
```

Specifikt per side:
- **Medarbejdere**: segmenter `Alle | Aktive | På fridage | Vikarer`. Tæller-badges i hver segment.
- **Biler**: segmenter `Alle | Tilgængelige | Optaget | Med note`. View-toggle: tabel ↔ kort-grid (2-col bil-kort med billede/badge).
- **Fridage**: segmenter `Afventer (X) | Godkendt | Afvist | Alle`. Afventer får rød pulse-prik når X>0.
- **Vagt**: segmenter for `Denne uge | Næste uge | Alle`.
- **Lager**: segmenter for kategori-filtre.

## 5. Ugeplan — let polish (struktur beholdes)

- Top-header få 4px blå venstre `border-l` + uge-navigatoren får aktive dage markeret med blå `border-b-2`.
- View-toggle (Standard/Kompakt/Grid) får primær fyldt aktiv-state.
- Day-sektioner: tilføj subtil blå venstre-stribe på "i dag".

## 6. Admin — beholder eksisterende tabs men opgraderet

Admin-sidens TabsList får ny styling: `bg-muted/40` container, aktive tabs fyldt blå, ikon + label.

## 7. Dark mode polish

- Sidebar: `bg-card` (lidt lysere end baggrund) for at hæve sig.
- Aktive items: `bg-primary` (lysere blå), ikke `bg-primary/20` så det stadig pop'er.
- Card-headers: `bg-primary/8` i stedet for gradient.
- Topbar bottom-stripe: `bg-primary/25`.

## 8. Berørte filer (estimeret)

**Nyt:**
- `src/components/Layout/AppSidebar.tsx`
- `src/components/Layout/AppTopBar.tsx`
- `src/components/Layout/AppShell.tsx` (wrapper med SidebarProvider)
- `src/components/shared/ListPageShell.tsx`
- `src/components/shared/SegmentedFilterBar.tsx`
- `src/components/Dashboard/DashboardCockpit.tsx` (2-kolonne grid)
- `src/components/Dashboard/CompactKpiStack.tsx` (vertikal KPI-liste)

**Modificeret:**
- `src/components/Layout/MainLayout.tsx` — bruger ny `AppShell`
- `src/components/Layout/TopNavbar.tsx` — udfases (logik flyttes til AppTopBar)
- `src/pages/DashboardPage.tsx` — bruger `DashboardCockpit`
- `src/pages/EmployeesPage.tsx`, `CarsPage.tsx`, `VacationPage.tsx`, `DutyPage.tsx`, `WarehousePage.tsx` — bruger `ListPageShell` + `SegmentedFilterBar`
- `src/pages/PlannerPage.tsx` — header polish
- `src/pages/AdminPage.tsx` — tabs styling
- `src/components/Dashboard/WelcomeHeader.tsx`, `DashboardMetrics.tsx`, `MetricCard.tsx`, `InteractiveMetricCard.tsx`, `WeeklyAssignments.tsx`, `QuickAccessGrid.tsx`
- `src/components/ui/table.tsx` — sticky thead, blå tint, valgt-række variant
- `src/components/ui/tabs.tsx` — segmenteret variant
- `src/components/ui/card.tsx` — `featured`-variant med blå header-tint
- `src/index.css` — nye utilities (`.brand-stripe`, `.kpi-number`, `.list-row-selected`)
- `tailwind.config.ts` — ekstra blå tints i palette
- `docs/ui-guidelines/design-system.md` + `CHANGELOG.md`

## 9. Bevares (rør ikke)

- Polygon-blå hex `#00aeef` og logo
- Multi-tenant query-isolation
- Alle hooks, business-logik, RLS, realtime-logik, dialog-scrolling-mønster, departments/feature-toggles
- Mobile drawer/popover-mønstre for selectors
- Permissions/role-baseret nav-filtrering

## 10. Rollout

1. Byg `AppSidebar` + `AppTopBar` + `AppShell`, koble på i MainLayout (ingen sider rørt endnu — verificér at navigation virker, dark mode virker, mobil offcanvas virker).
2. Byg `DashboardCockpit` + `CompactKpiStack`, opdater `DashboardPage`.
3. Byg `ListPageShell` + `SegmentedFilterBar`, refaktorér `EmployeesPage` som første eksempel.
4. Rul `ListPageShell` ud til Cars, Vacation, Duty, Warehouse.
5. Polish Planner, Admin.
6. Dark-mode QA på alle sider.
7. Opdater design-system docs + CHANGELOG.

Sig til når du er klar — eller giv feedback på sidebar-valget / farvemængden, så justerer jeg planen.
