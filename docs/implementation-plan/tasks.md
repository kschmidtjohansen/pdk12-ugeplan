# Implementeringsfaser

## Løbende rettelser ✅

- [x] `/changelog` viser nu både opgave-, ferie/fraværs- og medarbejderændringer for den valgte afdeling. Eksisterende medarbejderoprettelser vises via `profiles.created_at`, og fremtidige medarbejder-opret/redigér/slet logges eksplicit i `planner_change_log`.
- [x] Oversigtens ugentlige statusbar viser nu den konkrete periode bag hvert navn for ferie, kursus, skadeledervagt og kørevagt (fx "23.06–25.06"). Dækker fraværet/hele vagten hele ugen, vises "Hele ugen" i stedet for datoerne.
- [x] Dashboardets fraværende-metric matcher kursus mod hele den valgte ISO-uge (ikke kun ankerdato), så Henrik m.fl. på kursus vises i "Fraværende" med gul Kursus-label uanset hvilken dag i ugen man kigger på.
- [x] Dashboardets fraværende-metric viser nu altid medarbejdere på kursus med gul Kursus-label, og Ikke-tildelte Ressourcer har egen "Medarbejdere på Kursus"-sektion. "Medarbejdere på Ferie" omdøbt til "Medarbejdere fraværende".
- [x] Kursus-status er nu gennemført i dashboardets metrics-dialoger: kursusmedarbejdere fjernes fra tilgængelige og vises med gul Kursus-label under fravær.
- [x] `user_roles` SELECT-policy udvidet til alle authenticated brugere, så fugttekniker/servicemedarbejder ser korrekte kollega-roller i dashboard og dialoger (rod-årsag bag "ledige medarbejdere"-fejlen).
- [x] Rolle-redigering i Admin bruger nu `admin-user-role` edge function i stedet for direkte klient-write til `user_roles`, så multi-roller kan gemmes uden 403.
- [x] Bil-vælgerens konflikt-bekræftelse: bil-listen lukkes og unmountes nu før AlertDialog'en "Bil allerede i brug" åbnes, så dropdownen ikke kan overlappe dialogboksen eller skjule "Brug alligevel"-knappen.
- [x] Strikt underafdelings-isolation: opgaver, biler og medarbejdere uden tilknytning til den valgte underafdeling skjules nu i underafdelings-visningen (gælder alle roller). Medarbejder-redigering har nu et "Underafdeling"-felt der gemmer til `user_access.sub_department_id`.


## Fase 1: Sikkerhedsaudit ✅

Gennemført 2026-02-15.

- [x] Fuld RLS-audit af alle 24 tabeller — ingen kritiske policy-fejl
- [x] Auth-audit af alle 11 edge functions — korrekt JWT-verifikation og rolle-check
- [x] Fjernet JWT token-preview logging fra Admin PasswordChangeDialog
- [x] Fjernet hardcoded API-nøgle fra Admin PasswordChangeDialog
- [x] Fjernet password-metadata logging fra konsollen
- [x] Fjernet service-key prefix logging fra `admin-list-users` edge function
- [x] Wrapped 50+ debug console.log i AuthContext med `import.meta.env.DEV` guard
- [x] Wrapped e-mail og token logs i PasswordResetPage med `import.meta.env.DEV` guard
- [x] Dokumenteret `profiles` og `user_roles` som offentligt læsbare (nødvendigt for funktionalitet)

## Fase 2: Database-optimering ✅

Gennemført 2026-02-15.

- [x] Tilføjet 8 manglende indexes på `department_id` og `sub_department_id`
- [x] Fjernet 3 redundante indexes på `assignments`
- [x] Dokumenteret `cars.sub_department_id` som redundant (erstattet af junction-tabel)
- [x] Dokumenteret logs-tabel som 276 MB / 366k rækker med 63% støj
- [x] Dynamisk undertitel på login-side baseret på sidst valgte afdeling
- [x] Fjernet hardcoded afdelingsnavne fra `index.html` meta tags

