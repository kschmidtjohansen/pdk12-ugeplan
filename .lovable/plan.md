## Mål

En grundig, kontrolleret optimering af Polygon Ugeplan i 4 faser. Hver fase afsluttes med verifikation (linter/scanner re-run eller browser-walkthrough) før næste startes. Alt logges i `CHANGELOG.md` jf. dokumentationsprotokollen.

Ingen ændringer rører ved låste områder fra memory: legacy-kolonner i `assignments`/`cars`, multi-tenant isolation (`selectedDepartmentId`-guard), `SET search_path = ''` på DB-funktioner, demo-mode-arkitekturen, dialog-scrolling-mønster.

---

## Fase 1 — Sikkerhed (lukke åbne huller)

Først kører jeg `security--run_security_scan` + `supabase--linter` for at få frisk status (nuværende scan er `up_to_date: false`). Derefter:

**Bekræftede åbne fund (ikke i CHANGELOG):**
- `swap_duties_requestedby` (edge function): erstat `requestedBy` fra request body med `user.id` fra verificeret JWT i `supabase/functions/swap-duties/index.ts`. Behold kun `requestedBy` til notifikations-routing.
- `storage_assignment_files_unrestricted_insert`: stram storage INSERT-policy så bruger skal være i `assignments_employees` eller `responsible_user_id` for det `assignment_id` der ligger i path'en.
- `realtime_broadcast_unrestricted`: scope `realtime.messages` SELECT/INSERT-policies til department/bruger-membership i stedet for `true`.
- Supabase-linter SECURITY DEFINER-eksponering (0028/0029, ~10 funktioner): `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` og `GRANT EXECUTE ... TO service_role` for diagnostik/maintenance-funktioner. Behold execute for funktioner som UI'en faktisk kalder (f.eks. `accept_duty_swap`, `has_role`).
- Public bucket listing (0025): begræns SELECT-policy på `storage.objects` til `authenticated` + path-scope.

**Stale fund (allerede fikset jf. CHANGELOG 2026-04-30):**
- `profiles_table_public_exposure`, `user_roles_public_exposure`, `cars_public_exposure`, `warehouse_items_public_exposure`. Verificér via `pg_policies`-query at "USING true public"-policies faktisk er væk. Hvis ja → markér som fixed i scanner. Hvis nogen er tilbage → drop dem.

**Edge function audit (kort):** scan alle 11 functions for `requestedBy`-lignende patterns hvor body-data bruges til auth-beslutning i stedet for verificeret JWT.

**Verifikation:** kør `security--run_security_scan` + `supabase--linter` igen. Forventet: 0 error-level fund, warns kun for accepterede risici (dokumenteres i `security-memory`).

---

## Fase 2 — Funktionelle bugs (alle moduler)

Browser-walkthrough af hovedflows som admin og som almindelig medarbejder. For hvert modul tester jeg de faktiske outcomes (ikke kun at dialogen åbner):

| Modul | Flow der testes |
|---|---|
| Login | Husk-mig, fejlbeskeder, password-reset |
| Dashboard | Mine opgaver, QuickAccess, vagt-banner |
| Planner | Opret/rediger/slet opgave, multi-dag, konflikt-validering, undo, filter-chips, mobil-visning |
| Vagter | Tildel (multi-select), byt vagt (multi-modtager + atomisk accept), månedskalender + "+"-knap, fraværs/ferie-farver |
| Ferie | Anmod, godkend, slet — sub-dept isolation |
| Biler | Opret, marker utilg./tilg., Falck-abonnement, regex-validering |
| Lager | DAWA-autocomplete, dept-isolation, JSON-settings |
| Medarbejdere | DAWA-proximity, hidden home address, rolle-tildeling, super_admin-restriktion |
| Admin | Department-feature toggles, bruger-rolle-edge-fns, audit log |
| Screen Display | URL-param data-isolation |

Hvert fund logges, fixes i frontend/edge function (ikke DB med mindre nødvendigt), re-testes i browseren. Bugs grupperes i delcommits pr. modul.

