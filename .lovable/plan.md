

# 360-graders Gennemgang: pdk12-ugeplan - Pilot-klar i Uge 10

## Resumé af Fund

| Omraade | Kritiske | Advarsler | Informative |
|---------|----------|-----------|-------------|
| Sikkerhed & RLS | 0 | 1 (DAWA proxy, allerede ignoreret) | 2 (allerede ignoreret) |
| Uguardede console.log | 0 | **~50+ i produktion** | -- |
| Hardcoded gray-farver | 0 | **~240 forekomster i 22 filer** | -- |
| Feature-logik | 0 | 0 | 0 |
| Dokumentation | 0 | **tasks.md mangler opdatering** | -- |

---

## 1. Data-isolation og Sikkerhed

### RLS-status: OK
- Sikkerhedspanelet viser **0 errors, 0 warnings, 3 ignorerede infos** (demo-password, chart dangerouslySetInnerHTML, DAWA proxy)
- Alle 3 ignorerede findings har valide begrundelser
- `is_demo` RESTRICTIVE RLS-politikker er aktive paa alle 8 tabeller -- live-brugere kan IKKE se demo-data
- `can_access_vacation()`, `can_user_access_assignment()`, `is_admin_or_skadeleder()` har alle `SET search_path = public`
- Afdelingsisolering via `department_id`-filtrering i queries + `user_access`-tabellen

### Demo Sandbox: OK
- `reset_demo_data()` og `cleanup_demo_data_ttl()` RPC'er er aktive
- 15-min TTL via pg_cron er dokumenteret
- RESTRICTIVE RLS sikrer at live-brugere aldrig ser `is_demo = true` data

### Resterende problem: Ingen

---

## 2. Feature-logik og Integration

### DAWA og Geografi: OK
- `AddressAutocomplete` henter koordinater direkte fra DAWA autocomplete-svaret (`adgangspunkt.koordinater`)
- Fallback via `fetchPostnrCoords` hvis koordinater mangler i autocomplete
- Koordinater gemmes korrekt paa baade `assignments` (lat/lng) og `profiles` (lat/lng)

### Haversine 15 km: OK
- `haversineDistanceKm()` i `src/utils/haversine.ts` er matematisk korrekt (standard Haversine-formel)
- `EmployeeSelector` sorterer korrekt: medarbejdere inden for 15 km oeverst, derefter alfabetisk
- Top-3 naermeste vises med groen tekst og MapPin-ikon

### Edge Cases: OK
- Manglende koordinater: Fallback til alfabetisk sortering (via `distanceMap.size > 0` check)
- Manglende postnummer: `fetchPostnrCoords` returnerer `null`, ingen crash
- Ugyldigt postnummer: Regex-check `^\d{4}$` i `fetchPostnrCoords`

---

## 3. UI/UX og Design-konsistens

### Hardcoded gray-farver: SKAL FIXES
**~240 forekomster i 22 filer** bryder designsystemets regel om semantiske tema-tokens. De vigtigste:

| Fil | Antal | Eksempel |
|-----|-------|---------|
| `MainLayout.tsx` | 4 | `bg-gray-50`, `text-gray-400`, `from-gray-50` |
| `EmployeesTable.tsx` | 5 | `text-gray-400`, `text-gray-300`, `text-gray-500` |
| `VacationPage.tsx` | 1 | `border-gray-100` |
| `VacationTable.tsx` | 1 | `text-gray-500` |
| `password-input.tsx` | 4 | `text-gray-500`, `bg-gray-50`, `text-gray-700` |
| `secure-input.tsx` | 4 | `text-gray-500`, `bg-gray-200`, `text-gray-600` |
| `status-badge.tsx` | 3 | `bg-gray-100`, `text-gray-800` |
| `useEmployeeStatus.ts` | 2 | `bg-gray-100 text-gray-800` |
| `ProfilePictureDialog.tsx` | -- | -- |
| `SecurityErrorBoundary.tsx` | 2 | `bg-gray-50`, `bg-gray-100` |
| `PasswordResetDebugger.tsx` | 1 | `bg-gray-50` |
| `DemoRoleSwitcher.tsx` | 2 | `hover:bg-gray-50`, `text-gray-500` |
| `ImageCropper.tsx` | 1 | `border-gray-600` |

**Erstatninger jf. design-system.md**:
- `text-gray-400/500` -> `text-muted-foreground`
- `bg-gray-50/100` -> `bg-muted/50` eller `bg-muted`
- `border-gray-100/200` -> `border-border`
- `text-gray-800` -> `text-foreground`
- `hover:bg-gray-50` -> `hover:bg-accent`

### Responsivitet: OK
- `AddressAutocomplete` dropdown har `z-50`, `w-full`, `rounded-xl` -- fungerer paa mobil
- `EmployeeSelector` dropdown har `max-h-60 overflow-y-auto` -- scroll paa smaa skaerme
- Tabeller har `overflow-x-auto` for horisontal scroll

---

## 4. Kode-hygiejne og Dokumentation

### Uguardede console.log: SKAL FIXES (Hoejeste prioritet)

Foelgende filer har `console.log/warn/error` UDEN `import.meta.env.DEV` guard og koerer i produktion:

| Fil | Antal | Type |
|-----|-------|------|
| `MainLayout.tsx` | 2 | `console.log` (render-state + redirect) |
| `useScreenDisplayData.ts` | ~12 | `console.log` (fetch, retry, cache) |
| `MineOpgaver.tsx` | ~4 | `console.log` (filter-debug, brugerdata!) |
| `AssignmentActionButtons.tsx` | ~6 | `console.log` (klik-events, assignment-data) |
| `useEmployeeStatus.ts` | 2 | `console.log` (medarbejder-navn + status) |
| `useVacationCleanup.ts` | ~15 | `console.log/error` (cleanup-status) |
| `EmployeeSelector.tsx` | 4 | `console.error` (fejlhaandtering, OK at beholde) |
| `ProfilePictureDialog.tsx` | 2 | `console.error` (fejlhaandtering, OK at beholde) |
| `useAssignmentHelpers.ts` | 2 | `console.error` (fejlhaandtering, OK at beholde) |
| `useEnhancedUnifiedData.ts` | 1 | `console.error` (fejlhaandtering, OK at beholde) |
| `DataFetchErrorBoundary.tsx` | 1 | `console.error` (ErrorBoundary, OK) |
| `PasswordChangeDialog.tsx` (Profile) | 2 | `console.error` (fejl, OK) |
| `AssignmentFormFields.tsx` | 1 | `console.log` (car state) -- har DEV guard |
| `useEmployeeData.ts` | 2 | `console.error` (roles/access fejl, OK men boer guardes) |

**Kritiske at fixe** (laeakker brugerdata/PII i prod):
1. `MainLayout.tsx` linje 24+34: Logger auth-state paa HVER render
2. `useScreenDisplayData.ts`: 12 uguardede logs med data-detaljer
3. `MineOpgaver.tsx` linje 41+61+164: Logger brugernavne, IDs, assignments
4. `AssignmentActionButtons.tsx`: Logger assignment-IDs ved klik
5. `useEmployeeStatus.ts` linje 25+35: Logger medarbejder-navne og status
6. `useVacationCleanup.ts`: 15 uguardede logs om cleanup-status

### Dokumentation

**tasks.md**: Mangler afsnit for lokationsisolering (Fase 10c eller lignende). Boer opdateres med:
- [x] Lokationer fuldt isoleret per afdeling (localStorage scoped per department)
- [x] Manglende oversaettelser for lokationsstyring tilfojet

**CHANGELOG.md**: Er ajourfoert med seneste aendringer.

---

## Handlingsplan

### Trin 1: Console.log oprydning (14 filer)
Wrap alle uguardede `console.log` i `import.meta.env.DEV` guard. Behold `console.error` i catch-blokke men wrap ogsaa dem.

### Trin 2: Hardcoded gray-farver (22 filer)
Erstat alle `text-gray-*`, `bg-gray-*`, `border-gray-*` med semantiske tema-tokens jf. design-system.md.

### Trin 3: tasks.md opdatering
Tilfoej lokationsisolering som faerdig opgave.

### Trin 4: CHANGELOG.md opdatering
Dokumenter alle rettelser fra denne gennemgang.

---

## Teknisk Oversigt over Filer der Aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Layout/MainLayout.tsx` | DEV-guard + gray-farver |
| `src/hooks/useScreenDisplayData.ts` | DEV-guard paa 12 logs |
| `src/components/Dashboard/MineOpgaver.tsx` | DEV-guard paa 4 logs |
| `src/components/Planner/AssignmentActionButtons.tsx` | DEV-guard paa 6 logs |
| `src/components/Dashboard/EmployeeAvailabilityDialog/hooks/useEmployeeStatus.ts` | DEV-guard paa 2 logs |
| `src/hooks/vacation/useVacationCleanup.ts` | DEV-guard paa 15 logs |
| `src/hooks/employee/useEmployeeData.ts` | DEV-guard paa 2 console.error |
| `src/components/Profile/ProfilePictureDialog.tsx` | DEV-guard paa 2 console.error |
| `src/components/Employees/EmployeesTable.tsx` | Gray-farver |
| `src/pages/VacationPage.tsx` | Gray-farver |
| `src/components/Vacation/VacationTable.tsx` | Gray-farver |
| `src/components/ui/password-input.tsx` | Gray-farver |
| `src/components/ui/secure-input.tsx` | Gray-farver |
| `src/components/ui/status-badge.tsx` | Gray-farver |
| `src/components/Layout/SecurityErrorBoundary.tsx` | Gray-farver |
| `src/components/Admin/PasswordResetDebugger.tsx` | Gray-farver |
| `src/components/Demo/DemoRoleSwitcher.tsx` | Gray-farver |
| `src/components/Profile/ImageCropper.tsx` | Gray-farver |
| `docs/implementation-plan/tasks.md` | Tilfoej lokationsisolering |
| `CHANGELOG.md` | Dokumenter gennemgangens rettelser |

### Hvad der IKKE skal aendres (allerede OK)
- RLS-politikker: Alle korrekte
- Sikkerhedspanelet: 0 errors, 0 warnings
- Haversine-logik: Matematisk korrekt
- DAWA-integration: Fungerer med fallback
- Demo-isolering: is_demo + RESTRICTIVE RLS + TTL
- AddressAutocomplete: Responsiv og funktionel
- EmployeeSelector: Korrekt sortering og edge case-haandtering

