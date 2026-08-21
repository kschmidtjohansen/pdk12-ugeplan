# Kioskvisning: korrekte opgaver ved dagsskifte

Skærmen skifter dato korrekt ved midnat, men indholdet forbliver gårsdagens indtil man selv opdaterer. Årsagen ligger i hvordan opdateringen udløses ved dagsskifte.

## Hvad der sker i dag

Ved dagsskifte (og hvert minut som sikkerhedsnet) sætter siden ny dato og kalder samtidig en manuel `refetch()`. Den manuelle `refetch()` bruger stadig den gamle dato, fordi funktionen først opdateres efter re-render. Der kører altså to kald samtidig:

```text
00:00:05  setSelectedDate(i dag)  ->  kald A: hent opgaver for I GÅR (gammel closure)
          re-render               ->  kald B: hent opgaver for I DAG
```

Der er ingen beskyttelse mod, at det langsomste svar vinder. Hvis kald A svarer sidst, overskriver det dagens opgaver med gårsdagens — og skærmen står fast der, indtil noget udløser en ny hentning.

## Rettelser

1. **Kapløbssikring i datahentningen** (`src/hooks/useScreenDisplayData.ts`): hver hentning får et løbenummer; kun svaret fra den nyeste hentning må skrive til state. Forældede svar kasseres. Samme mønster i `src/hooks/useScreenDisplayAbsences.ts`.
2. **Ingen dobbelthentning ved dagsskifte** (`src/pages/ScreenDisplayPage.tsx`): når datoen skifter, lades datoændringen alene om at udløse hentningen — den manuelle `refetch()` kaldes kun, når datoen er uændret (fx det periodiske 5-minutters kald og fokus-tjek).
3. **Ekstra sikkerhed**: minut-tjekket sammenligner dato som tekst i lokal tid (uændret adfærd), og efter dagsskifte laves ét ekstra "catch-up"-kald ca. 10 sekunder senere, så opgaver oprettet lige omkring midnat også kommer med.

## Verificering

Simulering af midnatsskifte i preview: kontrollér at kortene skifter til den nye dags opgaver uden manuel opdatering, og at gårsdagens data ikke kan overskrive dem.

## Dokumentation

`CHANGELOG.md` opdateres med rettelsen.
