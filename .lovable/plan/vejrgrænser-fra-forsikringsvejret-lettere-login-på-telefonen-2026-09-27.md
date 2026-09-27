# Vejrgrænser fra Forsikringsvejret + lettere login på telefonen

## Del 1: Vejrvarsel tilpasset Forsikringsvejrets grænser

Forsikringsvejret.dk har ingen offentlig API — det er en hjemmeside, forsikringsselskaberne bruger til at vurdere dækning. Til gengæld er grænseværdierne velkendte, så vi lader Polyplans vejrvarsel følge præcis de grænser, forsikringen dækker ud fra, og linker direkte til forsikringsvejret.dk fra bjælken.

**Forsikringens grænseværdier (nye standarder):**
- Storm: vindstød ≥ 17,2 m/s
- Skybrud: ≥ 30 mm regn på 24 timer (fuld dækning typisk ved ≥ 40 mm)
- Kraftig regn: ≥ 15 mm på 30 min

**Ændringer:**
1. `useWeatherAlertSettings.ts`: nye standardgrænser — `gustMs` 20 → 17,2, nye felter `rain24hMm` (30) og `rain30minMm` (15). Afdelinger med egne gemte værdier beholder dem.
2. `WeatherAlertBar.tsx`: prognosen tjekkes mod forsikringsgrænserne; teksten nævner forsikringsrelevansen, fx "32 mm regn i morgen — over grænsen for skybrudsdækning (30 mm/24t)". Ny diskret knap: **"Tjek på Forsikringsvejret"** → åbner forsikringsvejret.dk i ny fane.
3. `WeatherAlertSettings.tsx` (Administration): felter omdøbes til "Vindstød (m/s)", "Regn pr. 24 timer (mm)" og "Kraftig regn pr. 30 min (mm)" med hjælpetekst om forsikringsgrænserne.
4. Datakilde forbliver Open-Meteo (gratis, ingen nøgle) — kun tærskler, tekster og link ændres. Ingen database-ændringer.

## Del 2: Lettere login på telefonen

**Husk mig:** Findes allerede i login-formularen (`auth_remember_me` i localStorage styrer, om sessionen overlever lukning af browseren). Vi gennemgår og sikrer, at den virker som forventet, og tilføjer at e-mail-feltet forudfyldes med sidst brugte e-mail, så man kun skal taste kodeord.

**Face ID / fingeraftryk / pinkode:** Kan laves via WebAuthn (telefonens indbyggede biometri), som Supabase-klienten understøtter som ekstra sikkerhedsfaktor:
1. Første gang logger man ind med e-mail + kodeord som normalt.
2. Under Profil → Sikkerhed tilføjes "Aktivér Face ID / fingeraftryk på denne enhed" — telefonen registrerer sin biometriske nøgle.
3. Fremadrettet: efter kodeord bekræfter man blot med Face ID/fingeraftryk/pinkode i stedet for at skulle taste noget ekstra — og på enheder hvor sessionen er udløbet, gør biometrien gen-login markant hurtigere.

Bemærk: Helt kodeordsfrit login (kun Face ID, ingen kode overhovedet) understøttes ikke endnu af den version af login-biblioteket, projektet bruger — biometrien bliver altså en hurtig erstatning for andet trin, ikke for selve kodeordet.

**Ændringer:**
- `EnhancedSecureLoginForm.tsx`: forudfyld e-mail fra localStorage; verificér "Husk mig"-adfærd.
- Profil-siden: ny sektion "Hurtig login på denne enhed" med tilmeld/framelding af biometrisk nøgle (WebAuthn via Supabase MFA).
- Login-flowet: efter kodeord vises "Bekræft med Face ID / fingeraftryk" når enheden har en nøgle.

## Fælles
- CHANGELOG.md opdateres med begge dele.
- Semantiske tokens, danske tekster i UI, ingen følsom logging.
