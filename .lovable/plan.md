

## Plan: Opdater README.md og CHANGELOG.md

### CHANGELOG.md

Tilfoej tre nye sektioner under `[Unreleased]` med dato 2026-02-12, placeret oeverst (foer de eksisterende entries):

**### Added - 2026-02-12**
- Global ErrorBoundary med brugervenlig fejlside (dansk/engelsk) - forhindrer hvid skaerm ved uhaandterede fejl
- Page-level DataFetchErrorBoundary paa alle 9 hovedsider (Dashboard, Planner, Employees, Cars, Vacation, Duty, Warehouse, ChangeLog, Admin)
- Global MutationCache error handler i QueryClient til automatisk fejlhaandtering af mutations
- Optimistic UI opdateringer for bil-handlinger (toggle tilgaengelighed, sletning) med automatisk rollback
- Optimistic UI opdateringer for lager-handlinger (opret, opdater, slet) med automatisk rollback
- TanStack Query (React Query) caching paa alle 5 hoved-data-hooks (biler, medarbejdere, vagter, lager, ferie)
- Cache invalidation via `queryClient.invalidateQueries` i 9 action/mutation hooks

**### Changed - 2026-02-12**
- Data-fetching konverteret fra manuelt useState/useEffect til useQuery med 5 minutters staleTime
- Realtime-subscriptions kalder nu invalidateQueries i stedet for manuelle fetch-funktioner
- Optimistic UI bruger queryClient.setQueryData som kompatibilitetslag

**### Fixed - 2026-02-12**
- Generisk ErrorBoundary default fallback fikseret - viste foer children igen (uendelig loop-risiko)

### README.md

Tilfoej tre nye punkter til funktionslisten (baade dansk og engelsk sektion):

**Dansk (linje 22-38)** - tilfoej:
- `⚡ **Optimistic UI** med automatisk rollback ved fejl`
- `🛡️ **Robust fejlhaandtering** med Error Boundaries paa alle sider`
- `💾 **Intelligent caching** med TanStack Query og 5-minutters staleTime`

**Engelsk (linje ~170-185)** - tilfoej:
- `⚡ **Optimistic UI** with automatic rollback on failure`
- `🛡️ **Robust Error Handling** with Error Boundaries on all pages`
- `💾 **Intelligent Caching** with TanStack Query and 5-minute staleTime`

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `CHANGELOG.md` | Tilfoej 3 nye sektioner under Unreleased |
| `README.md` | Tilfoej 3 nye feature-punkter i baade dansk og engelsk sektion |

