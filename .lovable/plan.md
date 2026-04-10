
Mål: rette 3 konkrete planner-fejl uden databaseændringer.

1. Medarbejder-konflikttjek ved redigering/kopiering
- Rodårsag: `AssignmentForm` checker kun mod `assignments`-listen den får ind, men `PlannerPage` sender kun `sortedWeekAssignments` til dialogen. Derfor opdages konflikter uden for den viste uge ikke altid ved edit/copy.
- Fix:
  - send hele assignment-datasættet ind i planner-dialogen til konfliktvalidering
  - udvid konfliktcheck, så det kan ignorere den aktuelle post og evt. de poster der indgår i samme bulk-redigering
  - ryd serie-kontekst ved kopiering (`groupId`/bulk-state), så en kopi behandles som en ny sag
  - behold nuværende warning-banner, men verificér at det stadig viser medarbejder, sag og konkrete datoer korrekt

2. Luk-knap forsvinder når dialogen scrolles
- Rodårsag: planner-dialogen bruger `overflow-y-auto` direkte på `DialogContent`, så close-knappen scroller væk med indholdet.
- Fix:
  - ændr planner-dialogen til `overflow-hidden`
  - flyt scroll til en indre body-wrapper
  - behold close-knappen i top-laget, så den altid er synlig mens formularen/history-tab kan scrolles

3. Bulk edit virker ikke / mangler valg “aktuel sag eller fremadrettet”
- Rodårsag 1: serieinformation kommer ikke stabilt hele vejen til UI’et; `group_id` bliver ikke mappet korrekt i fetch/convert-laget, så sager fremstår som enkeltstående.
- Rodårsag 2: nuværende flow er bygget som “hele serien”, men dit behov er “kun denne sag” eller “denne og fremadrettede dage”.
- Fix:
  - tilføj `group_id` i fetch/transform-laget og map det til `Assignment.groupId`
  - ved redigering: find serieposter via `groupId`, og brug fallback på samme `case_number` fra valgt dato og frem hvis ældre data mangler `groupId`
  - opdatér `SeriesActionDialog` til valgene “Kun denne dag” og “Denne og fremadrettede dage”
  - bulk-update skal kun ramme poster fra den valgte dato og frem, ikke tidligere dage
  - single-day edit skal fortsat afkoble den ene post fra serien

Filer der skal opdateres
- `src/pages/PlannerPage.tsx`
- `src/components/Planner/AssignmentDialogManager.tsx`
- `src/components/Planner/PlannerDialogContainer.tsx`
- `src/components/Planner/AssignmentForm.tsx`
- `src/components/Planner/SeriesActionDialog.tsx`
- `src/components/ui/dialog.tsx` og/eller planner-dialogens layout
- `src/services/optimizedAssignmentService.ts`
- `src/hooks/useOptimizedAssignments.ts`
- `src/translations/da/planner.ts`
- `src/translations/en/planner.ts`
- `docs/implementation-plan/tasks.md`
- `docs/technical-specs/data-models.md` hvis `group_id` skal dokumenteres
- `CHANGELOG.md`

QA efter implementering
- redigér en sag med medarbejdere som allerede er booket andre dage og bekræft advarsel
- kopiér en sag til flere dage og bekræft advarsel med navn, sagsnummer og datoer
- åbn sag `12-00000` og bekræft valg mellem enkeltdag og fremadrettet redigering
- scroll langt ned i dialogen og bekræft at luk-knappen stadig er synlig