## Fase 3: Performance ✅

Gennemført 2026-02-15.

- [x] Wrapped 100+ debug `console.log` i `import.meta.env.DEV` guard (9 filer)
- [x] Fjernet verbose per-assignment logging i `employeeAvailability.ts`
- [x] Fjernet `logSecurityEvent('vacation_realtime_change')` (stoppede 170MB+ logs-bloat)
- [x] Fjernet ubrugte imports i flere filer
- [x] Profilmenu viser jobtitel i stedet for teknisk rolle-ID

## Fase 7: TanStack Query Caching & Realtime-konsolidering ✅

Gennemført 2026-02-15.

- [x] Migreret `useOptimizedAssignments` fra `useState`/`useEffect` til `useQuery` med `staleTime: 5min`, `gcTime: 10min`
- [x] Tab-skift viser nu cached data øjeblikkeligt (stale-while-revalidate)
- [x] Realtime-kanal bruger `queryClient.invalidateQueries` i stedet for fuld refetch
- [x] Tilføjet `assignments_employees`-lytning i realtime-kanalen (fanger medarbejder-tildelinger)
- [x] Fjernet `assignments`-lytter fra `useUnifiedData.ts` (allerede dækket af useOptimizedAssignments)
- [x] DEV-guard på 50+ console.log i `optimizedAssignmentService.ts`, `realtimeManager.ts`, `usePlannerPage.ts`
- [x] Optimistisk UI bevaret via `localAssignments` state-override

## Fase 4: UI/Visuel konsistens ✅

Gennemført 2026-02-15.

- [x] Erstattet hardcoded `text-gray-*` farver med tema-variabler i 6+ komponenter
- [x] Standardiseret tomme tilstande med `py-12` spacing og tema-farver
- [x] Slettet ubrugt `Planner/EmptyState.tsx`
- [x] Fjernet debug-kode fra ResponsibleUserSelector og AssignmentFormFields
- [x] AssignmentCard: `hover:shadow-xl transition-all duration-200`
- [x] DaySection: Dark mode-korrekt hover og forbedret tom-tilstand med CalendarX2-ikon
- [x] PageHeader: `font-bold tracking-tight`, `rounded-2xl`, `shadow-md`
- [x] `super_admin` kan nu slette andres chat-beskeder
- [x] 20MB filstørrelses-validering på assignment fil-upload
- [x] Erstattet alle hardcoded `text-gray-*` / `border-gray-*` / `bg-gray-*` med tema-tokens i CarsTable og MobileCarCard (36 erstatninger)
- [x] Oprettet komplet docs-mappestruktur: timeline, features, user-personas, database-schema, design-system

## Fase 8: UI/UX Finpudsning & Responsivitet ✅

Gennemført 2026-02-15.

- [x] Erstattet hardcoded gray-farver med tema-tokens i PlannerPage, CarSelector, UserManagement, LoadingSpinner, TopNavbar, EnhancedVacationCard
- [x] DEV-guard på 4 console.log i AssignmentDetails.tsx
- [x] Tilføjet `overflow-x-auto` på CarsTable og WarehouseTable for mobil horisontal scroll
- [x] Verificeret gitter-visning (allerede fungerende med LayoutGrid-ikon og md:grid-cols-3)
- [x] Verificeret hover-effekter på opgavekort (allerede implementeret)
- [x] Verificeret tomme tilstande (allerede standardiseret med CalendarX2-ikon)
- [x] Opdateret component-library.md med gitter-visnings-regler

## Fase 5: Sikkerhedsrettelser (Runde 2) ✅

Gennemført 2026-02-15.

- [x] Verificeret `can_access_vacation()` RLS-funktion — skadeledere begrænset til egen afdeling via `user_access.department_id`
- [x] Verificeret PasswordChangeDialog.tsx — ingen følsom logging fundet
- [x] Fjernet følsom logging fra `admin-reset-password` edge function (IP, token-længde, key-presence, bruger-email, password-længde)
- [x] Tilføjet JWT-validerings-dokumentation som kommentarer i `admin-reset-password` edge function
- [x] Fjernet bruger-email fra security event logs i `admin-reset-password`
  - `databaseCleanup.ts` (6 stk cleanup-operationer)

