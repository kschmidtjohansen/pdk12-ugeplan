# Ledig tid, rejsetid og bedre kontrol ved oprettelse

Fire forbedringer: to i nærhedssøgningen i Ugeplanen og to i oprettelsen af medarbejdere.

## 1. Ledig tid efter dagens opgaver (min. 1 time)

Hver dag regnes ud fra en 8-timers arbejdsdag: dagen starter ved den første opgaves starttid (er dagen tom, bruges 07:00) og slutter 8 timer senere. Ledig tid = tiden fra sidste opgaves sluttid til dagens slut.

Hver dagschip i nærhedslisten viser nu:
- Helt ledig dag: "Fri hele dagen (8 t)"
- Ledig tid efter opgaverne: "Fri fra 13:30 · 1 t 30 m"
- Under 1 time tilbage: "Optaget" i dæmpet stil
- Fraværende: uændret, uden årsag

Medarbejdere med mindst én dag med 1 time eller mere fremhæves (tydelig ramme og farvet dagschip); de øvrige vises dæmpet nederst i listen. Rækkefølgen bliver: nok ledig tid først, derefter korteste afstand.

## 2. Afstand og estimeret rejsetid

Ud over afstanden i km vises en estimeret køretid ved siden af, markeret som ca.-tal: fugleflugtsafstanden ganges med en vejfaktor på 1,3 og omregnes ved 60 km/t, afrundet til nærmeste 5 minutter og med et minimum på 5 min. Både hjemme-afstanden, opgave-afstanden og det samlede "bedste" mærkat får rejsetid, f.eks. "18 km · ca. 25 min".

## 3. Løbende adgangskodekrav ved oprettelse

Kravlisten under adgangskodefeltet udvides og vises hele tiden (også før der skrives), med grøn/rød markering pr. krav via de almindelige farvetokens:
- mindst 8 tegn (12 anbefales)
- store og små bogstaver
- mindst ét tal
- mindst ét specialtegn (anbefalet, ikke krav)
- ikke en kendt, kompromitteret adgangskode

Det sidste punkt tjekkes løbende mod Have I Been Pwned's k-anonymitets-API: kun de første fem tegn af en hash sendes, aldrig selve adgangskoden. Findes den i kendte datalæk, vises en tydelig advarsel, og Opret-knappen er deaktiveret, indtil der vælges en anden. Fejler opslaget (ingen netværk), blokeres oprettelsen ikke — serverens kontrol fanger den stadig.

## 4. Tydelig e-mailkontrol

Når e-mailfeltet forlades, tjekkes adressen automatisk, og der vises en af disse beskeder:
- Ledig: grøn bekræftelse
- Allerede oprettet og aktiv: hvem det er, og at man i stedet skal give brugeren adgang til afdelingen under Brugere
- Oprettet, men inaktiv/på orlov/fratrådt: samme, med status nævnt
- Findes som login uden medarbejderprofil (rest efter sletning): forklaring om at kontoen skal ryddes op under Brugere først

Beskeden er kun vejledende for eksisterende adresser i egen afdeling; selve oprettelsen blokeres kun, når adressen allerede findes.

## Teknisk

- `src/hooks/useProximitySearch.ts`: `ProximityDayInfo` udvides med `freeMinutes`, `dayEnd` og `hasEnoughFree` (>= 60 min); `ProximityResult` får `hasEnoughFreeDay`, `homeTravelMin`, `bestTravelMin`. Sortering: `hasEnoughFreeDay` → `hasAvailableDay` → `bestDistanceKm`. Ny ren hjælpefunktion `src/utils/travelTime.ts` (`estimateTravelMinutes(km)`, faktor 1.3 / 60 km/t / afrunding 5 min) med tilhørende km+tid-formattering.
- `src/components/Planner/ProximityPanel.tsx`: nye dagschips med ledig tid, fremhævning af kandidater med nok tid, rejsetid i badges. Semantiske tokens (`success-soft`, `warning-soft`, `muted`), kompakt SaaS-stil, responsiv.
- `src/components/ui/password-input.tsx`: kravlisten vises altid ved `showStrengthIndicator`, nye krav (specialtegn, 12-tegns anbefaling), hardkodede `text-green-600`/`text-red-600` erstattes af semantiske tokens, ny debounced HIBP-check (`https://api.pwnedpasswords.com/range/<5 hex>`) i en lille hook `src/hooks/usePwnedPasswordCheck.ts`; `onValidationChange` returnerer først `true` når kravene er opfyldt og adgangskoden ikke er kompromitteret. Ingen logning af adgangskoder.
- Ny edge function `supabase/functions/check-user-email/index.ts`: POST med `{ email }`, kræver gyldigt JWT og rollen `administrator`/`super_admin` (samme mønster som `admin-create-user`), slår op via `auth.admin.listUsers` og `profiles` og returnerer `{ status: 'available' | 'active' | 'inactive' | 'auth_only', name?, department? }`. Ingen adgangskoder eller tokens i loggen; kun statuskoder logges. Tilføjes i `supabase/config.toml` med `verify_jwt = true`.
- `src/components/Employees/EmployeeFormDialog.tsx`: `onBlur` på e-mailfeltet kalder funktionen via `supabase.functions.invoke`, med lokal cache pr. adresse, spinner og statuslinje under feltet; submit blokeres ved status ≠ `available` for nye medarbejdere.
- Nye tekstnøgler i `src/translations/da|en/employees.ts` (e-mailstatus, adgangskodekrav) og `src/translations/da|en/planner.ts` (`filters.freeTime`, `filters.busyDay`, `filters.travelApprox`, `filters.enoughTime`).
- Ingen databaseændringer. Efter implementering: typecheck, `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.
