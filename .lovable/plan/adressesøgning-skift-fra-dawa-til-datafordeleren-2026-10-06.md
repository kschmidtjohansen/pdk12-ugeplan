# Adressesøgning: skift fra DAWA til Datafordeleren

## Årsag (bekræftet)
DAWA er lukket. Den gamle adressetjeneste svarer nu `410 Gone`, så adresseforslag i opgaveformularen er tomme. Samme lukning rammer postnummer-opslag (nærhedssøgning, vejrgrænser) og adresse→GPS for ældre opgaver.

## Nøglen
- Nøglen er modtaget. Datafordeleren svarer pt. "Unrecognized Authentication key – vent 15 min efter oprettelse", så den er sandsynligvis bare ikke aktiv endnu. Den testes igen ved start.
- Nøglen gemmes som hemmelighed `DATAFORDELER_API_KEY` i Supabase (Edge Function Secrets) — aldrig i koden. Da den er sendt i chatten, anbefales det at lave en ny nøgle senere.

## Ændringer
- **`dawa-proxy`** omskrives til Datafordelerens adresseregister (DAR) og postnummer-opslag:
  - Forslag mens man skriver (max 8), adresse→GPS og postnummer→center.
  - Svarene omformes til det nuværende format (`tekst`, `adresse.vejnavn/husnr/postnr/postnrnavn/x/y`), så adressefeltet, nærhedssøgning og medarbejder-/lageradresser virker uændret.
  - Koordinater leveres som lat/lng. Ingen følsom logging.
- **`useWeatherAlertSettings.ts`**: direkte kald til den lukkede tjeneste flyttes til proxyen.
- **`useDawaAutocomplete.ts`**: bruger projektets Supabase-URL i stedet for hardkodet adresse.
- CHANGELOG og `docs/implementation-plan/tasks.md` opdateres.

## Verifikation
- Kald proxyen med en adresse og et postnummer og bekræft forslag + koordinater.
- Åbn Opret opgave, skriv en adresse, og se forslag.
