
## Fix: Skærmvisning viser data fra forkert afdeling

### Problem
Naar man trykker "Vis paa skaerm" i afdeling 14, aabnes et nyt vindue med `ScreenDisplayPage`. Denne side bruger `useScreenDisplayData`, som kalder `OptimizedAssignmentService.fetchPublishedAssignmentsByDate(date)` UDEN at sende `departmentId`. Servicen kalder derefter `fetchAllPublishedAssignments()` ogsaa uden department-filter, hvilket returnerer publicerede opgaver fra ALLE afdelinger.

### Aarsag
`ScreenDisplayPage` aabnes i et nyt vindue og bruger ikke `DepartmentContext`. Den har derfor ingen viden om hvilken afdeling brugeren kommer fra. Department-ID skal sendes med via URL-parameteren.

### Loesning

#### 1. Find hvor "Vis paa skaerm"-knappen aabner vinduet
Tilfoej `departmentId` og `subDepartmentId` som URL-parametre naar vinduet aabnes.

#### 2. `src/pages/ScreenDisplayPage.tsx`
- Laes `departmentId` og `subDepartmentId` fra URL-parametre
- Send dem videre til `useScreenDisplayData`

#### 3. `src/hooks/useScreenDisplayData.ts`
- Modtag `departmentId` og `subDepartmentId` som parametre
- Send dem videre til `OptimizedAssignmentService.fetchPublishedAssignmentsByDate()` og `fetchAllPublishedAssignments()`

#### 4. `src/services/optimizedAssignmentService.ts`
- `fetchPublishedAssignmentsByDate` (linje 747): Tilfoej `departmentId` og `subDepartmentId` parametre og send dem videre til `fetchAllPublishedAssignments`
- Metoden kalder allerede `fetchAllPublishedAssignments` som accepterer disse parametre, men de bliver ikke sendt med

#### 5. Find og opdater knappen der aabner skaermvisningen
Knappen skal inkludere `departmentId` i URL'en: `/screen-display?date=2026-02-17&departmentId=xxx&subDepartmentId=yyy`

#### 6. `CHANGELOG.md`
Dokumenter rettelsen.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| Knap-komponent (skal identificeres) | Tilfoej departmentId til URL |
| `src/pages/ScreenDisplayPage.tsx` | Laes departmentId fra URL |
| `src/hooks/useScreenDisplayData.ts` | Modtag og videresend departmentId |
| `src/services/optimizedAssignmentService.ts` | Send departmentId i fetchPublishedAssignmentsByDate |
| `CHANGELOG.md` | Dokumenter rettelsen |

### Kvalitetstjek
- Skaermvisning i afdeling 14 viser KUN opgaver fra afdeling 14
- Skaermvisning i afdeling 12 viser KUN opgaver fra afdeling 12
- Department-ID bevares ved dato-navigation i skaermvisningen
