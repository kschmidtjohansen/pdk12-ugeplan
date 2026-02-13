

## Komplet Projektaudit og Oprydning

### Oversigt

Auditen har afsloeret **28+ ubrugte filer** og **flere manglende oversaettelses-keys**. Nedenfor er den fulde liste til gennemgang foer noget slettes.

---

### Del 1: Ubrugte filer (skal slettes)

#### Komponenter (13 filer)

| Fil | Aarsag |
|-----|--------|
| `src/components/Admin/ComprehensiveDiagnosticsPanel.tsx` | Ikke importeret nogen steder |
| `src/components/Admin/SecurityAuditPanel.tsx` | Ikke importeret nogen steder |
| `src/components/Admin/SecurityDashboard.tsx` | Ikke importeret nogen steder |
| `src/components/Admin/SecuritySummaryPanel.tsx` | Ikke importeret nogen steder |
| `src/components/Admin/PerformanceMonitoringPanel.tsx` | Ikke importeret nogen steder (bruger usePerformanceMonitoring internt) |
| `src/components/Admin/SystemCleanupPanel.tsx` | Ikke importeret nogen steder |
| `src/components/Admin/SystemMetrics.tsx` | Ikke importeret nogen steder |
| `src/components/Admin/SystemHealthDashboard.tsx` | Ikke importeret nogen steder (den eneste forbruger af SecurityLogViewer, SystemOptimizationMonitor, DataHealthMonitor, useSupabaseIssuesMonitor, useSystemHealthMonitoring) |
| `src/components/Admin/SecurityLogViewer.tsx` | Kun brugt i SystemHealthDashboard (som ogsaa er ubrugt) |
| `src/components/SystemHealthDashboard.tsx` | Ikke importeret nogen steder |
| `src/components/DataHealthMonitor.tsx` | Kun brugt i Admin/SystemHealthDashboard (ubrugt) |
| `src/components/SystemOptimizationMonitor.tsx` | Kun brugt i Admin/SystemHealthDashboard (ubrugt) |
| `src/components/Security/SecurityStatusPanel.tsx` | Ikke importeret nogen steder |
| `src/components/ErrorBoundary/EmployeeDataErrorBoundary.tsx` | Ikke importeret nogen steder |
| `src/components/Auth/SecureLoginForm.tsx` | Erstattet af EnhancedSecureLoginForm, ikke importeret |
| `src/components/Auth/PasswordResetDialog.tsx` | Ikke importeret nogen steder |
| `src/components/Dashboard/ConnectionStatus.tsx` | Ikke importeret nogen steder (bruger useRealtimeConnectionStatus internt) |
| `src/components/AutoPublish/AutoPublishContainer.tsx` | Ikke importeret nogen steder |

#### Hooks (11 filer)

| Fil | Aarsag |
|-----|--------|
| `src/hooks/useErrorRecovery.ts` | Ikke importeret nogen steder |
| `src/hooks/useSecurityMonitoring.ts` | Ikke importeret nogen steder |
| `src/hooks/useSecurityValidation.ts` | Ikke importeret nogen steder |
| `src/hooks/useEnhancedInputValidation.ts` | Ikke importeret nogen steder |
| `src/hooks/useEnhancedSecurity.ts` | Ikke importeret nogen steder |
| `src/hooks/useAuthenticationMonitor.ts` | Ikke importeret nogen steder |
| `src/hooks/usePerformanceMonitoring.ts` | Kun brugt i PerformanceMonitoringPanel (ubrugt) |
| `src/hooks/useSystemHealthMonitoring.ts` | Kun brugt i Admin/SystemHealthDashboard (ubrugt) |
| `src/hooks/useSupabaseIssuesMonitor.ts` | Kun brugt i Admin/SystemHealthDashboard (ubrugt) |
| `src/hooks/useScreenDisplayAssignments.ts` | Ikke importeret nogen steder |
| `src/hooks/useAssignmentPublishing.ts` | Ikke importeret nogen steder |
| `src/hooks/useViewSpecificFilters.ts` | Ikke importeret nogen steder |
| `src/hooks/useRealtimeConnectionStatus.ts` | Kun brugt i ConnectionStatus (ubrugt) |
| `src/hooks/vacation/useVacationRequests.ts` | Ikke importeret nogen steder |
| `src/hooks/data/useAssignments.ts` | Ikke importeret nogen steder |
| `src/hooks/useSecurityAwareData.ts` | Kun brugt i SecurityStatusPanel (ubrugt) |

