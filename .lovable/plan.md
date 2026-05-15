# Microsoft (Azure / Entra) login

## Mål
Tilføj "Log ind med Microsoft" til pdk12. Begrænset til arbejds-/skolekonti (alle Entra-tenants, ingen personlige Microsoft-konti). Eksisterende e-mail-brugere kobles automatisk via verificeret e-mail. Nye Microsoft-brugere kommer ind, men blokeres på en "venter på godkendelse"-skærm indtil en admin tildeler rolle/afdeling.

## 1. Konfiguration I gør i eksterne dashboards (én gang)

**Azure Portal → App Registration**
- Supported account types: **Accounts in any organizational directory (Multitenant)** — IKKE "and personal Microsoft accounts".
- Redirect URI: `https://cyuyrpwtkljfiqwgasmn.supabase.co/auth/v1/callback`
- Generér Client Secret (gem værdien).
- Noter Application (client) ID.

**Supabase Dashboard → Authentication → Providers → Azure**
- Slå Azure til.
- Client ID: fra Azure.
- Secret: fra Azure.
- Azure Tenant URL: `https://login.microsoftonline.com/organizations/v2.0` (= alle tenants, kun arbejds/skole).
- Tilladte URLs (Authentication → URL Configuration): bekræft at `https://pdk12.dk`, `https://pdk12-ugeplan.lovable.app` og preview-URL'en er tilføjet under "Redirect URLs".

**Supabase Dashboard → Authentication → Settings**
- Slå **"Allow manual linking"** / **"Link identities by email"** til, så en Microsoft-identitet med verificeret e-mail automatisk kobles på en eksisterende `auth.users`-record med samme e-mail.

## 2. Database-migration (auto-link + pending-state)

- Udvid `handle_new_user`-triggeren så den ved Microsoft-signup:
  - Indsætter `profiles`-rækken med navn fra `raw_user_meta_data.name` og avatar fra `raw_user_meta_data.avatar_url` hvis tilgængelig.
  - **Ikke** opretter `user_roles`-række — fraværet bruges som "pending" markør.
  - **Ikke** opretter `user_access`-række.
- Ny SQL-funktion `public.is_pending_user(uid uuid)` (`SECURITY DEFINER`, `SET search_path = ''`) der returnerer `true` når brugeren ikke har nogen `user_roles`-række. Bruges af frontend til at vise pending-skærmen.
- Notifikation: trigger på `auth.users` insert (kun når provider = `azure`) der inserter en `notifications`-række til alle Super Admins med `type='pending_user'` og link til admin-siden, så de kan tildele rolle/afdeling.

## 3. Frontend-ændringer

- `src/components/Auth/EnhancedSecureLoginForm.tsx`:
  - Tilføj "Log ind med Microsoft"-knap (Microsoft-logo SVG, samme styling som resten af login-siden — ikke ny farve, bruger semantic tokens).
  - Knap kalder `supabase.auth.signInWithOAuth({ provider: 'azure', options: { redirectTo: \`${window.location.origin}/auth/callback\`, scopes: 'email profile openid offline_access' } })`.
  - Skjult når offline.
- `src/pages/AuthCallbackPage.tsx` (ny, route `/auth/callback`):
  - Læser `?code=`/`?error=` fra URL.
  - Lader `supabase.auth.exchangeCodeForSession()` køre (den eksisterende `onAuthStateChange`-listener i `AuthContext` overtager bagefter).
  - Viser kort spinner; redirecter til `/` ved success eller `/auth?error=...` ved fejl.
- `src/context/AuthContext.tsx`:
  - Efter session opnås, kald `is_pending_user(uid)` (eller tjek om `user_roles` er tom). Eksponér `isPendingApproval`.
- Ny `src/pages/PendingApprovalPage.tsx`:
  - Centreret kort (`bg-card`, `rounded-xl`, samme login-branding) med titel "Konto venter på godkendelse", forklaring, brugerens e-mail og en "Log ud"-knap.
  - Dansk + engelsk via `TranslationContext`.
- Route guard (`src/App.tsx` / eksisterende `ProtectedRoute`):
  - Hvis `isPendingApproval === true` og ruten ikke er `/pending-approval` eller `/auth`, redirect til `/pending-approval`.
- Admin-side (`src/pages/Admin/Users` eller hvor brugere allerede administreres):
  - Tilføj filter/badge "Venter på godkendelse" så Super Admins nemt kan finde dem og tildele rolle + `user_access`.

## 4. Tekst (DA/EN)
Tilføj nøgler i `src/translations/{da,en}/login.ts` og en ny `pendingApproval.ts`:
- `loginWithMicrosoft`, `pendingApproval.title`, `pendingApproval.description`, `pendingApproval.signOut`, m.fl.

## 5. Dokumentation
- `docs/technical-specs/`: nyt afsnit "Microsoft (Entra) SSO" med Azure-opsætning, scopes og pending-flowet.
- `CHANGELOG.md`: log ændringen.
- `docs/implementation-plan/tasks.md`: tilføj og marker ny task-blok.

## Filer der oprettes/redigeres
- Migration: ny SQL-fil (opdater `handle_new_user`, `is_pending_user`, super-admin-notifikations-trigger).
- Edit: `src/components/Auth/EnhancedSecureLoginForm.tsx`
- New: `src/pages/AuthCallbackPage.tsx`
- New: `src/pages/PendingApprovalPage.tsx`
- Edit: `src/context/AuthContext.tsx`
- Edit: `src/App.tsx` (ruter + guard)
- Edit: admin-bruger-listen (filter + badge)
- New: `src/translations/da/pendingApproval.ts`, `src/translations/en/pendingApproval.ts` + tilføj keys i `login.ts`
- Edit: `docs/technical-specs/...`, `CHANGELOG.md`, `docs/implementation-plan/tasks.md`

## Uden for scope
- SCIM/Just-in-time provisioning af afdeling fra Azure-grupper (kan tilføjes senere).
- Tvunget MFA via Azure (styres i jeres Entra Conditional Access).
- Fjernelse af e-mail/password-login.
- Auto-tildeling af rolle/afdeling — ifølge dit valg skal admin gøre det manuelt.

## Forudsætninger inden jeg implementerer
Du skal selv færdiggøre Azure App Registration + Supabase Provider-opsætningen (sektion 1). Sig til når Client ID/Secret er konfigureret i Supabase, så afprøver vi flowet end-to-end efter koden er deployet.
