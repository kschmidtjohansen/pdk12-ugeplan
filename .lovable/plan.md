
## Opret 3 manglende docs-filer med fuldt indhold

### Filer der oprettes

| Fil | Indhold |
|-----|---------|
| `docs/technical-specs/data-models.md` | Komplet oversigt over alle 17 tabeller, relationer, enums og RPC-funktioner |
| `docs/technical-specs/architecture.md` | SHA256/bcrypt-kryptering, RLS-politikker, edge function sikkerhed, input-sanitering |
| `docs/ui-guidelines/component-library.md` | Alle genbrugelige komponenter i `shared/` og `ui/` med anvendelsesmoenstre |

### 1. `docs/technical-specs/data-models.md`

Indhold baseret paa `src/integrations/supabase/types.ts`:

- **17 kernetabeller** med kolonner og typer: `assignments`, `assignment_files`, `assignment_messages`, `assignments_employees`, `cars`, `car_sub_departments`, `case_folder_mappings`, `case_onedrive_mappings`, `departments`, `notifications`, `on_call_duties`, `onedrive_settings`, `planner_change_log`, `profiles`, `sub_departments`, `user_access`, `user_roles`, `vacations`, `warehouse_items`
- **Log-tabeller** (3 stk): `logs`, `logs_partitioned`, `logs_y2025m07/m08`
- **System-tabeller** (1 stk): `system_cleanup_tracking`
- **Junction-tabeller** (3 stk): `assignments_employees`, `car_sub_departments`, `user_access`
- **5 enums**: `assignment_type`, `duty_type`, `employee_status`, `user_role`, `vacation_status`
- **Vigtige relationer** (foreign keys) dokumenteret
- **RPC-funktioner** grupperet: adgangskontrol (10), data-hentning (15), logging (8), validering (6), vedligeholdelse (8)

### 2. `docs/technical-specs/architecture.md`

Indhold baseret paa eksisterende `readme.md` og sikkerhedsaudit:

- **Autentificering**: Supabase Auth med bcrypt, JWT-verifikation
- **Kryptering**: `hmac_sha256()` database-funktion, passwords haandteret af Supabase Auth
- **RLS-hjaelpefunktioner**: `is_admin_or_skadeleder()`, `is_super_admin()`, `can_access_department_data()`, `can_access_vacation()`, `can_user_access_assignment()`, `can_view_assignment_optimized()`
- **Edge Functions**: 11 funktioner, JWT-krav, CORS-headers, service role key kun server-side
- **Input-sikkerhed**: `sanitize_text_input()`, `validate_input_security()`, `check_rate_limit_security()`, `is_valid_email()`, `is_strong_password()`
- **Fil-sikkerhed**: 20MB upload-graense, MIME-type validering
- **Logging**: `import.meta.env.DEV` guard, `log_security_event_safe()` sparsomt, ingen secrets i output
- **Kendte undtagelser**: `admin-reset-password` uden JWT, `profiles`/`user_roles` offentligt laesbare

### 3. `docs/ui-guidelines/component-library.md`

Indhold baseret paa filsystemet:

**Shared-komponenter (9 stk)**:
- `EmptyState` — Standardiseret tom-tilstand med ikon, titel, beskrivelse, valgfri action-knap
- `CardSkeleton` — Loading-skeleton for kort
- `TableSkeleton` — Loading-skeleton for tabeller
- `MetricsSkeleton` — Loading-skeleton for dashboard-metrics
- `LoadingSpinner` — Generisk loading-indikator
- `RouteLoadingFallback` — Loading-komponent til lazy-loadede routes
- `LastRefreshIndicator` — Viser tidspunkt for seneste data-opdatering
- `PullToRefresh` — Pull-to-refresh wrapper til mobile listevisninger
- `RealtimeChangeNotifier` — Toast-notifikation ved realtime-aendringer

**UI-komponenter (51 stk)**: Radix UI-baserede primitiver (accordion, alert-dialog, avatar, badge, button, calendar, card, checkbox, dialog, dropdown-menu, form, input, label, popover, progress, select, separator, sheet, skeleton, sonner, switch, table, tabs, textarea, toast, tooltip, m.fl.) plus projektspecifikke: `password-input`, `secure-input`, `spinner`, `status-badge`

For hver shared-komponent dokumenteres: props-interface, anvendelseseksempel, og hvilken UI-guideline den opfylder.

### 4. Changelog-opdatering

Tilfoej under `## [Unreleased]`:

```
### Added - 2026-02-15
- Oprettet `docs/technical-specs/data-models.md` med komplet oversigt over 17+ tabeller, relationer, enums og 47 RPC-funktioner
- Oprettet `docs/technical-specs/architecture.md` med SHA256/bcrypt-kryptering, RLS-politikker, edge function sikkerhed og input-sanitering
- Oprettet `docs/ui-guidelines/component-library.md` med 9 shared-komponenter og 51 UI-primitiver inkl. props og anvendelsesmoenstre
```