#### Services (5 filer)

| Fil | Aarsag |
|-----|--------|
| `src/services/intelligentIssueResolver.ts` | Ikke importeret nogen steder |
| `src/services/demoDataInterceptor.ts` | Ikke importeret nogen steder |
| `src/services/secureDemo.ts` | Ikke importeret nogen steder |
| `src/services/dataFetchingService.ts` | Ikke importeret nogen steder |
| `src/services/improvedRealtimeManager.ts` | Ikke importeret nogen steder |

#### Utils (6 filer)

| Fil | Aarsag |
|-----|--------|
| `src/utils/realtimeLogger.ts` | Ikke importeret nogen steder |
| `src/utils/performanceOptimizations.ts` | Ikke importeret nogen steder |
| `src/utils/securityAudit.ts` | Ikke importeret nogen steder |
| `src/utils/createDemoUser.ts` | Ikke importeret nogen steder (undtagen config/security) |
| `src/utils/assignmentDataMigration.ts` | Ikke importeret nogen steder |
| `src/utils/demoUserFiltering.ts` | Ikke importeret nogen steder |
| `src/utils/assignmentPublishing.ts` | Ikke importeret nogen steder |
| `src/utils/weekDates.ts` | Legacy re-export, ikke importeret nogen steder |

#### Andre

| Fil | Aarsag |
|-----|--------|
| `src/hooks/assignment/useAssignmentDataPhase3.ts` | Kun brugt i assignmentDataMigration (som ogsaa er ubrugt) |
| `src/config/security.ts` | Kun brugt i createDemoUser (som ogsaa er ubrugt) |

---

### Del 2: Manglende oversaettelses-keys

Disse keys bruges i koden, men **mangler** i oversaettelsesfilerne:

| Key | Brugt i | Mangler i |
|-----|---------|-----------|
| `common.retrying` | EmployeeDataErrorBoundary, EmployeeLoadingError | DA + EN |
| `employees.rlsErrorTitle` | EmployeeDataErrorBoundary | DA + EN |
| `employees.rlsErrorDescription` | EmployeeDataErrorBoundary | DA + EN |
| `employees.permissionErrorTitle` | EmployeeDataErrorBoundary | DA + EN |
| `employees.permissionErrorDescription` | EmployeeDataErrorBoundary | DA + EN |
| `employees.generalErrorTitle` | EmployeeDataErrorBoundary, EmployeeLoadingError | DA + EN |
| `employees.generalErrorDescription` | EmployeeDataErrorBoundary, EmployeeLoadingError | DA + EN |
| `employees.selected` | (brugt i DA, mangler i EN) | EN |
| `employees.employees` | (brugt i DA, mangler i EN) | EN |

**Bemærk:** Da `EmployeeDataErrorBoundary.tsx` selv er ubrugt (se Del 1), vil sletning af den fjerne behovet for de fleste manglende keys (rlsError*, permissionError*). Men `EmployeeLoadingError` ER i brug, saa `employees.generalErrorTitle`, `employees.generalErrorDescription`, og `common.retrying` skal stadig tilfojes.

---

### Del 3: Handlingsplan

**Trin 1:** Slet alle filer fra Del 1 (efter din godkendelse)

**Trin 2:** Tilfoej manglende oversaettelses-keys til begge sprogfiler:
- `common.retrying` -> DA: "Proever igen...", EN: "Retrying..."
- `employees.generalErrorTitle` -> DA: "Indlaesfejl", EN: "Loading Error"
- `employees.generalErrorDescription` -> DA: "Der opstod en fejl under indlaesning af medarbejderdata.", EN: "An error occurred while loading employee data."
- `employees.selected` -> EN: "selected"
- `employees.employees` -> EN: "Employees"

**Trin 3:** Fjern ubrugte oversaettelses-keys relateret til slettede komponenter (ingen fundet endnu, da keys generelt bruges af bevarede komponenter)

---

### Sikkerhed

- Ingen database-aendringer
- Ingen aendringer i aktiv funktionalitet
- Kun filer der **ikke importeres** nogen steder bliver slettet
- Oversaettelser der bruges af aktive komponenter forbliver urort

