# Backend-sikkerhed – rollout (Punkt 1)

Status: **STAGED – INTET ER LIVE.** Ingen Edge Function, migration, SQL, secret eller data er ændret i
produktion. De eksisterende filer i `supabase/functions/` er urørte, så Lovable ikke auto-deployer.
Baseret på HEAD `ac2d194a38d1438ae4ef50f483e81c51a9ca8d1b`.

Projektet bruger ekstern Supabase (`database_not_managed`): der er ikke kørt live-SQL, RLS-tjek eller
gateway-test. Alle konklusioner er fra kode + migrations i repoet.

## 1. Fund og staged rettelse

| # | Prio | Fil (live, uændret) | Udnyttelse i dag | Staged rettelse |
|---|---|---|---|---|
| A | P0 | `vacation-cleanup-assignments/index.ts` | Enhver indlogget bruger (inkl. vikar) kan via `userId/startDate/endDate` fjerne en kollega fra opgaver og som sagsansvarlig i vilkårlig periode, alle afdelinger (service role). `vacationId` kræver kun at ferien er godkendt, ikke at kalderen må. Delvise fejl gav stadig `success`. | `staged/functions/vacation-cleanup-assignments`: JWT-kalder → roller + afdelinger; `authorizeAbsenceCleanup` (ferie: admin/skadeleder/"Godkende fri" grant; syg: kun administrator; kursus/fravær: admin/skadeleder; altid fælles afdeling; super_admin altid); UUID/dato/periode ≤ 366 d validering; `approved_vacation` kun via `vacationId`; bevis: `sick_days`/`trainings`/profilstatus skal findes; alle ændringer i én transaktion `apply_absence_cleanup`. |
| B1 | P0 | `admin-user-role/index.ts` | Administrator kan tildele `super_admin` (også sig selv) og ændre en super_admin. DELETE+INSERT separat → kan efterlade 0 roller. | `authorizeRoleChange`: kun reel super_admin rører super_admin; administrator kun egne afdelinger (eller bruger uden afdeling = nyoprettet), kan ikke fjerne egen administrator-rolle; atomisk `replace_user_roles` (rækkelås). Audit via `log_security_event` (best-effort). |
| B2 | P0 | `admin-create-user/index.ts` | Administrator kan oprette super_admin. Auth-bruger oprettes før telefon valideres; profil-/rollefejl → forældreløs bruger + success. E-mail/navn i logs. | Validering før oprettelse (`validateCreateUserBody`), `authorizeCreateRoles`, profil som upsert, roller via `replace_user_roles`, kompensation (slet roller, profil, auth-bruger) ved enhver fejl, aldrig success ved delvis provisionering, ingen PII i logs. |
| C | P1 | `swap-duties/index.ts` | Fallback til to manuelle opdateringer + rollback der kan fejle; ingen rækkelås; ingen afdelingskontrol af almindelige medarbejdere. | `swap_or_transfer_duty` (SECURITY DEFINER, auth.uid(), samme afdeling, kalder medlem af afdelingen, låser begge rækker i fast rækkefølge, alle eksisterende regler). Edge kalder kun RPC'en; ingen fallback. Overdragelse giver vagten til ejeren (ikke til en admin der udfører den). |
| F | P1 | migration `20261026145155` | Alle indloggede kan læse alles personlige rettigheder. Personlig "Fra" virker ikke på serveren. | Ny SELECT-policy: egne rækker + super_admin. `has_role_permission` → `security_effective_permission_for` med deny-forrang. |
| D | P1 | `send-push/index.ts` | Opslagsfejl i præferencer → sender alligevel. `recordDelivery` ignorerer fejl. Ingen idempotens. | `staged/functions/send-push/PATCH.md`: ukendt præference → `deferred`, ingen afsendelse; atomisk claim (`pending/failed/deferred → sending`); fejl rapporteres; konstant-tids secret. |
| E | P1 | `src/components/Auth/SecurityHeaders.tsx` | `X-Frame-Options`, `X-Content-Type-Options` m.fl. som `<meta name>` ignoreres af browsere; CSP har `unsafe-inline`/`unsafe-eval`; `frame-ancestors` virker ikke i meta. `public/_headers` sætter kun cache. | **Ikke ændret** (kræver hosting-headers; ingen sikker ren-kode-rettelse). Se §5. |

## 2. Øvrige Edge endpoints (gennemgået i kode)

| Endpoint | Observation |
|---|---|
| cleanup-expired-users, cleanup-change-logs, send-duty-reminders | Kræver `x-cron-secret` = `CRON_SECRET`. Ikke konstant-tid; skal verificeres at manglende secret giver afvisning (brug `safeSecretEquals`). |
| broadcast-notification, admin-user-delete, admin-user-status, admin-reset-password, check-user-email | JWT + admin/super_admin-tjek. **Ingen afdelingsscoping**: en administrator kan deaktivere/slette/nulstille brugere i andre afdelinger og slette/ændre super_admins. Udestående (samme mønster som B1). `admin-user-status` læser kun én rolle (`roleData.role`). |
| admin-list-users | Administrator/skadeleder ser brugere på tværs af afdelinger. Udestående. |
| dawa-proxy | Offentlig, ingen auth, ingen kvote. Misbrug = Datafordeler-kvote/omkostning. Udestående (kræv JWT). |
| push-resubscribe | Token-baseret ejerskab (v1.1). OK. |
| Fejlsvar/logs | Flere funktioner returnerer `details: error.message`, `userRoles` og logger e-mail. De staged P0-funktioner gør det ikke. |
| Impersonation ("Ager som") | Kun klient-side; alle staged funktioner bruger JWT-kalderen → kan ikke bruges til at hæve rettigheder. |