## Fase 6: Database-optimering (Runde 2) ✅

Gennemført 2026-02-15.

- [x] Fjernet 13 redundante indexes på `notifications`, `profiles`, `assignments`, `logs`, `case_folder_mappings`, `vacations`
- [x] Fjernet ineffektivt `logs_message_idx` (btree på TEXT-kolonne med 95 distinct værdier)
- [x] Slettet 317k støj-rækker fra `logs` (vacation_realtime_change, enhanced_error_timeout, enhanced_error_database) — ~180 MB frigjort
- [x] Dokumenteret 6 redundante kolonner (assignments.onedrive_folder_id, route_distance_km, route_duration_min, attachment_files; cars.sub_department_id; logs.message index)
- [x] Verificeret `assignment_files`-tabel som korrekt normaliseret (ingen redundant fil-metadata)
- [x] Opdateret `docs/technical-specs/database-schema.md` med fjernede indexes og redundante kolonner

## Fase 9: End-to-End QA & Production Readiness ✅

Gennemført 2026-02-15.

- [x] Erstattet ~15 hardcoded gray-farver med tema-tokens i `NotFound.tsx`
- [x] Erstattet ~30 hardcoded gray-farver med tema-tokens i `PasswordResetPage.tsx`
- [x] Erstattet ~15 hardcoded gray-farver + oversat 6 engelske strenge til dansk i `Index.tsx`
- [x] Erstattet 2 hardcoded gray-farver med tema-tokens i `CarsPage.tsx`
- [x] Erstattet 3 hardcoded gray-farver med tema-tokens i `EmployeesPage.tsx`
- [x] Erstattet ~14 hardcoded gray-farver med tema-tokens i `MobileNavigation.tsx`
- [x] Erstattet 4 gray-farver + oversat "Technical details" til dansk i `EmployeeLoadingError.tsx`
- [x] Erstattet `bg-gray-50` med `bg-muted/50` i `CarMarkAvailableDialog.tsx`
- [x] Erstattet `border-gray-300 border-t-blue-600` med `border-muted-foreground/30 border-t-primary` i `spinner.tsx`
- [x] Erstattet 2 gray-farver med tema-tokens i `EmployeeFormDialog.tsx`
- [x] DEV-guard på 6 console.log i `EmployeeAvailabilityDialog/index.tsx`
- [x] DEV-guard på 4 console.log i `useEmployeeDialogData.ts`
- [x] DEV-guard på 3 console.log i `VacationFormDialog.tsx`
- [x] DEV-guard på 2 console.log i `assignmentDataConverter.ts`
- [x] DEV-guard på ~8 console.log i `PasswordResetPage.tsx`
- [x] Projekt markeret som **Production Ready**

## Fase 9b: Demo-bruger afdelingsadgang ✅

Gennemført 2026-02-15.

- [x] Tilføjet 3 `user_access`-rækker: demo-bruger → dept 02 - Storkøbenhavn med underafdelinger Fugt & Skimmel, Løsøre, Miljø & Brand
- [x] Verificeret at eksisterende data (opgaver, biler, lager) forbliver isoleret på dept 12 - Fredericia
- [x] Ingen kodeændringer nødvendige — filtreringslogik virker korrekt via `department_id`
- [x] Dokumenteret i CHANGELOG.md

## Fase 9c: Demo-data afdelingsisolering ✅

Gennemført 2026-02-15.

