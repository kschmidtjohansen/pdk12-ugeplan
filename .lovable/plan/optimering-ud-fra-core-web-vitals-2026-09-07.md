# Optimering ud fra Core Web Vitals

Jeg har kigget i de faktiske målinger bag Admin-fanen (sidste 30 dage, ca. 16.000 målinger). Konklusionen er klar: hastighed er fin — det er *hop i layoutet* på planlægningssiden, der trækker ned.

## Hvad målingerne viser

| Måling | Desktop | Mobil | Vurdering |
| --- | --- | --- | --- |
| Indlæsningstid (LCP) | 0,81 s | 1,98 s | God |
| Første visning (FCP) | 0,49 s | 1,53 s | God |
| Reaktion på klik (INP) | 64 ms | 160 ms | God |
| Hop i layout (CLS) | **0,73** | 0,21 | **Dårlig** (bør være under 0,10) |

Hoppene sker næsten udelukkende på planlægningssiden: 0,73 på desktop (1.283 målinger) mod 0,07 på dashboard og 0,08 på vagtplan. Med andre ord: siden "springer" typisk mens den bliver færdig med at hente data, og det er det eneste sted, hvor der reelt er noget at hente.

## Hvad jeg vil rette

Alt herunder er ren visnings- og opsætningsarbejde. Ingen forretningslogik, ingen ændringer i data, rettigheder, opgaver eller planlægningsregler.

1. **Fast plads til sidens hoved på planlægningssiden.** I dag vises en generisk indlæsningsskabelon, og når data er klar, udskiftes hele siden med overskrift, ugevælger og knapper. Alt indhold rykker derfor nedad i samme øjeblik. Fremover vises overskrift, ugevælger og knapper med det samme, og kun listen under dem viser indlæsningsskabelonen.

2. **Fast plads til "Ikke-tildelte ressourcer".** Denne blok ligger øverst over dagslisten og udfyldes først, når medarbejdere, biler og ferier er hentet — hvorved hele ugeoversigten skubbes ned. Blokken får en reserveret mindstehøjde, mens den henter, så listen under ikke flytter sig.

3. **Skabelonen får samme facon som det færdige indhold.** Indlæsningsskabelonen viser 8 ens rækker, uanset hvad der kommer bagefter. Den tilpasses, så antal og højde passer til ugens dage.

4. **Skrifttypen skal ikke flytte teksten.** Skrifttypen hentes efter siden er tegnet, så tekst først vises med systemskrift og derefter skifter — det giver et lille hop overalt. Jeg tilføjer en tilpasset reserveskrift med samme bogstavbredde, så skiftet bliver umærkeligt.

5. **Mere retvisende tal i Admin.** Oversigten henter kun de 5.000 nyeste målinger, så "sidste 30 dage" i praksis kun viser nogle få dage. Derudover findes der enkelte urealistiske målinger (en enkelt reaktionstid på over en time, fra en fane der har ligget åben i baggrunden), som forvrænger gennemsnittet. Jeg frasorterer urealistiske værdier ved registrering og henter tallene, så hele den valgte periode er med.

## Teknisk

- `src/pages/PlannerPage.tsx`: flyt `loading`-grenen, så headeren altid renderes, og kun `PlannerContent` erstattes af skelettet.
- `src/components/Planner/UnassignedResourcesSection.tsx`: `min-h`-reservation, mens `employees`/`cars`/`vacations` endnu er tomme.
- `src/components/shared/ListSkeleton.tsx`: valgfri `rowHeight`/`rowCount` så planner-varianten matcher dagskortene.
- `index.html` + `src/index.css`: `@font-face` fallback med `size-adjust`/`ascent-override` matchet til Inter.
- `src/utils/webVitals.ts`: drop målinger med urealistiske værdier (fx INP/LCP over 60 s) inden indsættelse.
- `src/components/Admin/WebVitalsOverview.tsx`: hent perioden i sider i stedet for `limit(5000)`, så p75 dækker hele perioden.
- Efter ændringen: typecheck, og målingerne følges i Admin-fanen — CLS på planlægningssiden bør falde markant inden for få dage.
