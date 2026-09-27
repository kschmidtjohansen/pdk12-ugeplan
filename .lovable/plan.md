# Vejrvarsel tilpasset Forsikringsvejrets grænser

## Baggrund
Forsikringsvejret.dk har ingen offentlig API — det er en hjemmeside, forsikringsselskaberne bruger til at vurdere dækning. Til gengæld er grænseværdierne velkendte, og vi kan derfor lade Polyplans vejrvarsel følge præcis de grænser, forsikringen dækker ud fra, samt linke direkte til forsikringsvejret.dk fra bjælken.

## Forsikringens grænseværdier (nye standarder)
- **Storm:** vindstød ≥ 17,2 m/s (dækning af stormskader)
- **Skybrud:** ≥ 30 mm regn på 24 timer (nogle forsikringer dækker her), fuld dækning typisk ved ≥ 40 mm på 24 timer
- **Kraftig regn:** ≥ 15 mm på 30 min

## Ændringer

### 1. Nye standardgrænser i vejrvarsel-indstillingerne
- `useWeatherAlertSettings.ts`: DEFAULT_WEATHER_ALERT_SETTINGS ændres til forsikringens grænser:
  - `gustMs`: 20 → **17,2**
  - Nye felter: `rain24hMm` (standard **30**) og `rain30minMm` (standard **15**); det nuværende `rain6hMm` (15) udfases/beholdes som valgfri ekstra grænse
- Eksisterende afdelinger med gemte indstillinger beholder deres egne værdier (ingen overskrivning).

### 2. WeatherAlertBar vurderer mod forsikringsgrænserne
- Prognosen (Open-Meteo, som i dag) tjekkes mod:
  - vindstød ≥ gustMs → "Storm (forsikringsdækning ved ≥ 17,2 m/s)"
  - rullende 24-timers nedbør ≥ rain24hMm → "Skybrudsrisiko (dækning typisk ved 30–40 mm/24t)"
  - 30-min intensitet ≥ rain30minMm → "Kraftig regn"
- Bjælkens tekst nævner forsikringsrelevansen, fx: "Varsel om 32 mm regn i dit område i morgen — over grænsen for skybrudsdækning (30 mm/24t)."

### 3. Direkte link til forsikringsvejret.dk
- Bjælken får en diskret knap/link: **"Tjek på Forsikringsvejret"** → åbner https://forsikringsvejret.dk/ i ny fane, så lederen kan verificere mod de samme data, forsikringsselskabet bruger.

### 4. Administration → Vejrvarsel pr. afdeling
- `WeatherAlertSettings.tsx`: felter omdøbes/udvides til "Vindstød (m/s)", "Regn pr. 24 timer (mm)" og "Kraftig regn pr. 30 min (mm)" med hjælpetekst der forklarer forsikringsgrænserne.

### 5. CHANGELOG.md
- Ny post med ændringen.

## Tekniske detaljer
- Datakilde forbliver Open-Meteo (gratis, ingen nøgle) — kun tærskelværdier og tekster ændres.
- Ingen database-ændringer: settings gemmes fortsat som JSON i `department_settings` (setting_key `weather_alert`); nye felter har defaults ved læsning, så gamle gemte værdier stadig virker.
- Semantiske tokens, danske tekster i UI, ingen følsom logging.
