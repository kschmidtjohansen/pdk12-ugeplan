
## Plan: Chat & filer deles på tværs af alle dage i samme sag

### Problem
`assignment_messages.assignment_id` og `assignment_files.assignment_id` peger på **én specifik dags-row**. Når sag 12-013738 har en dag-row pr. ugedag (mandag, tirsdag, …), hænger en besked/fil skrevet på mandagen kun på mandag-id'en. Tirsdagen har sin egen id og ser intet.

### Løsning (frontend-only, ingen DB-migration)
Beregn "søsken-ids" for den åbnede sag og hent beskeder/filer for **alle** dage i serien. Nye beskeder/filer skrives stadig til den aktuelle dags id (vi ændrer ikke skrivemønsteret), men læses på tværs.

**Søsken-detektion** (samme logik som `findSeriesSiblings` i `PlannerPage.tsx`):
1. Hvis `groupId` findes → alle assignments med samme `groupId`.
2. Ellers fallback → alle assignments med samme `case_number` (eller `title` hvis case_number mangler).
3. Hvis intet match → kun det aktuelle id (samme adfærd som i dag).

### Ændringer

**1. `src/hooks/assignment/useAssignmentMessages.ts`**
- Skift signatur: tilføj valgfrit `siblingAssignmentIds?: string[]` argument.
- Effektive id'er = `siblingAssignmentIds ?? [assignmentId]`.
- Fetch: `.in('assignment_id', effectiveIds)` i stedet for `.eq()`.
- Realtime-subscription: lyt på alle id'er (én channel, filter pr. id eller bredt filter på tabellen + client-side filtrering).
- `sendMessage`: skriver fortsat til `assignmentId` (den åbnede dag) — uændret.
- Eksport: tilføj evt. dato/dag-info i header for klarhed.

**2. `src/hooks/assignment/useAssignmentFiles.ts`**
- Samme mønster: tilføj `siblingAssignmentIds?: string[]`.
- Fetch + verifikation/queries bruger `.in('assignment_id', effectiveIds)`.
- Upload: skriver fortsat til `assignmentId` (uændret). Storage-path `${assignmentId}/...` bevares (filer bliver i deres dags-folder, men vises i hele serien).
- Realtime-subscription udvides til alle id'er.

**3. `src/components/Assignment/AssignmentMessagesPanel.tsx`**
- Tilføj `siblingAssignmentIds?: string[]` prop, send videre til hook.

**4. `src/components/Assignment/AssignmentFilesPanel.tsx`**
- Tilføj `siblingAssignmentIds?: string[]` prop, send videre til hook.

**5. Kald-steder beregner søsken og sender ind**
- `src/components/Dashboard/AssignmentDetailsDialog.tsx` (linje 312, 358): beregn `siblingIds` ud fra `assignments`-listen i context, eller modtag via prop.
- `src/components/Planner/AssignmentDialogManager.tsx`: hvis filer/beskeder vises herfra, samme behandling. (Ifølge søgning vises de kun i `AssignmentDetailsDialog` — verificeres under implementering.)
- Helper: lille util `getSeriesSiblingIds(assignment, allAssignments)` i fx `src/utils/assignmentSeries.ts` så logikken kan genbruges (samme regel som `findSeriesSiblings` i `PlannerPage`).

**6. `CHANGELOG.md`** — log forbedringen.

### Hvorfor ikke DB-ændring?
- Virker straks for **alle eksisterende** beskeder og filer uden backfill.
- RLS holder fortsat per-row (brugere har normalt samme tildelinger på tværs af serien, så adgangsmønsteret er det samme).
- Ingen risiko for data-migration eller indeks-rebuilds.
- Hvis vi senere vil normalisere via en `series_id`-kolonne på `assignment_messages`/`assignment_files`, er det en let opfølgning.

### Scope
- 6 filer (2 hooks + 2 paneler + 1 ny util + 1 kald-sted + CHANGELOG)
- Ingen DB-migration
- Ingen ændring af send/upload-flow — kun læsning udvides