- [x] Oprettet `src/constants/demo.ts` med `DEMO_HOME_DEPARTMENT_ID` og `isDemoNonHomeDepartment()`
- [x] Tilføjet demo-afdelingsfiltrering i `useEmployeeData`, `useCarData`, `useWarehouseData`, `useVacationData`, `useDutyData`
- [x] Tilføjet demo-afdelingsfiltrering i `optimizedAssignmentService` (fetchAllAssignments, fetchAllPublishedAssignments)
- [x] Tilføjet demo-afdelingsfiltrering i `useUnifiedData`
- [x] Ingen database-ændringer — kun klient-side filtrering
- [x] Dokumenteret i CHANGELOG.md

## Fase 9d: Demo-data isolering via is_demo flag ✅

Gennemført 2026-02-15.

- [x] Tilføjet `is_demo` kolonne til 8 tabeller med partial indexes
- [x] Oprettet RESTRICTIVE RLS-politikker der skjuler demo-data for live-brugere
- [x] Oprettet `reset_demo_data()` RPC til manuel oprydning
- [x] Oprettet `cleanup_demo_data_ttl()` RPC til automatisk 15-min TTL
- [x] Opdateret alle create-hooks med `is_demo: true` for demo-mode
- [x] Tilføjet `.eq('is_demo', false)` til alle live-mode queries (defense in depth)
- [x] Opdateret `useDemoAutoCleanup` til at bruge RPC
- [x] Dokumenteret i CHANGELOG.md

## Fase 9e: Demo-RPC migrering + Afdelingsvælger redesign ✅

Gennemført 2026-02-15.

- [x] Migreret alle 6 demo-RPCs fra `demo.*` til `public.*` med `WHERE is_demo = true`
- [x] Rettet `get_demo_vacations` og `list_demo_assignments_with_team` return types (DROP + CREATE)
- [x] Realtime-subscription i `useDutyData` bruger nu altid `schema: 'public'`
- [x] Afdelingsvælger redesignet til side-by-side layout (to separate dropdowns)
- [x] DEV-guard på 12 console.log i `useDutyData`, `carSecurityService`, `useCarFormState`, `DepartmentContext`
- [x] Dokumenteret i CHANGELOG.md

## Fase 9f: Fix manglende opgaver + vagter (NULL department_id) ✅

Gennemført 2026-02-16.

- [x] Backfilled 10 assignments med `department_id = NULL` til afd. 12 - Fredericia
- [x] Opdateret RPC `list_accessible_assignments_with_team` med `OR a.department_id IS NULL` i begge grene
- [x] Backfilled 21 orphaned vagter med `department_id` fra opretterens profil
- [x] Tilføjet `department_id` og `sub_department_id` til duty-insert i `useDutyActions.ts`
- [x] Ændret `useDutyData.ts` query til defensiv `.or()` filter der inkluderer `NULL department_id`
- [x] Dokumenteret i CHANGELOG.md

## Fase 10: Sikkerhedspanel-oprydning ✅

Gennemført 2026-02-16.

- [x] Tilføjet `SET search_path = public` til 4 SECURITY DEFINER funktioner
- [x] Tilføjet CHECK constraints på `assignment_messages` (max 5000) og `assignment_files` kommentarer (max 2000)
- [x] Strammet storage bucket policy for `assignment-files` (kun tildelte/ansvarlige/admins)
- [x] Tilføjet `CRON_SECRET` validering til 3 cron edge functions
- [x] Wrappet 80+ uguardede console.log/warn/error i `import.meta.env.DEV` guard (14 filer)
- [x] Klient-side længdevalidering i useAssignmentMessages og useAssignmentFiles
- [x] Markeret acceptable findings som ignoreret med begrundelse
- [x] Dokumenteret i CHANGELOG.md

## Fase 10b: Resterende sikkerhedsfund ✅

Gennemført 2026-02-16.

- [x] DEV-guard på 3 console.error/warn i `supabase/client.ts`
- [x] DEV-guard på 1 console.warn i `SecurityHeaders.tsx`
- [x] DEV-guard på 2 console.warn/error i `useAssignmentFiles.ts`
- [x] Slettet `definer_no_search_path` finding (allerede rettet i migration)
- [x] Slettet `console_prod_logging` finding (rettet i kode)
- [x] Markeret `demo_pass_in_migrations` som ignoreret (RESTRICTIVE RLS + 15-min TTL)
- [x] Markeret `chart_dangerous_html` som ignoreret (shadcn/ui intern data)
- [x] Sikkerhedspanel: 0 errors, 0 warnings, 2 ignorerede infos
- [x] Dokumenteret i CHANGELOG.md

