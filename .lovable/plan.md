

## Plan: 4 Rettelser — Car Labels, Bulk Edit, Konflikttjek, Oversættelse

### 1. Car Selector — Labels for store
**Problem**: I `MultipleCarSelector` og `CarSelector` er badge-teksten (fx "er allerede i brug på denne dag.") for lang og skjuler bilnavnet.
**Fix**:
- Forkort `planner.carAlreadyInUse` fra "er allerede i brug på denne dag." → "I brug" (da) / "In use" (en)
- Tilføj `max-w-[120px] truncate` på badge i `MultipleCarSelector.tsx` linje 221-229
- Badges i `CarSelector.tsx` bruger allerede `size="sm"` — OK, men teksten forkortes via oversættelsen

**Filer**: `src/translations/da/planner.ts`, `src/translations/en/planner.ts`, `src/components/Planner/MultipleCarSelector.tsx`

### 2. Bulk Edit på sagsnummer (ny feature)
**Problem**: Når et sagsnummer kører over flere dage (via `group_id`), kan man kun redigere én dag ad gangen.
**Løsning**: Når man åbner en opgave til redigering og den har et `group_id`, fetch alle siblings med samme `group_id`. Vis en "Rediger hele serien"-knap der åbner alle sibling-dage i formularen (pre-populerer `dates` med alle datoer fra serien). Ved submit opdateres alle siblings.

**Implementation**:
- I `AssignmentDialogManager.tsx`: Når en assignment med `group_id` åbnes til edit, query `assignments` tabellen for alle siblings
- Tilføj en "Rediger hele serien" action via det eksisterende `SeriesActionDialog` (allerede implementeret for edit/delete)
- Når "Hele serien" vælges: load alle sibling assignments og apply ændringer til dem alle via en loop af updates
- Tilføj nye oversættelser for bulk-edit feedback

**Filer**: `src/components/Planner/AssignmentDialogManager.tsx`, `src/hooks/assignment/useAssignmentActions.ts`, `src/translations/da/planner.ts`, `src/translations/en/planner.ts`

### 3. Medarbejder-konflikttjek (verificering)
**Problem**: Brugeren vil verificere at konflikttjekket virker korrekt ved flerdags-bookinger.
**Status**: Funktionaliteten er ALLEREDE IMPLEMENTERET i `AssignmentForm.tsx` linje 76-155. `checkEmployeeConflicts()` itererer over alle valgte medarbejdere × alle valgte datoer og checker:
- `onLeave` status
- Ferie (fuld dag + delvis dag med tidsoverlap)
- Eksisterende bookinger med tidsoverlap

Konflikter vises som inline banner (linje 376-414) med muligheder for "Annuller", "Book kun ledige dage", "Opret alligevel".

**Men**: Advarslen viser kun ved *submit*, ikke live i formularen. For at brugeren (Richard) kan se advarslen *før* han trykker Opret, kan vi tilføje en live-visning. Dog er den nuværende flow korrekt — advarslen blokerer submission og viser præcis hvilke medarbejdere der er booket på hvilke dage med sagsnummer.

**Anbefaling**: Ingen kodeændring nødvendig — test det manuelt. Advarslen bør vise sig ved submit.

### 4. `common.selectDate` mangler
**Problem**: `t('common.selectDate')` bruges i `EnhancedVacationForm.tsx` og `AssignmentFormFields.tsx`, men nøglen eksisterer ikke i `common.ts` — den findes kun i `planner.selectDate` og `duty.selectDate`.
**Fix**: Tilføj `selectDate` til begge `common.ts` filer.

**Filer**: `src/translations/da/common.ts`, `src/translations/en/common.ts`

### Samlet scope
- ~6 filer ændres
- Ingen database-ændringer
- Bulk edit bruger eksisterende `group_id` og `SeriesActionDialog` patterns
- Changelog opdateres

