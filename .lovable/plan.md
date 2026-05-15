## Mål

Validere effekten af at have fjernet logging-policies (fx `secure_profile_access_unified`'s `log_security_event_safe`-kald) ved at:
1. Måle faktiske query-tider for planner-forespørgsler i Postgres
2. Måle log-vækst (rows pr. minut i `logs` / `logs_partitioned`)
3. Sammenligne med en baseline før/efter

Dette er en **engangs-analyse** (ikke en ny feature), så outputtet bliver en rapport i `/mnt/documents/` + en kort opdatering i `CHANGELOG.md` og `docs/technical-specs/`.

## Plan

### 1. Identificer planner-queries der skal benchmarkes
Centrale forespørgsler fra `src/hooks/useOptimizedAssignments.ts`, `useDutyData.ts`, `useVacationData.ts`:
- `assignments` SELECT m. RLS (`can_view_assignment_optimized` + `hide_demo_data_assignments`)
- `assignments_employees` SELECT
- `on_call_duties` SELECT
- `vacations` SELECT (`can_access_vacation`)
- `profiles` SELECT (tidligere log-tung policy `secure_profile_access_unified`)
- `cars` SELECT

### 2. Mål query-tid via `EXPLAIN (ANALYZE, BUFFERS)` 
Kør hver query som en typisk autentificeret bruger via `supabase--read_query` med `SET LOCAL role authenticated; SET LOCAL request.jwt.claims = '{...}';` for at simulere RLS-kontekst. Kør 5 iterationer pr. query og rapportér min/median/p95.

Måleparametre:
- Planning time
- Execution time
- Buffers (shared hit/read)
- RLS-policy-evaluering (synlig i plan-noder)

### 3. Mål log-bloat
Tæl rows i `logs` og `logs_partitioned` for de seneste tidsvinduer:
- Sidste 10 min, 1 time, 24 timer
- Filtrér på `event_type` der tidligere stammede fra RLS (`admin_profile_access` mv.)
- Beregn rows/min før (historiske data) vs nu

### 4. Generér rapport
Skriv `/mnt/documents/rls-performance-report.md` med:
- Tabel: query, p50/p95 ms, buffers
- Tabel: log-vækst pr. event_type før/efter
- Konklusion + anbefalinger (fx om flere policies bør strippes for logging, eller om indeks mangler)

### 5. Dokumentation
- Tilføj entry i `CHANGELOG.md` (2026-05-15 — RLS performance benchmark)
- Opdatér `docs/implementation-plan/tasks.md` hvis der findes en relevant opgave
- Hvis rapporten viser yderligere fund (manglende indeks, tunge policies), oprettes follow-up tasks — ingen kodeændringer i denne omgang

## Out of scope
- Ændring af RLS-policies eller indeks (afventer rapportens fund)
- Frontend-ændringer
- Auto-monitoring/alerting (kan være follow-up)

## Filer der ændres
- `/mnt/documents/rls-performance-report.md` (ny)
- `CHANGELOG.md`
- evt. `docs/technical-specs/` note
