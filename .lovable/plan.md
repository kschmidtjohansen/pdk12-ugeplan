

## Fase 9: End-to-End QA & Production Readiness

### Fundne problemer

Gennemgangen afsloerer **3 kategorier** af problemer:

---

### 1. Hardcoded gray-farver (Dark mode inkompatibilitet)

Trods tidligere oprydning (Fase 4 og 8) har foelgende filer stadig hardcoded Tailwind gray-klasser:

| Fil | Problem | Antal |
|-----|---------|-------|
| `src/pages/NotFound.tsx` | `bg-gray-50/30`, `bg-white`, `border-gray-100`, `text-gray-900`, `text-gray-600`, `text-gray-500`, `bg-gray-100`, `border-gray-200`, `hover:bg-gray-50` | ~15 |
| `src/pages/PasswordResetPage.tsx` | `bg-gray-50/30`, `bg-white`, `border-gray-100`, `text-gray-900`, `text-gray-600`, `bg-gray-100` (3 render-blokke) | ~30 |
| `src/pages/Index.tsx` | `bg-gray-50`, `bg-gray-100`, `bg-white`, `text-gray-900`, `text-gray-600`, `text-gray-400`, `bg-gray-600`, `bg-blue-600` | ~15 |
| `src/pages/CarsPage.tsx` | `bg-white`, `border-gray-100` (linje 88) | 2 |
| `src/pages/EmployeesPage.tsx` | `text-gray-900`, `text-gray-600`, `bg-white` (linje 105, 108, 131) | 3 |
| `src/components/Layout/NavComponents/MobileNavigation.tsx` | `bg-white`, `border-gray-100`, `text-gray-700`, `text-gray-900`, `text-gray-600`, `border-gray-200`, `text-gray-800`, `text-gray-500` | ~14 |
| `src/components/ErrorBoundary/EmployeeLoadingError.tsx` | `text-gray-600`, `text-gray-500`, `text-gray-700`, `bg-gray-100` | 4 |
| `src/components/Cars/CarMarkAvailableDialog.tsx` | `bg-gray-50` (linje 38) | 1 |
| `src/components/ui/spinner.tsx` | `border-gray-300`, `border-t-blue-600` | 2 |
| `src/components/Employees/EmployeeFormDialog.tsx` | `bg-gray-100`, `text-gray-500` (linje 438-439) | 2 |

**Handling**: Erstat med tema-tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted`, `border-border`, `bg-muted/50`, `hover:bg-muted/50`).

---

### 2. Uoversatte engelske tekster

| Fil | Tekst | Erstatning |
|-----|-------|------------|
| `src/pages/Index.tsx` linje 59 | `"Session Issue Detected"` | `"Sessionsproblem Opdaget"` |
| `src/pages/Index.tsx` linje 60-61 | `"We detected a possible session issue..."` | Dansk oversaettelse |
| `src/pages/Index.tsx` linje 63-68 | `"Debug Info:"`, `"Authenticated:"`, `"Yes"`, `"No"` | Dansk |
| `src/pages/Index.tsx` linje 77 | `"Go to Login Page"` | `"Gaa til Login"` |
| `src/pages/Index.tsx` linje 85 | `"Clear Data & Reload"` | `"Ryd Data og Genindlaes"` |
| `src/pages/Index.tsx` linje 101 | `"Initializing authentication..."` | Brug `t('common.loadingApplication')` |
| `src/components/ErrorBoundary/EmployeeLoadingError.tsx` linje 78 | `"Technical details"` | `"Tekniske detaljer"` |
| `src/pages/PasswordResetPage.tsx` linje 401 | `"Debug Information:"` | Allerede bag DEV guard, men boer oversaettes |

**Handling**: Brug eksisterende oversaettelser fra `common.ts` / `login.ts` hvor muligt, og tilfoej manglende noeger.

---

### 3. Uguardede console.log i produktion

Foelgende filer har stadig uguardede `console.log` der koerer i produktion:

| Fil | Antal |
|-----|-------|
| `src/components/Dashboard/EmployeeAvailabilityDialog/index.tsx` | 6 stk |
| `src/components/Dashboard/EmployeeAvailabilityDialog/hooks/useEmployeeDialogData.ts` | 4 stk |
| `src/components/Vacation/VacationFormDialog.tsx` | 3 stk |
| `src/utils/assignmentDataConverter.ts` | 2 stk |
| `src/pages/PasswordResetPage.tsx` | ~8 stk (linje 33, 56, 66, 73, 84 osv.) |

**Handling**: Wrap i `if (import.meta.env.DEV)` guard.

---

### Samlet filplan

| Fil | Handling |
|-----|---------|
| `src/pages/NotFound.tsx` | Erstat ~15 hardcoded gray med tema-tokens |
| `src/pages/PasswordResetPage.tsx` | Erstat ~30 hardcoded gray + DEV-guard paa ~8 console.log |
| `src/pages/Index.tsx` | Erstat ~15 hardcoded gray + oversaet 6 engelske strenge til dansk |
| `src/pages/CarsPage.tsx` | Erstat `bg-white`/`border-gray-100` med `bg-card`/`border-border` |
| `src/pages/EmployeesPage.tsx` | Erstat 3 hardcoded gray med tema-tokens |
| `src/components/Layout/NavComponents/MobileNavigation.tsx` | Erstat ~14 hardcoded gray med tema-tokens |
| `src/components/ErrorBoundary/EmployeeLoadingError.tsx` | Erstat 4 gray + oversaet "Technical details" |
| `src/components/Cars/CarMarkAvailableDialog.tsx` | Erstat `bg-gray-50` med `bg-muted/50` |
| `src/components/ui/spinner.tsx` | Erstat `border-gray-300 border-t-blue-600` med `border-muted-foreground/30 border-t-primary` |
| `src/components/Employees/EmployeeFormDialog.tsx` | Erstat 2 gray med tema-tokens |
| `src/components/Dashboard/EmployeeAvailabilityDialog/index.tsx` | DEV-guard paa 6 console.log |
| `src/components/Dashboard/EmployeeAvailabilityDialog/hooks/useEmployeeDialogData.ts` | DEV-guard paa 4 console.log |
| `src/components/Vacation/VacationFormDialog.tsx` | DEV-guard paa 3 console.log |
| `src/utils/assignmentDataConverter.ts` | DEV-guard paa 2 console.log |
| `docs/implementation-plan/tasks.md` | Tilfoej Fase 9: QA markeret [x] |
| `CHANGELOG.md` | Dokumenter QA-rettelser |

### Verifikationer (allerede bestaaet)

- **Ingen TODO/FIXME/HACK** kommentarer fundet i kodebasen
- **Oversaettelser**: Alle primaere UI-strenge er paa dansk i `da/` mappen
- **Loading states**: Spinner og skeletons bruger korrekte komponenter
- **Tomme tilstande**: Standardiseret med `EmptyState` og `CalendarX2` ikon
- **Visningsmoders persistens**: `viewMode`, `searchQuery` bevares ved skift (localStorage)
- **Admin faner**: Brugerstyring, Funktioner, Lokationer korrekt implementeret
- **Horisontal scroll**: Allerede implementeret paa CarsTable og WarehouseTable
- **Hover-effekter**: AssignmentCard og CompactAssignmentRow har transitions

### Hvad der IKKE aendres

- Funktionel logik (chat, fil-upload, realtime) — allerede fungerende
- Database-struktur eller RLS-politikker
- Komponentstruktur eller routing
- Custom CSS-variabler (`gray-25`, `gray-50`) der allerede er tema-kompatible

