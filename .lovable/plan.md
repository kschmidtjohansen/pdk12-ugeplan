## Mål
Tilføj et admin-widget på Dashboardet som viser de seneste auto-publiceringer (kørt af `auto_publish_due_assignments`-funktionen kl. 00:00) sammen med antallet af assignments, der blev publiceret i hver kørsel.

## Status i dag
- DB-funktionen `public.auto_publish_due_assignments()` findes og returnerer antallet af opdaterede rækker, men der **logges ikke** noget om kørslerne i dag — hverken kørselstidspunkt eller antal.
- Der findes ingen tabel for auto-publish historik. `planner_change_log` bruges kun til manuelle ændringer.
- Dashboardet (`DashboardCockpit`) har allerede et `aside`-område hvor admin-widgets vises betinget på `showMetrics` (super_admin / administrator / skadeleder).

Uden et logningsspor kan vi ikke vise historik. Planen tilføjer derfor både en lille loggings­tabel + et nyt widget.

## Ændringer

### 1. Database (migration)
- Ny tabel `public.auto_publish_log`:
  - `run_at timestamptz` (hvornår kørslen skete)
  - `assignments_updated integer` (returværdien fra funktionen)
  - `department_id uuid null` (hvilken afdeling — null = global kørsel hvis funktionen er global)
  - `triggered_by text` ('cron' | 'manual')
- RLS: Kun administratorer / super_admin / skadeleder må læse. Insert kun via SECURITY DEFINER-funktionen.
- Opdatér `auto_publish_due_assignments()` (eller wrap den) så den efter UPDATE indsætter en række i `auto_publish_log` med antal og tidspunkt. `SET search_path = ''`, SECURITY DEFINER.
- Index på `run_at DESC` for hurtig "seneste N" query.

### 2. Frontend hook
- Ny `src/hooks/useAutoPublishLog.ts` med React Query (`staleTime: 5 min`):
  - Henter de seneste 10 rækker fra `auto_publish_log` sorteret `run_at DESC`.
  - Respekterer `selectedDepartmentId` (filtrerer på department_id eller globale rækker).
  - Kun aktiveret når brugeren er admin (`isEffectiveAdmin`).

### 3. UI-widget
- Ny komponent `src/components/Dashboard/AutoPublishLogWidget.tsx`:
  - `Card` med titel "Seneste auto-publiceringer" (ikon: `Clock` fra lucide).
  - Liste af op til 10 kørsler: `format(run_at, 'dd. MMM HH:mm', { locale: da })` + badge med "{n} opgaver".
  - Tom-tilstand: "Ingen kørsler endnu".
  - Loading skeleton + error handling via eksisterende mønster.
  - Følger compact dashboard design: `p-4 gap-4`, `rounded-xl`.

### 4. Indlejring i Dashboard
- I `DashboardCockpit.tsx` aside-sektionen: render `<AutoPublishLogWidget />` betinget på `showMetrics && isEffectiveAdmin` (samme guard som `VacationNotificationsPanel`).

### 5. Oversættelser
- Tilføj nøgler i `src/translations/da/dashboard.ts` og `src/translations/en/dashboard.ts`:
  - `autoPublishLog.title`, `autoPublishLog.empty`, `autoPublishLog.assignmentsUpdated`, `autoPublishLog.triggeredBy.cron|manual`.

### 6. Dokumentation
- `CHANGELOG.md`: ny entry "2026-05-15 — Dashboard: admin-widget for auto-publish historik".
- `docs/implementation-plan/tasks.md`: marker som `[x]`.
- Opdatér memory `mem://features/auto-publish-schedule` med nye logningsdetaljer.

## Tekniske noter
- Migration kører før kodeændringer — typer for `auto_publish_log` skal være tilgængelige i `supabase/types.ts` før hooket bygger.
- Hvis `auto_publish_due_assignments` allerede kaldes fra pg_cron, behøver vi ikke ændre cron-konfigurationen; kun selve funktionsbody'en udvides med insert.
- Multi-tenant-guarden: hvis funktionen i dag opererer globalt på tværs af afdelinger, indsætter vi én log-række per afdeling (loop) så filtrering på `selectedDepartmentId` virker korrekt.

## Out of scope
- Manuel "Kør auto-publish nu"-knap.
- Detaljeret drill-down med liste over præcis hvilke assignment-id'er der blev publiceret.
- Notifikationer ved 0-kørsler.

## Filer
- ny: `supabase/migrations/<timestamp>_auto_publish_log.sql`
- ny: `src/hooks/useAutoPublishLog.ts`
- ny: `src/components/Dashboard/AutoPublishLogWidget.tsx`
- ændret: `src/components/Dashboard/DashboardCockpit.tsx`
- ændret: `src/translations/da/dashboard.ts`, `src/translations/en/dashboard.ts`
- ændret: `CHANGELOG.md`, `docs/implementation-plan/tasks.md`
