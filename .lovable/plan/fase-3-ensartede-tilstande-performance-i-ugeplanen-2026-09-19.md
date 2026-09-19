# Fase 3: Ensartede tilstande + performance i ugeplanen

To arbejdspakker. Ingen databaseændringer, ingen ny forretningslogik — kun visning, feedback og hastighed.

## Del A — Ensartede loading-, succes- og fejltilstande

I dag bruger siderne forskellige mønstre: Vagtplan, Biler, Lager og Ugeplan viser en skeleton-liste, Dashboard og Ferie viser ingenting mens data hentes, og fejl vises nogle steder som en besked, andre steder slet ikke.

Det gør vi ensartet:

1. **Skeletons overalt hvor der ventes på data**
   - Dashboard og Ferie får samme skeleton-visning som de øvrige sider (kort-skeleton til dashboardets felter, liste-skeleton til ferieoversigten).
   - Medarbejdersiden bruger sin egen interne visning i dag; den justeres så højde og afstand matcher de øvrige, så siden ikke hopper når indholdet lander.
   - Den eksisterende fælles skeleton udvides med en variant til kort/felter, så der kun er ét sted at vedligeholde.

2. **Fejltilstand med genforsøg**
   - Én fælles fejlvisning (ikon, forklarende tekst, "Prøv igen"-knap) bruges på alle datatunge sider i stedet for de nuværende forskellige varianter.
   - Tomme lister bruger den eksisterende tomme-tilstand konsekvent, så "ingen data" og "fejl" ikke længere ligner hinanden.

3. **Ensartede toast-beskeder**
   - Succes ved oprettelse, redigering og sletning; fejl med en læsbar årsag frem for en rå teknisk besked.
   - Alle tekster lægges i oversættelsesfilen, så ingen beskeder står hårdkodet på engelsk (der findes i dag et par stykker, fx ved fjernelse af vagter).

4. **Knapper i gang-tilstand**
   - Gem/slet/handlingsknapper i dialoger viser spinner og er deaktiverede mens handlingen kører, så man ikke kan trykke to gange.

## Del B — Performance i ugeplanen

1. **Memoisering**
   - `DaySection`, `CompactDaySection`, `CompactAssignmentRow` og `CurrentAndFutureDays` pakkes i `React.memo` (`AssignmentCard` er det allerede).
   - Callbacks og afledte lister, der sendes ned som props fra `PlannerContent`/`PlannerPage`, stabiliseres med `useCallback`/`useMemo`, ellers har memoiseringen ingen effekt.

2. **Målrettet invalidering**
   - I dag invalideres brede nøgler som `['assignments']` og `['optimizedAssignments']` fra ferie-, kursus- og opgavehandlinger, hvilket genindlæser alt for alle afdelinger.
   - Nøglerne udvides med afdeling/underafdeling og datoperiode, og invalideringerne målrettes den aktive periode med `refetchType: 'active'`.

3. **Virtualisering**
   - Den eksisterende `VirtualList` bruges allerede i tidligere opgaver og fremtidige dage. Den udvides til gitter-visningen og til de lange lister i "Ikke tildelte ressourcer" og medarbejdervælgeren, hvor alle rækker i dag tegnes på én gang.
   - Tærsklen justeres, så korte lister stadig tegnes normalt.

4. **Måling**
   - Før/efter-tjek på en travl uge: antal genindlæsninger ved sideskift og ved redigering af én opgave, samt at ugeplanen stadig opfører sig ens i Standard-, Kompakt- og Gitter-visning på mobil og desktop.

## Teknisk

- Berørte filer (Del A): `src/components/shared/ListSkeleton.tsx` (ny kort-variant), ny `ErrorState`-komponent i `src/components/shared/`, `DashboardPage.tsx`, `VacationPage.tsx`, `EmployeesTable.tsx`, samt toast-kald i `useDutyActions.ts`, `useVacationActions.ts`, `useCarActions.ts`, `useWarehouseActions.ts` og `useEmployeeActions.ts`.
- Berørte filer (Del B): `PlannerContent.tsx`, `PlannerPage.tsx`, `DaySection.tsx`, `CompactDaySection.tsx`, `CompactAssignmentRow.tsx`, `CurrentAndFutureDays.tsx`, `VirtualList.tsx`, `UnassignedResourcesSection.tsx`, `EmployeeSelector.tsx` og invalideringskald i vacation-/training-/assignment-hooks.
- Ingen migrationer, ingen ændring af RLS eller datamodel.
- Afslutning: typecheck + lint, opdatering af `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.

## Rækkefølge

Del A først (synlig, lav risiko), derefter Del B, så performancearbejdet kan måles mod en stabil visning.
