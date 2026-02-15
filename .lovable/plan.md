

## Performance-optimering og profilvisning

### 1. Kritisk: Console-logging drosler applikationen

Konsolloggen viser tusindvis af linjer per dashboard-render. Hovedsynderne:

| Fil | Problem | Effekt |
|-----|---------|--------|
| `src/utils/employeeAvailability.ts` | Logger HVER assignment-check per medarbejder (1000 assignments x N medarbejdere = tusindvis af logs) | Massive CPU-blokering i produktion |
| `src/hooks/useDashboardMetrics.ts` | Logger et stort debug-objekt med fuldt breakdown HVER gang metrics beregnes | Blokerer render |
| `src/hooks/useOptimizedAssignments.ts` | 40+ console.log kald uden DEV-guard, inkl. emoji-debug og sample data | Unodvendig I/O |
| `src/hooks/useAssignmentsConsolidated.ts` | Logger filter-logik ved hvert kald (linje 26, 32, 34, 46, 54) | Spild |
| `src/hooks/useDashboard.ts` | Logger uge-info og alle filtrerede assignments (linje 12-13, 23, 40-46, 52, 59, 66, 76) | Spild |
| `src/services/enhancedUnifiedDataService.ts` | Logger ved hver fetch-operation | Spild |
| `src/hooks/car/useCarData.ts` | Logger ved fetch (linje 24, 46, 50) | Minor |
| `src/hooks/employee/useEmployeeData.ts` | Logger ved fetch (linje 24, 41, 80, 96, 160) | Minor |
| `src/hooks/vacation/useVacationData.ts` | Logger ved fetch (linje 24, 32, 85) | Minor |

**Rettelse:** Wrap ALLE debug console.log kald i `import.meta.env.DEV` guard. Fjern verbose per-assignment logging i `employeeAvailability.ts` helt (selv i DEV er det for meget).

### 2. Profilmenu: Viser "super_admin" i stedet for jobtitel

**Problem:** `UserMenu.tsx` linje 85 viser `user?.role` (teknisk rolle-ID som "super_admin"). Brugeren forventer at se sin jobtitel (f.eks. "Skadeleder/Projektleder").

**Lossning:** Hent `job_title` fra profilen (allerede fetchet i useEffect linje 39-58, men kun `avatar_url` selectes). Udvid SELECT til at inkludere `job_title` og vis den. Fald tilbage til oversat rolle hvis ingen jobtitel er sat.

**AEndring i `UserMenu.tsx`:**
- Udvid profile-fetch til `select('avatar_url, job_title')`  
- Gem `jobTitle` i state
- Vis `jobTitle || t('common.roles.' + user?.role) || user?.role` i stedet for bare `user?.role`

### 3. Vacation realtime-logging fylder 170MB i logs-tabellen

**Problem:** `useVacationData.ts` linje 122-127 kalder `logSecurityEvent('vacation_realtime_change', ...)` ved HVER realtime-opdatering. Dette har genereret 229.000 raekker i logs-tabellen.

**Rettelse:** Fjern `logSecurityEvent`-kaldet fra realtime-handleren. Det er ikke et sikkerhedsevent - det er normal drift.

### 4. Data-fetching redundans

**Observation:** Systemet har to parallelle data-pipelines:
- **TanStack Query-baseret** (useEmployeeData, useCarData, useVacationData, useWarehouseData) - korrekt med staleTime, queryKey deduplication
- **Manuel state + enhancedUnifiedDataService** (useEnhancedUnifiedData) - egen cache, ingen deduplication

`useOptimizedAssignments` bruger heller ikke TanStack Query, men har sin egen cache-mekanisme. At migrere denne til TanStack Query er en storre refaktor der risikerer at bryde funktionalitet.

**Handling nu:** Ingen strukturel aendring - fokus paa at fjerne de mest skadelige console.logs som er den primaere performance-flaskehals.

### 5. Login dynamisk undertitel

Allerede implementeret i forrige plan. Koden i `LoginPage.tsx` laeser `selected_department_id` fra localStorage og henter afdelingsnavnet. Virker korrekt.

### 6. Memory leak-tjek

Alle realtime-subscriptions har korrekte cleanup-funktioner:
- `useEmployeeData`: `clearTimeout(timeoutId)` + `removeChannel` i cleanup (OK)
- `useCarData`: `removeChannel` i cleanup (OK)  
- `useWarehouseData`: `clearInterval` / `removeChannel` i cleanup (OK)
- `useVacationData`: `clearInterval` / `realtimeManager.unsubscribe` i cleanup (OK)
- `useOptimizedAssignments`: `isMounted` flag + `clearTimeout` + `removeChannel` (OK)
- `useUnifiedData`: `isMounted` flag + `clearTimeout` + `removeChannel` (OK)

Ingen memory leaks fundet i realtime-subscriptions.

---

### Konkrete aendringer

| Fil | AEndring |
|-----|---------|
| `src/utils/employeeAvailability.ts` | Wrap alle console.log i DEV guard. Fjern per-assignment verbose logging helt (selv i DEV) |
| `src/hooks/useDashboardMetrics.ts` | Wrap COMPREHENSIVE METRICS DEBUG log (linje 124-160) i DEV guard |
| `src/hooks/useOptimizedAssignments.ts` | Wrap alle 40+ console.log i DEV guard |
| `src/hooks/useAssignmentsConsolidated.ts` | Wrap alle console.log (linje 26, 32, 34, 46, 54) i DEV guard |
| `src/hooks/useDashboard.ts` | Wrap alle console.log (linje 12-13, 23, 40-46, 52, 59, 66, 76) i DEV guard |
| `src/services/enhancedUnifiedDataService.ts` | Wrap alle console.log i DEV guard |
| `src/hooks/car/useCarData.ts` | Wrap console.log (linje 24, 46, 50) i DEV guard |
| `src/hooks/employee/useEmployeeData.ts` | Wrap console.log (linje 24, 41, 80, 96, 160) i DEV guard |
| `src/hooks/vacation/useVacationData.ts` | Wrap console.log (linje 24, 32, 85) i DEV guard. Fjern `logSecurityEvent` fra realtime-handler |
| `src/components/Layout/NavComponents/UserMenu.tsx` | Fetch job_title, vis jobtitel i stedet for rolle-ID |
| `CHANGELOG.md` | Tilfoej alle aendringer under Performance Optimization - 2026-02-15 |

### Hvad der IKKE aendres

- UI-design og alle brugerfunktioner forbliver identiske
- TanStack Query konfiguration (staleTime, gcTime) er allerede optimal
- Realtime-subscriptions struktur (ingen memory leaks fundet)
- Bundle-splitting konfiguration (allerede veldefineret i vite.config.ts)
- Data-fetching arkitektur (risikabelt at refaktorere nu)

