## Mål

Verificere at alle aktivt brugte edge functions og RLS/RPC-helpers stadig kan kaldes fra frontend uden runtime-fejl (401/403/404/500, CORS-fejl eller manglende funktioner i DB).

## Omfang

**Edge functions i brug** (11 stk., alle findes i `supabase/functions/`):
- admin-list-users, admin-create-user, admin-user-role, admin-user-delete, admin-user-status, admin-reset-password
- swap-duties, send-duty-reminders, cleanup-change-logs, cleanup-expired-users, dawa-proxy

**RPC/RLS-helpers kaldt fra frontend**:
- `is_admin_user`, `get_current_user_role`, `can_view_fuel_codes`
- `list_accessible_assignments_with_team` (planner-kerne)
- `accept_duty_swap`, `cancel_duty_swap`
- `log_security_event_optimized`, `log_security_event_safe`
- `verify_complete_fix`, `delete_old_rejected_vacations`
- `cleanup_demo_data_ttl`, `reset_demo_data`, `cleanup_session_data`
- `get_demo_warehouse_items`, `get_demo_vacations`, `get_demo_duties_with_employee`, `get_demo_profiles_admin_detailed`

## Fremgangsmåde (kun læsning, ingen kodeændringer)

### Trin 1 — DB-helpers eksisterer
Kør `supabase--read_query` mod `pg_proc` og bekræft at hver RPC ovenfor findes med korrekt signatur og `search_path = ''`. Manglende funktioner = blocker.

### Trin 2 — Edge functions svarer
For hver af de 11 funktioner: `supabase--curl_edge_functions` med korrekt method (OPTIONS preflight + GET/POST). Forventet: 200/204 eller 401 hvis auth kræves men ikke sendt — IKKE 404/500. Tjek CORS-headers i svaret.

### Trin 3 — Edge function logs
`supabase--edge_function_logs` for hver function (sidste 24t) — kig efter boot-fejl, uncaught exceptions, manglende secrets.

### Trin 4 — Frontend runtime-validering i preview
Browser-driven smoke test som indlogget bruger:
1. `/dashboard` — udløser `list_accessible_assignments_with_team`, `is_admin_user`, evt. `get_current_user_role`
2. `/planner` — udløser planner-RPC tungt; tjek query-tider og fejl
3. `/admin` (UserManagement) — udløser `admin-list-users` + `get_demo_profiles_admin_detailed`
4. `/cars` — udløser `can_view_fuel_codes` + `log_security_event_safe`
5. Vagt-/ferieside — udløser duty- og vacation-RPC'er

For hvert trin: `browser--read_console_logs` + `browser--list_network_requests` filtreret på errors/4xx/5xx.

### Trin 5 — Rapport
Tabel pr. function/RPC: ✅ OK / ⚠️ advarsel / ❌ fejl med årsag og forslag til fix. Ingen kodeændringer i denne kørsel — fix foreslås separat. Hvis alt er grønt, opdateres `CHANGELOG.md` med valideringsnoten.

## Forudsætninger

- Brugeren skal være logget ind i preview-iframen (super_admin foretrækkes for bredest dækning).
- Ingen destruktive kald — admin-create/delete/role/status testes kun med OPTIONS-preflight og GET hvor relevant; faktiske mutations springes over.

## Out of scope

- Ingen kodeændringer
- Ingen migrations
- Ingen automatiserede Deno/Vitest-tests
