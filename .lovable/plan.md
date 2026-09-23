# Hastighed: fjern "hoppende" layout i ugeplanen

## Hvad tallene viser

Jeg har set på de målinger, siden selv har samlet de sidste 30 dage:

- Indlæsningstid (LCP 1,7 s), reaktionstid (INP 120 ms) og serversvar (TTFB 464 ms) er i den gode ende. Her er der ikke noget akut at hente.
- Det eneste virkelig dårlige tal er **layout-stabilitet (CLS 0,373)** — altså indhold, der flytter sig, mens man kigger på det.
- Den er stort set alene forårsaget af **ugeplanen**: CLS 0,69 på `/planner` mod 0,04 på forsiden og 0,03–0,10 på alle andre sider. Tallet har ligget stabilt højt hver eneste dag de sidste tre uger.

Ugeplanen er den side, folk har åbnet hele dagen, så hver gang noget skubber sig på skærmen — nye data kommer ind, en sektion dukker op, en dag folder sig ud — lægges det oveni.

## Hvad jeg vil gøre

### 1. Find den præcise synder (måling)

Målingerne fortæller i dag kun *hvor meget* der flytter sig, ikke *hvad*. Jeg udvider målingen, så den også gemmer hvilket element der flyttede mest, og hvor på siden det skete. Det er helt usynligt for brugerne og ændrer intet i funktionerne. Efter en dags brug kan jeg se præcis hvilken sektion i ugeplanen der er skyld i det.

### 2. Ret det, der allerede kan ses i koden (uden at ændre funktion)

- **"Ledige medarbejdere og biler"-sektionen** øverst i ugeplanen hentes ad flere omgange (medarbejdere, ferie, travlhed på tværs). Den dukker op, når data er klar, og skubber hele ugelisten nedad. Den får reserveret sin plads fra starten, så listen ikke hopper.
- **Fraværs- og travlhedslinjerne inde i hver dag** kommer ind efter selve opgaverne. Samme løsning: pladsen reserveres, indholdet fyldes ind bagefter.
- **Indlæsnings-pladsholderen** for ugelisten svarer i dag til ca. syv lave rækker, mens den rigtige uge er markant højere. Højden tilpasses, så skiftet fra pladsholder til rigtigt indhold ikke rykker siden.
- **Filterbjælken og postnummer-panelet** foldes ud over indholdet i stedet for at skubbe listen ned.

Alt dette er ren visning: ingen ændringer i data, rettigheder, filtrering eller adgangsregler.

### 3. Måle bagefter

Efter et par dages brug sammenligner jeg CLS på `/planner` igen. Er der stadig et højt tal, går jeg efter det element, målingen nu udpeger — i stedet for at gætte.

## Teknisk

- `src/utils/webVitals.ts` skifter til `web-vitals/attribution` (`onCLS`/`onLCP` med attribution) og sender `largestShiftTarget`, `largestShiftTime` og `lcpElement` med. Kræver en lille migration: to nullable tekstkolonner (`attribution_target`, `attribution_detail`) på `web_vitals_metrics` — additivt, ingen ændring af eksisterende politikker.
- Admin-visningen af Core Web Vitals får en ekstra kolonne, der viser det hyppigste "shift-element" pr. side.
- `PlannerContent.tsx`: `UnassignedResourcesSection` pakkes i en wrapper med `min-height`, der matcher den udfoldede/sammenfoldede højde, så den ikke skubber ugelisten.
- `DayAbsenceRow.tsx`: i stedet for `return null` under indlæsning reserveres rækkehøjden, indtil ferie-/sygedata er på plads.
- `PlannerPage.tsx`: skeletonens `rowHeight` hæves til at matche en reel dagsblok, og indholdsområdet får en `min-height` svarende til sidste kendte højde.
- `PlannerFilterBar.tsx` / `ProximityPanel.tsx`: det udfoldede panel lægges i en overlay-/popover-flade i stedet for at ekspandere inline.
- Ingen databaseforespørgsler, hooks eller forretningslogik ændres. Verifikation: typetjek, kodetjek og visuel kontrol i Standard-, Kompakt- og Gitter-visning på mobil og desktop. `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres til sidst.
