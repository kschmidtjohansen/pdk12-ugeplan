# Plan: Web Vitals-målinger (LCP/INP/CLS)

## Mål
Måle Core Web Vitals på hele appen, logge til konsol i DEV og persistere til Supabase, så admin kan se aggregerede tal og pr.-route nedbrud (inkl. /planner).

## Komponenter

### 1. Library + reporter
- Tilføj `web-vitals` (~3 kB).
- Ny `src/utils/webVitals.ts` der via `onLCP`, `onINP`, `onCLS`, `onFCP`, `onTTFB` rapporterer hver metric.
- For hver måling:
  - DEV: `console.log('[WebVitals]', name, value, rating, route)`.
  - PROD + DEV: send til Supabase via batch (queue + flush ved `visibilitychange=hidden` med `navigator.sendBeacon`-lignende fetch fallback). Throttle: én insert pr. metric pr. side-load.
- Inkluder `route` (current pathname), `user_id` (hvis logget ind), `department_id`, `device_type` (mobile/tablet/desktop), `connection` (`navigator.connection?.effectiveType`), `user_agent`.

### 2. Bootstrapping
- Initialisér i `src/App.tsx` én gang efter mount. Reporteren læser route fra `window.location.pathname` på rapporteringstidspunktet (web-vitals fires sent i livscyklen).
- Ingen ekstra wrapping af `/planner` — global init dækker hele appen.

### 3. Database
Ny tabel `public.web_vitals_metrics`:
- `id uuid pk`, `created_at timestamptz default now()`
- `metric_name text` (LCP/INP/CLS/FCP/TTFB)
- `metric_value double precision`
- `rating text` (good/needs-improvement/poor)
- `route text`
- `user_id uuid` (nullable)
- `department_id uuid` (nullable)
- `device_type text`, `connection_type text`, `user_agent text`
- `session_id text` (genereret pr. tab via crypto.randomUUID i sessionStorage)

Indexes: `(route, metric_name, created_at desc)`, `(created_at desc)`.

RLS:
- `INSERT`: alle authenticated brugere må indsætte egne målinger (`user_id = auth.uid() OR user_id IS NULL`). Anonyme tilladt med `user_id IS NULL` for at fange auth-side målinger.
- `SELECT`: kun `is_admin_or_skadeleder()` (super_admin via eksisterende helper).
- Ingen UPDATE/DELETE-policy (immutable telemetri); admin sletning sker evt. via cron senere.

### 4. Admin-oversigt
Ny side `src/pages/AdminWebVitalsPage.tsx` (eller tab i eksisterende AdminPage):
- Filtre: route (dropdown m. distinkte routes), tidsperiode (24t / 7d / 30d), metric.
- KPI-kort pr. metric: p75 (Web Vitals-standard), median, antal samples, andel "good"/"needs-improvement"/"poor".
- Tabel: top 10 langsomste routes pr. metric.
- Sparkline pr. metric (simpel SVG eller `recharts` hvis allerede installeret — ellers ren tabel for at undgå ny dep).
- Adgang: kun synlig for `administrator` / `super_admin` via eksisterende route-guard i `AppSidebar` + page-level check.

### 5. Performance-overvejelser
- Reporter kører kun efter `requestIdleCallback` for ikke at konkurrere med initial render.
- Batch-insert: kø af målinger flushes ved page hide; én HTTP-call pr. session i typisk tilfælde.
- `is_demo`-bruger filtreres fra (returner tidligt i reporter) for at undgå støj.

## Filer
| Fil | Ændring |
|---|---|
| `package.json` / `bun.lock` | Tilføj `web-vitals` |
| `src/utils/webVitals.ts` | Ny — init + reporter + batch-flush |
| `src/App.tsx` | Init reporter én gang |
| `src/pages/AdminWebVitalsPage.tsx` | Ny admin-side med filtre/KPI'er |
| `src/App.tsx` (routes) | Route `/admin/web-vitals` med admin-guard |
| `src/components/Layout/AppSidebar.tsx` | Menupunkt synligt for admin |
| Supabase migration | Ny tabel + RLS + indexes |
| `CHANGELOG.md`, `docs/implementation-plan/tasks.md` | Opdater |

## Out of scope
- Real User Monitoring-dashboard udover de basale KPI'er.
- Alerting/regression-detection (kan tilføjes senere).
- Export til ekstern tjeneste (Datadog, GA4 etc.).
