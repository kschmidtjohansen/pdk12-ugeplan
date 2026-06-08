## Problem

Edge function `admin-create-user` fejler med generisk besked "Edge Function returned a non-2xx status code". Logs viser:

> AuthApiError: A user with this email address has already been registered (code: `email_exists`, status 422)

Brugeren `Jan.Hansen@polygongroup.com` findes allerede i systemet (sandsynligvis i en anden afdeling eller fra tidligere oprettelse). Den nuværende fejlhåndtering returnerer kun rå besked på engelsk uden vejledning.

## Plan

### 1. Forbedre fejlhåndtering i `supabase/functions/admin-create-user/index.ts`
- Detektér specifikt `email_exists` / status 422 fra `auth.admin.createUser`
- Returnér en klar, struktureret 409-fejl med dansk-venlig kode (`email_exists`) i stedet for at videregive rå Supabase-besked
- Inkludér `corsHeaders` korrekt (mangler `Content-Type` i nogle fejlresponses)

### 2. Vis brugbar fejl i UI (`src/components/Admin/UserFormDialog.tsx` + relevant create-hook)
- Parse `email_exists`-koden fra edge function-svaret
- Vis dansk toast/inline-fejl: "En bruger med denne email findes allerede. Brug 'Tildel afdeling' i stedet for at oprette ny."
- Oversættelser tilføjes i `src/translations/da/admin.ts` og `en/admin.ts`

### 3. Afklaring nødvendig (vigtigt)
Den eksisterende bruger findes allerede i auth — skal jeg også:
- **(A)** Kun forbedre fejlbesked (foreslået ovenfor), så admin selv finder brugeren og tilføjer afdeling manuelt, ELLER
- **(B)** Automatisk tilføje den eksisterende bruger til den valgte afdeling, hvis emailen allerede findes (kræver department-assignment logik i edge function)

Jeg anbefaler **(A)** — det er sikrest og undgår utilsigtet at give en eksisterende bruger adgang til en ny afdeling uden bevidst handling. Bekræft venligst valget før implementering.

## Filer der ændres
- `supabase/functions/admin-create-user/index.ts` — bedre fejldetektion + CORS fix
- `src/components/Admin/UserFormDialog.tsx` (eller relevant kalder) — vis pæn fejl
- `src/translations/da/admin.ts` + `src/translations/en/admin.ts` — nye fejlnøgler
- `CHANGELOG.md` — log ændring
