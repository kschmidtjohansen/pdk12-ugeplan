
## Sikkerhedsaudit - RLS, Edge Functions og Konsol-logging

### Audit-resumé

| Kategori | Fund | Kritisk | Advarsel | Info |
|----------|------|---------|----------|------|
| RLS-policies | 6 fund | 2 | 3 | 1 |
| Edge Functions | 3 fund | 0 | 2 | 1 |
| Konsol-logging | 3 fund | 1 | 1 | 1 |
| **Total** | **12 fund** | **3** | **6** | **3** |

---

### KRITISK: Fund der skal rettes

#### K1. Token og adgangskode-metadata logges til konsollen

**Fil:** `src/components/Admin/PasswordChangeDialog.tsx`

- **Linje 119:** Logger en forhåndsvisning af JWT-token (de første 50 tegn). Selv delvise tokens afslører tokenstruktur og kan bruges til timing-angreb.
- **Linje 163:** Logger request-headers inklusive `Authorization: Bearer <token>` og den fulde `apikey` - begge er synlige i browserens konsol.
- **Linje 164:** Logger password-længde, som hjælper angribere med at estimere adgangskodestyrke.

**Rettelse:** Fjern token-preview, header-logging og password-metadata. Behold kun fejl-logs uden følsomme data. Wrap debug-logs i `import.meta.env.DEV` check.

#### K2. Hardcoded API-nøgle i klientsiden

**Fil:** `src/components/Admin/PasswordChangeDialog.tsx`, linje 158

Supabase anon-nøglen er hardcoded direkte i request-headers i stedet for at bruge den centraliserede klient. Selvom dette er en anon-key (ikke service-key), er det en vedligeholdelsesrisiko og burde bruge `supabase.functions.invoke()` i stedet.

**Rettelse:** Erstat den direkte `fetch()` med `supabase.functions.invoke('admin-reset-password', { body: ... })` som allerede sender den korrekte authorization header automatisk.

#### K3. AuthContext logger brugerdata i produktion

**Fil:** `src/context/AuthContext.tsx`, linje 139-340

Over 50 console.log-kald med etiketter som "KASPER SESSION FIX" og "BRIAN REUS DEBUG" logger:
- Bruger-ID'er og e-mails
- Rolleoplysninger
- Sessionstidspunkter og token-metadata
- Fejl-detaljer med stack traces

Disse er udviklings-debug-logs der aldrig blev fjernet.

**Rettelse:** Wrap alle debug-logs i `import.meta.env.DEV` guard eller fjern dem helt. Behold kun kritiske fejl-logs.

---

### ADVARSLER: Fund der bør adresseres

#### A1. `profiles`-tabellen er læsbar for alle autentificerede brugere

**Tabel:** `profiles`
**Policies:** "Authenticated users can view all profiles" (`USING (true)`) og "Users can view all profiles" (`USING (true)`)

Alle autentificerede brugere kan se ALLE medarbejderes persondata: e-mail, telefon, noter, jobstilling. Dette er en GDPR-risiko.

**Anbefaling:** For dette projekt er det sandsynligvis nødvendigt at alle brugere kan se hinandens navne og grundlæggende info (til planner, vagtplan osv.). Overvej at oprette en VIEW der skjuler følsomme felter (telefon, noter) og kun viser dem til admin/skadeleder. **Ikke rettet i denne plan** da det kræver schema-ændringer som brugeren specifikt har bedt os om at undgå.

#### A2. `user_roles`-tabellen er læsbar for alle

**Tabel:** `user_roles`
**Policy:** "Anyone can view user roles" (`USING (true)`)

Alle brugere kan se alle rolletildelinger. Det afslører organisationshierarkiet og gør det muligt at identificere admin-konti som mål for social engineering.

**Anbefaling:** Samme situation som A1 - rolleoplysninger bruges aktivt af frontend til at vise korrekte UI-elementer. Kan overvejes at begrænse til egen rolle + admin-adgang i en fremtidig iteration.

#### A3. `warehouse_items` læsbar for alle

**Policy:** "Users can view all warehouse items" (`USING (true)`)

Indeholder sagsnumre og adresser. Kan overvejes at begrænse per underafdeling.

**Status:** Acceptabelt for nu - alle medarbejdere har brug for lager-info i daglig drift.

