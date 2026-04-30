# Sikkerhedsoprydning — Fix alle scanner-fund

Alle ændringer udføres i én database-migration plus et lille kode-tweak. Ingen UI/feature-flow ændres. Alle eksisterende tilstrækkeligt strenge politikker bevares; kun de over-permissive politikker fjernes.

## Hvad fixes (mapping til scanner)

### 1. ERROR — `profiles` åben for alle (PUBLIC_USER_DATA + profiles_wide_open)
- **Drop** policy `Users can view all profiles` (USING `true`).
- **Drop** duplikat-policies `Users can insert own profile` (public) og `Users can update own profile` (public) — identiske `authenticated`-versioner findes allerede.
- **Bevar**: `secure_profile_access_unified` (SELECT, authenticated), `secure_profile_updates`, `Users can update own profile` (authenticated), `Users can insert own profile` (authenticated), `profiles_admin_delete`, `Profiles insert: owner or admin`, `hide_demo_data_profiles`, `block_service_role_*`.
- **Resultat**: Brugere ser eget profil; admin/skadeleder ser alle. App læser allerede via `secure_profile_access_unified` — ingen kodeændringer nødvendige.

### 2. ERROR — Realtime broadcasts åbne (realtime_messages_no_policies)
- Aktivér RLS på `realtime.messages` (hvis ikke aktiv) og tilføj politikker, der kun tillader authenticated brugere at modtage broadcasts (Supabase's anbefalede minimum). Vi vil **ikke** topic-restrict per dept, fordi appen allerede filtrerer events i klienten via RLS på underliggende tabeller — hver `postgres_changes`-event genleverer kun rækker brugeren har RLS-adgang til. Ren `authenticated`-gating er korrekt for vores arkitektur.
- Policy: `SELECT` og `INSERT` på `realtime.messages` for `authenticated` rolle.

### 3. WARNING — `cars` åben (cars_public_select_exposure)
- **Drop** `Users can view all cars` (USING `true`, public).
- **Drop** `Admins can manage cars` (ALL, public) — duplikat af de tre `cars_admin_write_only_*` (authenticated).
- **Bevar**: `cars_select` (kræver auth) + `cars_admin_write_only*` + `hide_demo_data_cars`.

### 4. WARNING — Storage: assignment-files bred SELECT (storage_assignment_broad)
- **Drop** storage-policy `Authenticated users can view assignment files` (giver alle auth-brugere adgang til hele bucket).
- **Bevar** `Users can read assignment files they have access to` (scoped via assignment-medlemskab).
- Sikrer at admin/skadeleder fortsat har adgang via eksisterende admin-policy fra migration `20260302134419`.

### 5. WARNING — Diagnostiske SECURITY DEFINER-funktioner åbne (diag_fns_no_role + Supabase lints 0028/0029)
For hver funktion: `validate_database_health`, `test_query_performance`, `validate_data_integrity`, `schedule_maintenance_tasks`, `final_database_optimization`, `generate_database_summary`, `check_system_health`:
- `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated;`
- `GRANT EXECUTE ... TO service_role;`
- Indsæt admin-guard øverst i hver funktion (`IF NOT public.is_admin_user() THEN RAISE EXCEPTION ...`).
- **Kode-tweak**: `src/hooks/useDiagnostics.ts` kalder `check_system_health` — dette hook bruges kun af admin-diagnostik (ingen referencer fundet i UI). Vi tilføjer en early-return hvis brugeren ikke er admin, så hooket ikke kaster fejl ved almindelig brug. Eksisterende admin-flow virker uændret.

### 6. WARNING — GraphQL eksponering (Supabase lints 0026/0027)
- `REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;` — vi bruger ikke anon GraphQL nogen steder; klienten bruger PostgREST med JWT.
- For `authenticated` revokes vi kun udvalgte interne/sensitive views der ikke skal være discoverable: `logs_partitioned`, `logs_y2025m07`, `logs_y2025m08`, `system_cleanup_tracking`. RLS beskytter allerede data — dette skjuler dem blot fra GraphQL-introspection.
- Bevarer SELECT på alle tabeller appen rent faktisk læser fra (profiles, assignments, cars, vacations, etc.) for `authenticated`.

### 7. WARNING — Public bucket allows listing (Supabase lint 0025)
- Tjek hvilken bucket der er public og fjern bred SELECT-policy. Sandsynligvis `assignment-files` eller `avatars`. Vi gør bucket'en private hvis ingen anonyme læsninger kræves; ellers strammer vi listing-policy til specifik prefix.
- Migration vil først `SELECT * FROM storage.buckets WHERE public = true` (køres ved gennemgang) og derefter sætte `public = false` på buckets der ikke kræves offentlige. Avatars vises via signed URLs i app — kontrolleres før ændring.

## Tekniske detaljer

**Migration-filer** (én konsolideret migration):
```text
supabase/migrations/<timestamp>_security_hardening.sql
  - DROP POLICY ... (5 policies)
  - CREATE POLICY på realtime.messages (2 policies) + ALTER TABLE ... ENABLE RLS
  - DROP POLICY storage.objects "Authenticated users can view assignment files"
  - CREATE OR REPLACE FUNCTION (7 diag-funktioner med admin-guard)
  - REVOKE/GRANT EXECUTE på 7 funktioner
  - REVOKE SELECT på public schema fra anon
  - REVOKE SELECT på log/cleanup-tabeller fra authenticated
  - UPDATE storage.buckets SET public = false WHERE name IN (...) -- kun verificerede
```

**Kode-ændring**:
- `src/hooks/useDiagnostics.ts`: Wrap `check_system_health`-kaldet så non-admins får `status: 'skipped'` i stedet for fejl.

**CHANGELOG.md**: Tilføj entry under dato d.d. med opsummering.

**Docs**: Opdater `docs/technical-specs/readme.md` med note om at diagnostiske RPC'er nu kræver admin.

## Verifikation efter implementation
1. Login som almindelig bruger → kan se eget profil, kan ikke se kollegers email/telefon/adresse.
2. Login som admin → ser alle profiler.
3. Realtime: assignment/car/vacation-opdateringer fortsætter med at trigge UI-refresh (RLS på underliggende tabeller filtrerer rækker).
4. Assignment-files: bruger tilknyttet sag kan se filer; ikke-tilknyttet bruger kan ikke.
5. Cars-side virker uændret.
6. Admin-diagnostik (hvis anvendt) virker; ikke-admin kalder fejler stille.
7. Kør `supabase--linter` igen — lints 0025–0029 og RLS-fund ryddet.

## Ikke-mål
- Ingen ændringer i UI, ruter, navigation eller komponenttræ.
- Ingen ændring i auth-flow eller login-side.
- Ingen sletning af legacy-kolonner (jf. memory).
