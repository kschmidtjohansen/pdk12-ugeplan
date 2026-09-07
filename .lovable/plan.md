# Optimering: hastighed, database og visuel oprydning

Gennemgangen af systemet peger på tre områder: databasen bruger unødigt meget tid på få tunge opslag, appen henter de samme data flere gange, og brugerfladen har små uensartetheder på tværs af sider. Planen er delt i tre etaper, så vi kan stoppe eller justere undervejs.

## Hvad jeg har målt

- Tabellen med systemlogs indeholder **759.000 rækker**, og målingstabellen for sidehastighed **39.000 rækker**. De vokser fortsat.
- Det dyreste opslag i hele databasen er ændringsloggen for ugeplanen: 8.518 kald, gennemsnit 83 ms, i alt ca. 710 sekunder. Den henter alle kolonner (inkl. tunge detaljefelter) for en hel datoperiode.
- Ferieopslaget er kaldt **70.651 gange** — langt flere gange end der er ferier (120 rækker i alt). Hver hentning laver desuden tre opslag i træk (ferier → profiler → medarbejdere) i stedet for at genbruge data, appen allerede har.
- Opslaget "alle opgave-id'er for afdelingen" kaldes 8.145 gange med 27 ms i snit.
- 76 filer skriver stadig beskeder til browserens udviklerkonsol.

## Etape 1 — Backend og databasehastighed

1. **Oprydning i logdata:** fast opbevaringsgrænse (fx 90 dage for systemlogs, 30 dage for hastighedsmålinger) med en planlagt daglig oprydning, samt en engangsoprydning af det eksisterende efterslæb. Mindre tabeller = hurtigere opslag og lavere lagerforbrug.
2. **Ændringsloggen:** hent kun de felter, der vises, sæt et loft på antal rækker pr. hentning, og hent detaljerne først når en post åbnes. Forventet effekt: den tungeste post i databasen falder markant.
3. **Færre gentagne hentninger:** ferier, medarbejdere og opgaver samles om én fælles cache-nøgle, så de mange samtidige komponenter deler ét svar i stedet for at hente hver for sig. Ferielisten genbruger den allerede hentede medarbejderliste i stedet for at hente den igen.
4. **Målrettede indeks** på de kombinationer, der faktisk søges på (afdeling + dato), efter kontrol af forespørgselsplanen. Afvejning: læsninger bliver hurtigere, skrivninger en anelse langsommere.
5. **Fjern udviklingsbeskeder i produktion** de steder, hvor de ikke allerede er slået fra, jf. de tekniske specifikationer.

## Etape 2 — Hurtigere sideindlæsning

1. Del koden op, så tunge sider (ugeplan, admin, ferieoversigt) først hentes, når de åbnes.
2. Skær de største filer op i mindre dele (admin-brugerstyring, ugeplan-siden, filpanelet) — hurtigere indlæsning og lettere vedligehold.
3. Vis skeletindhold i stedet for tomme områder, mens data hentes, så siden føles hurtigere.

## Etape 3 — Visuel opstramning

1. **Ensartede sidehoveder og filterbjælker** på tværs af dashboard, ugeplan, medarbejdere, biler, ferie, vagt og lager: samme højde, samme afstande, samme placering af søgefelt og knapper.
2. **Statusmarkeringer** samles i ét fælles sæt (tilgængelig, fraværende, syg, kursus, booket) med samme farver og størrelse overalt — i dag er de defineret flere steder.
3. **Dashboard:** kortene arrangeres i et roligere gitter med tydeligere talhierarki, så dagens vigtigste tal fanges med det samme.
4. **Ugeplan:** strammere rækker, tydeligere adskillelse mellem dage og en mere læsbar visning på mobil.
5. **Mobil:** gennemgang af de sider, hvor knapper i dag ligger for tæt eller falder uden for skærmen.

Alt holdes inden for det eksisterende designsystem (farver og typografi ændres ikke) og i den kompakte SaaS-stil, siden allerede bruger.

## Teknisk resumé

- Migrationer: opbevaringsfunktion + planlagt kørsel for `logs`/`web_vitals_metrics`, engangsoprydning, samt indeks på `assignments(department_id, assignment_date)` og `planner_change_log(created_at desc)` verificeret via `EXPLAIN`.
- Frontend: kolonnevalg i stedet for `select('*')` i `ChangeLogContext`, delte React Query-nøgler for `useVacationData`/`useEmployeeData`, fjernelse af det ekstra medarbejderopslag i ferieflowet, `React.lazy` for tunge ruter.
- UI: fælles `PageHeader`/`SegmentedFilterBar`-brug, samling af badge-varianter i `status-badge`, ingen hårdkodede farveklasser.
- Dokumentation: `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres efter hver etape.

## Rækkefølge

Jeg foreslår at starte med etape 1 (størst effekt, ingen synlige ændringer), derefter etape 2, og til sidst etape 3, hvor du kan se ændringerne undervejs.
