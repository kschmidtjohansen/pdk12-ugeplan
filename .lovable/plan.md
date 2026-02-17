

## Total Isolation Audit: Sikring af afdelingsfiltrering paa tvaers af alle moduler

### Audit-resultat

Efter gennemgang af alle moduler er her status og noedvendige rettelser:

### Modul-status (Laesning / Select)

| Modul | Fil | department_id filter | Status |
|-------|-----|---------------------|--------|
| Biler | `useCarData.ts` -> `CarSecurityService` | Ja, `.eq('department_id', departmentId)` | OK |
| Medarbejdere | `useEmployeeData.ts` | Ja, via `user_access` join | OK |
| Opgaver | `useOptimizedAssignments.ts` -> `OptimizedAssignmentService` | Ja, sendes som parameter | OK |
| Lager | `useWarehouseData.ts` | Ja, `.eq('department_id', selectedDepartmentId)` | OK |
| Ferie | `useVacationData.ts` -> `enhancedDataFetching` | Ja, `.eq('department_id', departmentId)` | OK |
| Vagt | `useDutyData.ts` | Ja, `.eq('department_id', selectedDepartmentId)` | OK |
| Dashboard | `useDashboardMetrics.ts` | Indirekte via sub-hooks | OK |
| Skaermvisning | `useScreenDisplayData.ts` | Ja (rettet i forrige session) | OK |

### Fundne problemer

#### Problem 1: Ferie-oprettelse mangler department_id og sub_department_id
**Fil:** `src/hooks/vacation/useVacationRequestActions.ts` (linje 101-111)

Naar en ferieansogning oprettes, saettes `department_id` og `sub_department_id` IKKE paa `vacationData`-objektet. Det betyder at ferier oprettes med `department_id = NULL`, og de kan potentielt vaere synlige i andre afdelinger (afhaengigt af RLS).

**Fix:** Import `useDepartment`, og tilfoej `department_id` og `sub_department_id` til insert-payload.

#### Problem 2: PlannerPage "Vis paa skaerm"-knap mangler departmentId
**Fil:** `src/pages/PlannerPage.tsx` (linje 345-349)

Den forrige godkendte plan for dette er endnu ikke implementeret. Titel-knappen aabner stadig `/screen-display?date=...` uden afdelings-parametre.

**Fix:** Import `useDepartment`, tilfoej `departmentId` og `subDepartmentId` til URL.

#### Problem 3: Dashboard `useEnhancedUnifiedData` henter data UDEN afdelingsfilter
**Fil:** `src/hooks/useEnhancedUnifiedData.ts` og `src/services/enhancedUnifiedDataService.ts`

`enhancedUnifiedDataService.fetchEmployees/fetchAssignments/fetchCars` modtager kun `user?.email` -- IKKE `selectedDepartmentId`. Denne service bruges af `DashboardPage` og henter data fra ALLE afdelinger. Dashboard-metrics (via `useDashboardMetrics`) er dog OK, fordi de bruger de korrekte sub-hooks (`useEmployeeData`, `useCarData` osv.) direkte.

`useEnhancedUnifiedData` bruges kun til pull-to-refresh og `lastRefresh` indicator i `DashboardPage` -- men den fejlagtige data den henter vises ikke direkte. Ingen aendring noedvendig her, da `DashboardMetrics` bruger de korrekte hooks.

### Aendringer

#### 1. `src/hooks/vacation/useVacationRequestActions.ts`

Tilfoej department_id og sub_department_id til ferie-insert:

```typescript
// Tilfoej import:
import { useDepartment } from '@/context/DepartmentContext';

// I funktionen:
const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();

// Linje ~101-111, udvid vacationData:
const vacationData = {
  user_id: requestEmployeeId,
  start_date: startDateFormatted,
  end_date: endDateFormatted,
  request_type: requestType,
  start_time: requestType === 'partial_day' ? startTime : null,
  end_time: requestType === 'partial_day' ? endTime : null,
  is_same_day: isSameDay,
  reason: reason,
  status: 'pending' as const,
  department_id: selectedDepartmentId || null,       // NY
  sub_department_id: selectedSubDepartmentId || null, // NY
};
```

#### 2. `src/pages/PlannerPage.tsx`

Tilfoej departmentId til skaermvisnings-URL:

```typescript
// Tilfoej import:
import { useDepartment } from '@/context/DepartmentContext';

// I komponenten:
const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();

// Ret handleShowOnScreen (linje 345-349):
const handleShowOnScreen = () => {
  const today = new Date().toISOString().split('T')[0];
  const params = new URLSearchParams({
    date: today,
    t: String(Date.now()),
    source: 'button',
  });
  if (selectedDepartmentId) params.set('departmentId', selectedDepartmentId);
  if (selectedSubDepartmentId) params.set('subDepartmentId', selectedSubDepartmentId);
  const screenUrl = `/screen-display?${params.toString()}`;
  window.open(screenUrl, '_blank', 'fullscreen=yes');
};
```

#### 3. `CHANGELOG.md`

Dokumenter isolations-audit og rettelser.

### Allerede korrekt (ingen aendring noedvendig)

- **Biler (Create):** `useCarData.createCar` injicerer `selectedDepartmentId` automatisk (linje 139)
- **Lager (Create):** `useWarehouseActions.createItem` injicerer `selectedDepartmentId` og `selectedSubDepartmentId` (linje 45-46, 93-94)
- **Vagt (Create):** `useDutyActions.assignDuty` injicerer `selectedDepartmentId` og `selectedSubDepartmentId` (linje 60-61)
- **Opgaver (Create):** `useOptimizedAssignments.createAssignment` injicerer `selectedDepartmentId` og `selectedSubDepartmentId` (linje 273-274)
- **Medarbejdere (Create):** `useEmployeeCreation` tilknytter via `user_access` med `selectedDepartmentId` og `selectedSubDepartmentId` (linje 264-286)
- **Alle Select-queries** venter paa `selectedDepartmentId` via `enabled: isDemoMode || !!selectedDepartmentId`

### RLS-vurdering

RLS-politikkerne paa databaserne filtrerer IKKE paa department_id -- de verificerer kun brugerens autentificering og rolle. Afdelingsisolering sker paa applikationsniveau via frontend-queries. Dette er designet saadan, fordi en super_admin skal kunne skifte afdeling. RLS blokerer korrekt for uautoriserede brugere, mens frontend-filteret sikrer den rigtige afdelings-scope.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/hooks/vacation/useVacationRequestActions.ts` | Tilfoej department_id og sub_department_id til ferie-insert |
| `src/pages/PlannerPage.tsx` | Tilfoej departmentId til skaermvisnings-URL |
| `CHANGELOG.md` | Dokumenter isolations-audit |

### Kvalitetstjek
- Nye ferieansogninger faar automatisk department_id fra aktiv session
- PlannerPage titel-knap sender departmentId med til skaermvisning
- Alle moduler filtrerer korrekt paa selectedDepartmentId
- Ingen moduler tillader manuel valg af afdeling (undtagen super_admin afdelingsskifter)