## Fase 5, Del 1: Geografisk Grundlag ✅

Gennemført 2026-02-16.

- [x] Tilføjet `home_postcode` (TEXT) kolonne til `profiles` med CHECK constraint `~ '^\d{4}$'`
- [x] Opdateret `Employee` TypeScript-type med `home_postcode?: string`
- [x] Opdateret `useEmployeeFormState` med `home_postcode` i alle form-funktioner
- [x] Opdateret `useEmployeeData` SELECT-query og transform med `home_postcode`
- [x] Opdateret `useEmployeeActions` updatePayload med `home_postcode`
- [x] Opdateret `useEmployeeCreation` insert/update payloads med `home_postcode`
- [x] Tilføjet postnummer-felt i `EmployeeFormDialog` (kun admin, med 4-cifret validering)
- [x] Tilføjet postnummer-kolonne i `EmployeesTable` og `EmployeeTableRow` (kun admin)
- [x] Tilføjet postnummer i `MobileEmployeeCard` (kun admin)
- [x] Tilføjet DA/EN oversættelser for homePostcode, postcode, postcodeInvalid
- [x] Opdateret `docs/technical-specs/database-schema.md`
- [x] Dokumenteret i CHANGELOG.md

## Fase 5, Del 2: Nærhedsbaseret Booking-forslag ✅

Gennemført 2026-02-16.

- [x] Tilføjet "Sagens postnummer"-felt i AssignmentFormFields med numerisk input (max 4 cifre)
- [x] Implementeret proximity-sortering i EmployeeSelector via `useMemo` (3 niveauer)
- [x] Tilføjet MapPin-ikon og grønne badges for direkte match og regional match
- [x] Tilføjet DA/EN oversættelser for casePostcode, proximityExact, proximityRegion
- [x] Opdateret docs/product-roadmap/features.md med "Geografisk Optimering"
- [x] Dokumenteret i CHANGELOG.md

## Fase 5, Del 4: 15 km Radius Optimering ✅

Gennemført 2026-02-16.

- [x] Oprettet `src/utils/haversine.ts` med Haversine-formel til GPS-afstandsberegning
- [x] Erstattet postnummer-baseret sortering med præcis GPS-afstandsberegning i EmployeeSelector
- [x] Medarbejdere inden for 15 km vises øverst med grøn badge og præcis afstand
- [x] Koordinater sendes direkte fra AssignmentFormFields til EmployeeSelector
- [x] Fallback til alfabetisk sortering hvis GPS-koordinater mangler
- [x] Dansk komma-formatering af afstand (8,4 km)
- [x] DA/EN oversættelser tilføjet (proximityNear, proximityDistance)
- [x] Dokumenteret i CHANGELOG.md

## Fase 10c: Lokationsisolering per afdeling ✅

Gennemført 2026-02-16.

- [x] Lokationer fuldt isoleret per afdeling (localStorage scoped per department)
- [x] Hardcodede default-lokationer fjernet — hver afdeling starter med tom liste
- [x] Manglende oversættelser for lokationsstyring tilføjet (da/en)

## Fase 11: 360-graders Gennemgang ✅

Gennemført 2026-02-17.

- [x] DEV-guard på ~50 uguardede console.log i 14 filer (MainLayout, useScreenDisplayData, MineOpgaver, AssignmentActionButtons, useEmployeeStatus, useVacationCleanup, VacationCleanupHandler, PasswordResetDebugger, SecurityErrorBoundary, useEmployeeData, ProfilePictureDialog, useAssignmentHelpers, useDemoTracking)
- [x] Erstattet ~30 hardcoded gray-farver med semantiske tema-tokens i 10 filer (EmployeesTable, VacationPage, VacationTable, password-input, secure-input, status-badge, SecurityErrorBoundary, PasswordResetDebugger, DemoRoleSwitcher, ImageCropper)
- [x] useEmployeeStatus: gray-100/gray-800 → muted/foreground
- [x] tasks.md opdateret med lokationsisolering og 360-graders gennemgang