## 3. Filer

Kode (i repo, ikke deployet):
- `src/security/backend/policies.ts` – rene beslutningsfunktioner (kilde).
- `src/security/backend/policies.test.ts` – 32 tests.
- `supabase/staged/functions/_shared/policies.ts` – byte-identisk kopi (test håndhæver).
- `supabase/staged/functions/_shared/caller.ts`
- `supabase/staged/functions/{vacation-cleanup-assignments,admin-user-role,admin-create-user,swap-duties}/index.ts`
- `supabase/staged/functions/send-push/PATCH.md`
- `supabase/staged/sql/001_backend_security.sql` + `001_backend_security_rollback.sql`

## 4. Testbevis (sandbox, mocks – ikke produktion)

- `npm test`: 33 filer, 202/202 grønne (32 nye i `policies.test.ts`).
- `npm run typecheck`: 0 fejl. `npm run lint:ci`: 0 fejl. `npm run build`: OK.
- Dækket: vikar/servicemedarbejder/forkert afdeling afvist; lovlig admin/super_admin tilladt; "Godkende fri"-grant kun til ferie; super_admin-eskalering (tildel, selv-tildel, ændre eksisterende) afvist; ugyldige roller/datoer/UUID; telefon valideres før oprettelse; personlig Fra > rolle; push-præference DB-fejl → `unknown`; secret fail-closed.
- **Ikke testet**: Deno-runtime af staged funktioner, SQL'en mod en rigtig database (atomicitet/rækkelås er sikret af Postgres-transaktion og `FOR UPDATE`, men ikke eksekveret), rigtig push.

## 5. Manuel rollout (rækkefølge)

1. **Backup**: Supabase Dashboard → Database → Backups (eller `pg_dump` af `public`). Notér tidspunkt.
2. **Præ-tjek** (læs-SQL):
   - `select role, count(*) from user_roles group by 1;` (gem tal)
   - `select count(*) from user_permissions where granted = false;` – disse personer mister adgangen via grants efter trin 3 (det er hensigten). Gennemgå listen med IT-Support først.
   - Bekræft at `on_call_duties.department_id` ikke er NULL for kommende vagter.
3. Kør `supabase/staged/sql/001_backend_security.sql` i SQL-editoren (én transaktion).
4. Kopiér `supabase/staged/functions/_shared/*` til `supabase/functions/_shared/` og de fire staged `index.ts` over de live filer; anvend `send-push/PATCH.md`. Deploy. (Rækkefølge vigtig: SQL før Edge, ellers fejler de nye kald lukket.)
5. **Produktionsvalidering** (testkonti, ikke rigtige medarbejdere):
   - servicemedarbejder kalder `vacation-cleanup-assignments` med en kollegas userId → 403.
   - administrator afd. 14 sygemelder i afd. 14 → 200, opgaver fjernet, ændringslog skrevet.
   - administrator forsøger `roles:['super_admin']` → 403; super_admin → 200.
   - opret bruger med ugyldig telefon → 400 og **ingen** ny række i auth.users.
   - to samtidige vagtbytter på samme vagt → én lykkes, den anden får fejl; ingen dobbelt/tom vagt.
   - almindelig bruger: `select * from user_permissions` returnerer kun egne rækker.
   - `select push_status, count(*) from notifications where created_at > now() - interval '1 day' group by 1;`
6. **Rollback**: redeploy tidligere Edge-filer (git), kør derefter `001_backend_security_rollback.sql`.

## 6. Kendte begrænsninger / udestående

- Personlig "Fra" virker kun for rettigheder der går via `has_role_permission`. RLS-politikker der giver adgang direkte via rolle (fx `is_admin_or_skadeleder`) bliver ikke begrænset. Fuld deny kræver omskrivning af de politikker (ikke staged).
- Lager/vagt "Administrere" er stadig kun UI-gated.
- Afdelingsscoping mangler i admin-user-delete/-status/-reset-password/admin-list-users/check-user-email.
- dawa-proxy: mangler auth/kvote. HTTP-sikkerhedsheaders kræver hosting-konfiguration (ikke bekræftet at `_headers` læses).
- Kursus registreret af andre end admin/skadeleder vil efter rollout ikke fjerne opgaver automatisk (403 logges, kursus gemmes stadig).

## 7. Audit log

| Dato (UTC) | Handling | Hvem |
|---|---|---|
| 2026-10-27 | Audit + staged kode/SQL/tests oprettet. Intet deployet. | Lovable-agent |
