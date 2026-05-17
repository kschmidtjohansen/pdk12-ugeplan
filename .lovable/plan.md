## Mål
Erstat page-level loading spinners med `ListSkeleton` for et konsistent loading-udseende på tværs af appen. Knapper, micro-indikatorer (PullToRefresh, AddressAutocomplete, OfflineFallback, LastRefreshIndicator) og dialog/widget-loadere røres ikke. `LoadingSpinner`- og `Spinner`-komponenterne beholdes som filer.

## Ændringer

**Route/full-page loaders → `<ListSkeleton />`**
- `src/components/shared/RouteLoadingFallback.tsx` — central route-suspense fallback
- `src/App.tsx` (linje 132) — auth/init full-screen spinner
- `src/components/Layout/MainLayout.tsx` (linje 85 og 104) — layout-level boot spinners
- `src/pages/Index.tsx` (linje 100) — initial route guard
- `src/pages/AdminPage.tsx` (linje 44)
- `src/pages/DutyPage.tsx` (linje 167 og 194)
- `src/pages/PlannerPage.tsx` (linje 630) — fjerner også `Spinner`-import
- `src/pages/ScreenDisplayPage.tsx` (linje 222) — full-screen loader (bevarer evt. omkringliggende tekst hvor relevant, men selve spinneren erstattes)

`ListSkeleton` bruges direkte (default `rowCount`). Hvor spinneren ligger i en centreret full-screen wrapper, fjernes wrapper-paddingen så ListSkeleton fylder containeren naturligt.

**Ikke rørt (jf. afklaring)**
- `PasswordResetPage.tsx` — alle 3 spinners er inde i knapper / form-submit, ikke page-level
- Knap-loadere i button.tsx, dialog-loadere, dashboard-widget loadere (MineOpgaver, ServicemedarbejderDashboard), Notifications/GlobalAssignmentSearch
- PullToRefresh, AddressAutocomplete, OfflineFallback, LastRefreshIndicator, EmployeeLoadingError
- `LoadingSpinner.tsx` og `ui/spinner.tsx` filer beholdes

## Dokumentation
- `CHANGELOG.md`: ny entry "UI: erstattet page-level spinners med ListSkeleton for konsistent loading state".
- `/docs/implementation-plan/tasks.md`: markér relateret opgave `[x]` hvis den findes.