## Fase 12: Total Master Audit + Session-timeout ✅

Gennemført 2026-02-17.

- [x] 180-minutters session-timeout med automatisk logout og cache-rydning (AuthContext.tsx)
- [x] Login-tekst rettet: "Velkommen til Ugeplan" (fjernet Polygon-branding og undertekst)
- [x] DEV-guard på uguardede console.log i 6 filer (useVacationRequestsStatus, useCarDataHandler, enhancedDataFetching, enhancedUnifiedDataService, supabaseIssuesAuditor, use-toast)
- [x] Realtime schema-fix i useVacationRequestsStatus (hardcoded 'public' i stedet for 'demo')
- [x] EmployeeSelector statuslabels oversat via t() (Expired, Terminated, Inactive)
- [x] Oversættelsesnøgler tilføjet: auth.sessionTimedOut, employees.statusExpired/statusTerminated/statusInactive
- [x] CHANGELOG.md og tasks.md opdateret

## Fase 13: Total 360-graders Audit ✅

Gennemført 2026-02-24.

- [x] Mobil UX verificeret: Selectors bruger Drawer (mobil) + modal Popover (desktop). Ingen overlap i opgavevisning.
- [x] Data-isolation verificeret: Alle 7 moduler filtrerer på department_id. Create-funktioner tagger automatisk.
- [x] RLS Policies verificeret: Alle tabeller har RLS. SECURITY DEFINER funktioner korrekte.
- [x] Cache/Session verificeret: Logout rydder queryClient, service-caches, sessionStorage, localStorage.
- [x] Haversine 15km radius verificeret med DAWA-koordinater.
- [x] Warehouse isolation verificeret (department_id + sub_department_id).
- [x] Duty/Vacation filtrering verificeret inkl. nye afdelingsfiltre på notifikationer.
- [x] Uguardede console.log/error wrappet i DEV guard (5 filer, 11 statements).
- [x] search_path på SECURITY DEFINER funktioner verificeret korrekt.
- [x] CHANGELOG.md og tasks.md opdateret

## Fase 14: Planner UX-forbedringer ✅

Gennemført 2026-04-04.

- [x] Serie-bevidst redigering/sletning med SeriesActionDialog (enkeltstående, serie, alle fremtidige)
- [x] Højreklik-kontekstmenu på booking-kort (Rediger, Dupliker, Slet, Publicer)
- [x] Undo-sletning med 5-sekunders fortrydelse via toast-notification
- [x] Audit Trail / Historik-fane i booking-redigering (planner_change_log)
- [x] Publicer-handling tilføjet til kontekstmenu
- [x] Auto-publicering ved dagsskifte (midnat 00:00) i stedet for kl. 16:00

## Fase 15: Global Audit & Oprydning ✅

Gennemført 2026-04-04.

- [x] DEV-guard på uguardet `console.error` i `useUnifiedData.ts`
- [x] Rettet interval-churn i `useAutoPublishAssignments` (ref-baseret tilgang)
- [x] Rettet forældet "16:00"-kommentar til "00:00"
- [x] tasks.md opdateret med manglende feature-poster (Fase 14 + 15)
- [x] Verificeret at alle øvrige 27 console-statements allerede var korrekt DEV-guarded
- [x] **2026-05-15:** Server-side auto-publicering genoprettet — `auto_publish_due_assignments()` + pg_cron hvert minut (Europe/Copenhagen). Erstatter den fjernede client-side hook.

## Fase 16: Ugeplan-udvidelser (rullende leverance, A–J) 🚧

Implementeres ét step ad gangen — jf. `.lovable/plan.md`.

