# Vejrvarsel pr. afdeling + SMS med redigerbar ankomsttid

To forbedringer af de nyeste funktioner: vejr-bjælken skal kun vise varsler, der er relevante for afdelingen, og "SMS: På vej" skal kunne tilpasses, før beskeden sendes.

## 1. Afdelingsindstillinger for vejrvarsel

Ny sektion under Administration (samme side som de øvrige afdelingsindstillinger), kun for administratorer:

- Til/fra for vejr-beredskabsbjælken.
- Postnumre for afdelingens dækningsområde (tilføj/fjern som små mærkater, fx 2600, 2605). Postnumrene bestemmer, hvor vejret måles.
- Grænse for regn: antal mm over 6 timer (standard 15).
- Grænse for vindstød: m/s (standard 20).
- Gem-knap med kvittering, og en linje der viser, hvad indstillingen betyder i praksis ("Bjælken vises ved mindst 15 mm regn på 6 timer eller vindstød over 20 m/s i 2600, 2605").

Vejr-bjælken bruger herefter gennemsnittet af de valgte postnumres placering i stedet for at gætte ud fra opgavernes adresser. Er der ingen postnumre sat, fungerer den som i dag. Er funktionen slået fra, vises bjælken ikke.

## 2. SMS: redigerbar ankomsttid og forhåndsvisning

Knappen "SMS: På vej" på Min Dag åbner nu først et lille vindue (ark nedefra på mobil):

- Hurtigvalg for ankomsttid: 10, 15, 20, 30, 45 og 60 minutter, samt mulighed for at skrive et eget antal minutter.
- Viser den forventede ankomsttid som klokkeslæt ("ca. 14:35").
- Forhåndsvisning af hele beskeden, som kan redigeres frit inden afsendelse.
- Knappen "Åbn beskeder" åbner telefonens egen besked-app med teksten; "Annullér" lukker.
- Det sidst valgte tidsvalg huskes på enheden.

Teksten er som i dag: hilsen, Polygon Skadeservice, sagsnummer, forventet ankomst og teknikerens fornavn.

## Teknisk

- Indstillinger gemmes i `department_settings` med `setting_key = 'weather_alert'` og JSON-værdi `{ enabled, postalCodes: string[], rain6hMm, gustMs }` — samme mønster som `shared_duty_departments`. Ingen databasemigration nødvendig.
- Ny hook `useWeatherAlertSettings(departmentId)` (React Query, lang staleTime) læser/skriver indstillingen; `WeatherAlertBar` læser tærskler og position herfra.
- Postnummer → koordinat via DAWA (`https://api.dataforsyningen.dk/postnumre?nr=`), cachet i React Query; ugyldige postnumre markeres i formularen.
- Ny komponent `src/components/Admin/WeatherAlertSettings.tsx` monteres sammen med `FeatureToggleManagement`.
- Ny komponent `src/components/Dashboard/OnMyWaySmsDialog.tsx` (Dialog på desktop, vaul-drawer på mobil) erstatter det direkte `sms:`-link i `MinDag.tsx`; ETA-valg i `localStorage`.
- Dansk og engelsk tekst via eksisterende `isDa`-mønster; semantiske design tokens; touch-mål mindst 44 px.
- `CHANGELOG.md` og `/docs` opdateres efter implementering.