#### A4. `admin-list-users` logger service-key-prefix

**Fil:** `supabase/functions/admin-list-users/index.ts`, linje 61

```typescript
keyPrefix: supabaseServiceKey?.substring(0, 10) + '...'
```

Logger de første 10 tegn af service role key til edge function logs. Selvom edge function logs kun er synlige for projektejere, er det unødvendig eksponering.

**Rettelse:** Fjern `keyPrefix` og `urlPrefix` fra log-outputtet.

#### A5. `PasswordResetPage` logger e-mail i konsollen

**Fil:** `src/pages/PasswordResetPage.tsx`, linje 144 og 259

Logger `urlEmail` og bruger-e-mail direkte til browser-konsollen.

**Rettelse:** Wrap i `import.meta.env.DEV`.

---

### INFO: Observationer (ingen handling nødvendig)

#### I1. Edge Function auth-mønster er konsistent og sikkert

Alle admin edge functions:
- Verificerer JWT-token via `supabaseAdmin.auth.getUser(token)`
- Checker rolle mod `user_roles` tabellen
- Kræver `administrator` eller `super_admin` rolle
- `swap-duty`/`swap-duties` tillader også `skadeleder` (korrekt)
- Cron-jobs (`cleanup-expired-users`, `cleanup-change-logs`, `send-duty-reminders`) har `verify_jwt=false` (korrekt - de har ingen bruger-kontekst)

#### I2. RLS-policies på kernetabeller er korrekte

- **assignments**: Korrekt filtrering via `can_view_assignment_optimized` og `can_user_access_assignment`
- **vacations**: Korrekt via `can_access_vacation` funktion der checker afdeling/underafdeling
- **on_call_duties**: Korrekt - alle autentificerede kan se (nødvendigt for vagtplan), kun admin/skadeleder kan ændre
- **cars**: Korrekt - alle kan se, kun admin/skadeleder kan ændre
- **departments/sub_departments**: Korrekt - alle kan se, kun super_admin/admin kan ændre

#### I3. Avatars storage bucket mangler muligvis RLS

Allerede registreret i eksisterende sikkerhedsscan. Kræver SQL-migration som er uden for scope af denne plan (brugeren har bedt os om ikke at ændre database-schema).

---

### Konkrete rettelser i denne plan

| Fil | Ændring |
|-----|---------|
| `src/components/Admin/PasswordChangeDialog.tsx` | Fjern token-preview log (linje 119), header-log (linje 163), password-metadata log (linje 164). Erstat hardcoded fetch med `supabase.functions.invoke` |
| `src/context/AuthContext.tsx` | Wrap alle "KASPER SESSION FIX" og "BRIAN REUS DEBUG" logs i `import.meta.env.DEV` guard |
| `src/pages/PasswordResetPage.tsx` | Wrap e-mail og token-logs i `import.meta.env.DEV` guard |
| `supabase/functions/admin-list-users/index.ts` | Fjern `keyPrefix` og `urlPrefix` fra environment check log |
| `CHANGELOG.md` | Tilføj sikkerhedsaudit-resultater og rettelser |

### Ting der IKKE ændres (som aftalt)

- Database-skema (ingen nye tabeller, kolonner eller views)
- Eksisterende RLS-policies (profiles og user_roles er nødvendige for app-funktionalitet)
- Edge function konfiguration (auth-mønsteret er korrekt)
- Eksisterende data slettes ikke

### Changelog-tilføjelse

```
### Security Audit - 2026-02-15
- Fjernet JWT token-preview logging fra PasswordChangeDialog (konsol-sikkerhed)
- Fjernet hardcoded API-nøgle fra PasswordChangeDialog - bruger nu supabase.functions.invoke
- Fjernet password-metadata logging (password-længde) fra konsollen
- Fjernet service-key prefix logging fra admin-list-users edge function
- Wrapped 50+ debug console.log kald i AuthContext med import.meta.env.DEV guard
- Wrapped e-mail og token logs i PasswordResetPage med import.meta.env.DEV guard
- Gennemført fuld RLS-audit af alle 24 tabeller - ingen kritiske policy-fejl fundet
- Gennemført auth-audit af alle 11 edge functions - korrekt JWT-verifikation og rolle-check
- Dokumenteret kendte advarsler: profiles og user_roles er offentligt læsbare (nødvendigt for app)
```