- [x] Step 1 (A): `FilterChips` med URL-state (`mine`, `unpublished`, `conflicts`, `noResponsible`, `noLocation`)
- [x] Step 2 (B): Ferie/fravær-overlay i `DaySection` (`DayAbsenceRow`) + Polygon-blå farveharmonisering på medarbejder-pills og konflikt-stripe
- [x] ~~Step 3 (C): Daglig opsummering på `DaySection`-header~~ — fjernet efter brugerønske (DaySummary slettet)
- [x] Step 4 (D): Inline-publicering pr. dag fra header — "Publicér N kladder"-knap med AlertDialog-bekræftelse
- [x] Step 5 (E): Tom-dag-handling (CTA) — `EmptyDayCTA` med "+ Tilføj opgave" og "Kopiér fra i går" (springer over fravær)
- [ ] Step 6 (F): Visuel "i dag"-markør i tidslinjen
- [ ] Step 7 (G): Konflikt- og advarselscenter
- [ ] Step 8 (H): "Hvad ændrede sig?" — daglig diff-stripe
- [ ] Step 9 (I): Push-notifikationer ved tildeling
- [ ] Step 10 (J): Ugentlig "Mandagsbriefing" (e-mail)

## Performance: liste-paginering (UI)

- [x] Tilføj client-side paginering i `EmployeesTable` (25 pr. side, desktop + mobile)
- [x] Tilføj client-side paginering i `CarsList` (25 pr. side, desktop + mobile)
- [x] Progressive disclosure i `PastAssignments` + `CompactPastAssignments` (14 datoer, "Vis flere" +14)
- [x] Genbrugelig `SimplePagination`-komponent i `src/components/shared/`

## Performance: memoization af uge-beregninger (UI)

- [x] Module-level cache i `getWeekDates(week, year)` — stabile objekt-referencer
- [x] Pre-formaterede `startStr`/`endStr` for billig YYYY-MM-DD string-compare
- [x] FIFO-cache `getISOWeekInfoForDate(dateStr)` (cap 1000)
- [x] `PlannerPage`: `weekDates` via `useMemo`, weekAssignments-filter via string-compare, `useCallback` på uge-navigation

## Performance: virtualisering af Weekly Planner (UI)

- [x] Tilføj `@tanstack/react-virtual` (window-virtualizer)
- [x] Ny `VirtualList` hjælpekomponent med threshold-fallback og dynamisk row-måling
- [x] Virtualisér `CurrentAndFutureDays`, `CompactCurrentAndFutureDays`, `PastAssignments`, `CompactPastAssignments` (kun aktiveres > 10 dage)

## Reliability: Error Boundaries i Planner

- [x] Ny `PlannerWidgetErrorBoundary` med lokaliseret fallback (da/en) og retry
- [x] Wrap topsektioner i `PlannerContent` (UnassignedResources, DutyWeek, Current/Future, Past) hver i egen boundary
- [x] Wrap hver dag i `CurrentAndFutureDays`, `PastAssignments` og deres compact-varianter, så fejl i ét dagskort ikke nedlægger hele ugeplanen

## Observability: Web Vitals

- [x] Tilføj `web-vitals` library + reporter (`src/utils/webVitals.ts`) med DEV console-log og batch-flush til Supabase ved page hide
- [x] Ny tabel `web_vitals_metrics` med RLS (insert: egen user_id; select: admin/skadeleder)
- [x] Admin-tab "Web Vitals" med periode/side-filter, p75 KPI'er pr. metric og top-10 langsomste sider

## Planner: cross-sub-department ledighed (Multi-tenant)

- [x] Ny RPC `list_cross_subdept_busy_resources` returnerer optagne medarbejdere/biler i andre sub-department-scopes i samme hoveddepartment
- [x] Hook `useCrossSubDeptBusy` henter ugens cross-busy sets
- [x] `UnassignedResourcesSection` filtrerer optagne medarbejdere og biler ud af "ledige"-listerne på tværs af underafdelinger
