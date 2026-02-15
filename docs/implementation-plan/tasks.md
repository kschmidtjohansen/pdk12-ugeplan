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

## Fase 5: Sikkerhedsrettelser (Runde 2) ✅

Gennemført 2026-02-15.

- [x] Verificeret `can_access_vacation()` RLS-funktion — skadeledere begrænset til egen afdeling via `user_access.department_id`
- [x] Verificeret PasswordChangeDialog.tsx — ingen følsom logging fundet
- [x] Fjernet følsom logging fra `admin-reset-password` edge function (IP, token-længde, key-presence, bruger-email, password-længde)
- [x] Tilføjet JWT-validerings-dokumentation som kommentarer i `admin-reset-password` edge function
- [x] Fjernet bruger-email fra security event logs i `admin-reset-password`
- [x] Wrapped 48+ console.log i `import.meta.env.DEV` guard på tværs af 14 filer:
  - `EnhancedSecureLoginForm.tsx` (3 stk)
  - `notificationRealtime.ts` (7 stk)
  - `notificationActions.ts` (4 stk)
  - `notificationFetching.ts` (2 stk)
  - `useVacationRequestActions.ts` (8 stk)
  - `useVacationSecurity.ts` (1 stk)
  - `useAssignmentFormState.ts` (alle console.log)
  - `useAssignmentActions.ts` (4 stk responsible user logs)
  - `useEmployeeCreation.ts` (alle console.log)
  - `Index.tsx` (3 stk auth-status)
  - `PasswordResetPage.tsx` (3 stk recovery mode)
  - `ScreenDisplayPage.tsx` (8 stk URL/dato-data)
  - `databaseCleanup.ts` (6 stk cleanup-operationer)