---

## Fase 3 — Visuelle/UI-fejl & a11y

Statisk gennemgang + browser-verifikation på 3 viewports (375, 768, 1440):

- **Hardcoded farver**: `rg "text-(gray|slate|zinc|neutral|white|black)-\\d|bg-white\\b|bg-black\\b" src/components` → erstat med design-tokens (`text-foreground`, `bg-background`, `bg-muted` osv.) jf. design-critical-instructions. Acceptér kun whitelistede undtagelser (login mesh-overlay).
- **Tap-targets <44px**: alle `size="icon"` Buttons der er primære actions får `min-h-11 min-w-11`.
- **Icon-only buttons uden `aria-label`**: tilføj label fra eksisterende translations.
- **Dialog-scrolling**: bekræft fixed header + scrollable body på alle dialoger (memory).
- **Tomme tilstande**: konsistent `EmptyState`-komponent overalt.
- **Mobile**: tjek Planner view-toggles, Selector drawer-vs-popover (memory), top-bar overlap.
- **Focus-visible**: ringe på alle interaktive elementer; tab-rækkefølge i dialoger.
- **Heading-hierarki**: én `<h1>` pr. side (PageHeader bruger `h1` — verificér ingen route har dobbelt).
- **Single `<main>`**: bekræft kun ét i `MainLayout`/`AppShell`.

Resultater verificeres med browser-screenshots på 3 viewports for de 5 mest brugte sider (Dashboard, Planner, Vagter, Ferie, Medarbejdere).

---

## Fase 4 — Performance

- **Bundle-analyse**: tjek `dist/` for største chunks. Lazy-load tunge ruter (`AdminPage`, `ScreenDisplayPage`, `ChangeLogPage`) hvis ikke allerede gjort.
- **React Query**: bekræft `staleTime: 5min`/`gcTime: 10min` (memory) er konsistent på alle listemodul-hooks; ret afvigere.
- **Realtime debounce**: bekræft 1s debounce + ignore-own-action på alle kanaler (memory). Tjek for orphan-subscriptions.
- **Postgres**: kør `EXPLAIN` på de 3-5 tungeste queries (assignments med joins, vacation calendar, dashboard-metrics). Tilføj manglende index hvor `seq_scan` rates er høje. Memory siger 8 dept_id indexes allerede tilføjet — verificér.
- **Bilder/assets**: tjek `public/` for ukomprimerede billeder.
- **Console-støj**: scan for `console.log` uden `import.meta.env.DEV`-guard og wrap dem (memory: production-readiness).
- **Browser performance profile** på `/planner` (typisk tungeste side) før/efter for at måle effekt.

---

## Tekniske detaljer

**Dokumentation:** Hver fase får sin egen CHANGELOG-entry med dato (2026-05-14). `docs/implementation-plan/tasks.md` opdateres med `[x]` for hver afsluttet checkliste-post.

**Migrations:** Sendes til godkendelse enkeltvis pr. logisk gruppe (RLS-policies separat fra SECURITY DEFINER-revokes), med klar markdown-beskrivelse til ikke-tekniske brugere.

**Memory-opdateringer:** Hvis nye principper opstår undervejs (f.eks. en ny RLS-konvention), tilføjes de til `mem://` og indekset opdateres.

**Stop-betingelse pr. fase:** hvis en fase finder >5 ikke-trivielle bugs, pauser jeg og rapporterer status før Fase 4, så du kan beslutte om noget skal udskydes.

**Det jeg IKKE rører:** legacy-kolonner i `assignments`/`cars`, demo-mode schema, signing-keys/JWT auth-flow, multi-tenant `department_id`-mønster, bestående UI-tone og terminologi.

---

## Leverancer

1. Frisk security-scanner og Supabase-linter rapport: 0 error-level
2. Bug-rapport pr. modul (fixet eller dokumenteret)
3. Konsistente design-tokens i hele `src/components`
4. Performance-måling før/efter på Planner
5. Opdateret `CHANGELOG.md` + `docs/implementation-plan/tasks.md`