# Hurtig login: skift fra MFA WebAuthn til Passkeys

## Baggrund
Serveren har **Passkeys** slået til (RP ID `www.pdk12.dk`), men appen bruger den gamle **MFA WebAuthn**-vej (`mfa.webauthn.register`), som kræver en separat server-indstilling, der ikke findes i jeres dashboard — derfor fejler registreringen med `mfa_webauthn_enroll_not_enabled`. Den installerede Supabase-klient (2.112.4) har det nye passkey-API indbygget, så vi skifter spor uden serverændringer.

## Hvad brugeren får
- "Hurtig login (Face ID / fingeraftryk)" virker: registrering på enheden lykkes.
- På login-siden: knap **"Log ind med Face ID / fingeraftryk"** — ét tryk logger ind helt uden adgangskode.
- Adgangskode-login virker som altid; passkey er et tilvalg, aldrig en spærre.
- Liste over registrerede enheder med mulighed for at fjerne dem.

## Ændringer

### 1. Slå passkey til i klienten — `src/integrations/supabase/client.ts`
- Tilføj `passkey: true` i auth-klientens options (krævet, ellers afviser klienten passkey-kald).

### 2. Omskriv `src/components/Profile/BiometricLoginDialog.tsx`
- Registrering: `supabase.auth.registerPasskey({ friendlyName })` i stedet for `mfa.webauthn.register`.
- Liste: `supabase.auth.passkey.list()`; fjernelse: `supabase.auth.passkey.delete({ passkeyId })`.
- Behold den præcise fejlvisning (serverens egentlige besked vises, afbrudt/timeout genkendes venligt).

### 3. Login-flow — `src/context/AuthContext.tsx` + login-siden
- Fjern MFA-webauthn-trinet (`runBiometricStep`, `mfa.getAuthenticatorAssuranceLevel`, `listFactors`-tjek) fra `login()`.
- Ny funktion `loginWithPasskey()`: kalder `supabase.auth.signInWithPasskey()`; ved afbrud/fejl vises `BiometricRetryDialog` med "Prøv igen" / "Fortsæt med adgangskode" (samme mønster som i dag).
- `EnhancedSecureLoginForm.tsx`: knap "Log ind med Face ID / fingeraftryk" under adgangskode-knappen (kun vist når browseren understøtter WebAuthn).

### 4. Domæne-begrænsning (vigtig besked til brugeren)
- RP ID er `www.pdk12.dk`: passkeys virker **kun** på `https://www.pdk12.dk`. På Lovable-preview og `pdk12.dk` (uden www) vises en venlig besked om at bruge hovedadressen. Alternativt kan RP ID ændres til `pdk12.dk` i Supabase, så begge domæner dækkes — det kræver at eksisterende nøgler registreres igen.

### 5. Kvalitet
- Typecheck (`bunx tsgo --noEmit -p tsconfig.app.json`), CHANGELOG-opdatering, ingen ændringer i databasen.
