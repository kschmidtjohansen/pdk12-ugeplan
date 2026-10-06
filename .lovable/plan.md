# Adressesøgning: skift fra DAWA til Datafordeleren/Dataforsyningen

## Årsag (bekræftet)
DAWA er lukket. `api.dataforsyningen.dk/autocomplete` og `/adresser/autocomplete` svarer nu `410 Gone`, så `dawa-proxy` returnerer en tom liste, og opgaveformularen viser ingen forslag. Samme lukning rammer postnummer-opslag (nærheds-søgning, vejrgrænser) og adresse→GPS-opslag for ældre opgaver.

## Det du skal gøre (én gang)
1. Opret gratis bruger på dataforsyningen.dk og lav en **token** (Min side → Tokens).
2. Jeg beder om den via en sikker formular (`DATAFORSYNINGEN_TOKEN`). Da backend er jeres egen Supabase, skal den også lægges ind under Edge Function Secrets i Supabase-dashboardet, og `dawa-proxy` gen-deployes — jeg giver præcis vejledning.

## Ændringer
- **`dawa-proxy` edge function** omskrives til den nye søgetjeneste (Gsearch v2):
  - Forslag: `rest/gsearch/v2.0/adresse?q=...&token=...` (max 8 forslag).
  - Adresse→GPS: samme kald, første resultat.
  - Postnummer: `rest/gsearch/v2.0/postnummer?q=...`.
  - Resultatet omformes til det nuværende format (`tekst`, `adresse.vejnavn/husnr/postnr/postnrnavn/x/y`), så `AddressAutocomplete`, nærhedssøgning og medarbejder-/lageradresser virker uændret.
  - Koordinater konverteres til WGS84 (lat/lng) via `srid=4326`.
  - Token holdes kun på serveren; ingen følsom logging.
- **`useWeatherAlertSettings.ts`**: det direkte kald til `/postnumre/{nr}` flyttes til proxyen.
- **`useDawaAutocomplete.ts`**: bruger `VITE_SUPABASE_URL` i stedet for hardkodet URL; viser tom tilstand pænt ved fejl.
- CHANGELOG og `docs/implementation-plan/tasks.md` opdateres.

## Verifikation
- Kald proxyen med "Vejlevej 1" og et postnummer og bekræft forslag + koordinater.
- Åbn Opret opgave, skriv en adresse, og se forslag.
