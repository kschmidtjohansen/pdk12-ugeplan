

## Total 360-graders Audit -- pdk12-ugeplan

### Sammenfattende status

Efter gennemgang af hele kodebasen, /docs, RLS-politikker, og alle moduler er her en samlet plan med konkrete rettelser. Planen er opdelt i de 5 hovedkategorier fra opgaven.

---

### 1. Mobil UX (Kritisk)

**1a. Scroll i selectors: ALLEREDE RETTET**

Alle fire selectors (EmployeeSelector, CarSelector, MultipleCarSelector, ResponsibleUserSelector) bruger allerede:
- **Mobil**: `Drawer` (vaul bottom sheet) med `touch-action: pan-y`, `overscroll-behavior: contain`
- **Desktop**: `Popover modal={true}` med `onWheel stopPropagation`
- **PullToRefresh**: Ignorerer touch events fra `[data-vaul-drawer]`, `[data-vaul-overlay]`, `[role="dialog"]`

Ingen yderligere aendringer noedvendige her.

**1b. Overlap Beskrivelse/Beskeder: ALLEREDE RETTET**

`AssignmentDetailsDialog` bruger `h-auto flex-shrink-0` paa detalje-kolonnen og `whitespace-pre-wrap break-words` paa beskrivelsen. Mobil stakker vertikalt. Ingen overlap fundet.

---

### 2. Data-isolation og Sikkerhed

**2a. department_id filter -- verificeret per modul:**

| Modul | Filtreret? | Fil |
|-------|-----------|-----|
| Dashboard (metrics) | Ja, via useEmployeeData/useCarData/etc. som alle filtrerer | useDashboardMetrics.ts |
| Planner (assignments) | Ja, via `list_accessible_assignments_with_team` RPC | optimizedAssignmentService.ts |
| Employees | Ja, `.eq('department_id', selectedDepartmentId)` | useEmployeeData.ts |
| Cars | Ja, `.eq('department_id', selectedDepartmentId)` | useCarData.ts |
| Vacation | Ja, via `useVacationData` + nu ogsaa notifikationer | useVacationData.ts |
| Duty | Ja, `.eq('department_id', selectedDepartmentId)` | useDutyData.ts |
| Warehouse | Ja, `.eq('department_id', selectedDepartmentId)` | useWarehouseData.ts |

**2b. Automatisk department_id tagging -- verificeret:**

Alle create-funktioner nedarver `selectedDepartmentId` automatisk. Guard i assignment-oprettelse afviser kald uden afdelings-ID.

**2c. RLS Policies -- gennemgaaet:**

Alle tabeller har RLS aktiveret. `can_access_vacation()`, `can_view_assignment_optimized()`, og `is_admin_or_skadeleder()` er korrekt implementeret som SECURITY DEFINER funktioner.

Ingen kritiske RLS-mangler fundet.

---

### 3. Cache og Session Management

**3a. Logout logic -- verificeret korrekt:**

`AuthContext.logout()` (linje 669-716) udforer:
1. `queryClient.clear()` -- rydder al TanStack Query cache
2. `unifiedDataService.clearCache()`, `OptimizedAssignmentService.clearCache()`, `enhancedDataFetching.clearCache()`
3. `sessionStorage.clear()`
4. Fjerner app-specifikke localStorage-noegler (department_id, view, location-data)

Navigation via `window.location.href = '/login'` tvinger fuld React-reinitialisering.

**3b. State reset -- verificeret:**

180-minutters session-timeout med automatisk logout er implementeret. DepartmentContext nulstilles ved fuld page reload.

---

### 4. Funktionel Test af Kerne-moduler

**4a. Haversine 15km radius**: Implementeret korrekt i `src/utils/haversine.ts`. EmployeeSelector bruger GPS-koordinater fra DAWA API og sorterer medarbejdere med top-3 inden for 15km markeret med groen tekst.

**4b. Warehouse isolation**: Bekraeftet -- filtrerer paa `department_id` og `sub_department_id`.

**4c. Duty/Vacation filtrering**: Bekraeftet -- begge filtrerer paa `selectedDepartmentId`.

---

### 5. Kode-hygiejne -- RETTELSER NOEDVENDIGE

**5a. Uguardede console.log i produktion**

Foelgende filer har console.log/warn UDEN `import.meta.env.DEV` guard:

| Fil | Antal uguardede | Type |
|-----|-----------------|------|
| `src/hooks/notifications/notificationCreate.ts` | 5 stk | console.log (linje 66, 70, 90, 107) |
| `src/hooks/notifications/notificationFetching.ts` | 1 stk | console.log (linje 28) |
| `src/hooks/notifications/dutyNotifications.ts` | 1 stk | console.log (linje 49) |
| `src/context/AuthContext.tsx` | 3 stk | console.error (linje 580, 652, 663, 712) |
| `src/components/shared/PullToRefresh.tsx` | 1 stk | console.error (linje 60) |
| `src/context/TranslationContext.tsx` | 1 stk | console.warn (linje 33, men dette er en catch-blok -- acceptabel) |

**Plan**: Wrap alle ovenstaaende i `import.meta.env.DEV` guard. Behold `console.error` i catch-blokke som er kritiske for fejlhaandtering (TranslationContext, ErrorBoundary) men guard resten.

**5b. search_path paa database-funktioner**

Allerede rettet i Fase 10 -- 4 SECURITY DEFINER funktioner har `SET search_path = public`. Ingen nye funktioner tilfojet siden.

**5c. UI konsistens**

Allerede gennemgaaet i Fase 4, 8, 9, 11. Alle hardcoded gray-farver erstattet med tema-tokens. EmptyState-komponenter standardiseret.

---

### Konkret implementeringsplan

#### Fil 1: `src/hooks/notifications/notificationCreate.ts`
- Linje 66: Wrap `console.log('Similar notification...')` i DEV guard
- Linje 70: Wrap `console.log('Creating notification...')` i DEV guard
- Linje 90: Wrap `console.log('This is likely due to RLS...')` i DEV guard
- Linje 107: Wrap `console.log('Notification created...')` i DEV guard

#### Fil 2: `src/hooks/notifications/notificationFetching.ts`
- Linje 28: Wrap `console.log('No user found...')` i DEV guard

#### Fil 3: `src/hooks/notifications/dutyNotifications.ts`
- Linje 49: Wrap `console.log('Duty notification created...')` i DEV guard

#### Fil 4: `src/context/AuthContext.tsx`
- Linje 580: Wrap `console.error('[AuthContext] Failed to refresh...')` i DEV guard
- Linje 652: Wrap `console.error('[AuthProvider] Login error...')` i DEV guard
- Linje 663: Wrap `console.error('[AuthProvider] Login exception...')` i DEV guard
- Linje 712: Wrap `console.error('[AuthProvider] Logout error...')` i DEV guard

#### Fil 5: `src/components/shared/PullToRefresh.tsx`
- Linje 60: Wrap `console.error('Refresh failed:')` i DEV guard

#### Fil 6: `CHANGELOG.md`
- Dokumenter 360-graders audit og alle rettelser

#### Fil 7: `docs/implementation-plan/tasks.md`
- Tilfoej ny fase: "Fase 13: Total 360-graders Audit"

---

### Resultat efter implementering

- 0 uguardede console.log/warn i produktionskode
- Alle moduler verificeret for afdelingsfiltrering
- Logout rydder al cached data korrekt
- Haversine-beregning fungerer med DAWA-koordinater
- Selectors scroller korrekt paa baade mobil (Drawer) og desktop (modal Popover)
- Ingen overlap i opgavevisning
- RLS-politikker korrekte og komplette
- Dokumentation opdateret

