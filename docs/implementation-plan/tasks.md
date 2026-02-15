# Implementeringsfaser

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
