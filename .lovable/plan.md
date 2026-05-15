## Status
Route-niveau lazy loading findes allerede i `src/App.tsx` (`lazyWithRetry` + `Suspense` for alle sider). Der er intet at gøre på route-niveau.

Brugeren vil i stedet have **bundle-analyse** for at finde tunge afhængigheder.

## Fund fra build

Production build **fejler** lige nu:
```
Could not resolve entry module "@radix-ui/react-accordion"
```
`vite.config.ts` `manualChunks` refererer til pakker der blev fjernet i tidligere dead-code-oprydning (`@radix-ui/react-accordion`, `recharts`). Det skal fixes før vi overhovedet kan analysere.

## Plan

### 1. Reparér `vite.config.ts` → ren build
- Fjern fra `ui-vendor`: `@radix-ui/react-accordion` (slettet).
- Fjern hele `charts-vendor` (`recharts` er afinstalleret).
- Tilføj de nye Radix-pakker som faktisk bruges (`alert-dialog`, `collapsible`, `context-menu`, `radio-group`, `slot`, `toggle`, `toggle-group`) til `ui-vendor`, så de ikke kopieres ind i hver page-chunk.

### 2. Generér og analysér bundle
- Kør `vite build` → `dist/stats.html` (rollup-plugin-visualizer er allerede konfigureret).
- Kør `du -sh dist/assets/*.js | sort -h` for top-størrelser.
- Identificér:
  - Største vendor-chunks (forventet: react-vendor, supabase-vendor, ui-vendor, data-vendor).
  - Største page-chunks (PlannerPage, DashboardPage, AdminPage).
  - Duplikerede pakker på tværs af page-chunks (kandidater til ekstra `manualChunks`).

### 3. Rapportér til brugeren
Levér en kort tabel: chunk-navn, gzip-størrelse, top-3 indhold. Så kan vi i et opfølgende step beslutte om der skal:
- Code-splittes flere sub-komponenter (f.eks. `AssignmentDialogManager`, dialogs i Admin).
- Flyttes flere libs til vendor-chunks.
- Fjernes/erstattes en tung lib.

**Ingen kodelogik-ændringer i denne runde** — kun config-fix + analyse + rapport. Ægte optimeringer kommer i opfølgende plan baseret på fund.

## Filer der ændres
- `vite.config.ts` — ryd op i `manualChunks`.
- `CHANGELOG.md` + `docs/implementation-plan/tasks.md` — log analyse-runden.

## Verifikation
- `bunx vite build` lykkes uden fejl.
- `dist/stats.html` genereres.
- Rapport leveres i chat.
