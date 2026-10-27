# PolyPlan – teknisk audit og plan (HEAD 124c4cf, 27. okt 2026)

Kun læsning. Ingen ændringer, ingen deploy, ingen database-skrivning. Live-databasen og rigtig push kunne ikke testes (ekstern Supabase, ingen service-nøgle). Alle fund kommer fra kode, konfiguration og migrations i repoet. Om de 276 migrations faktisk matcher produktionen, er ikke bekræftet.

## 1. Bekræftede fund

### P0
**A. `vacation-cleanup-assignments/index.ts`** – BEKRÆFTET. Funktionen tjekker kun login (`auth.getUser`, L60) og bruger derefter service-rolle-klienten (L68). Med `body.userId/startDate/endDate` (L106–108) kan alle indloggede brugere, også vikarer, fjerne en vilkårlig medarbejder fra opgaver og som sagsansvarlig fra en valgfri dato, på tværs af afdelinger. Med `vacationId` følger der heller ikke noget tjek af, om kalderen ejer feriesagen eller må godkende den.
Betingelse: en gyldig login-session og kendskab til et bruger-id (id'er er synlige via profiler/opgaver).
Rettelse: kræv `canManageVacations`/admin i samme afdeling som målpersonen, accepter kun `vacationId` med status godkendt, og lad funktionen udlede datoerne selv. Fjern den frie variant med userId/datoer, eller begræns den til super_admin.

**B1. `admin-user-role/index.ts`** – BEKRÆFTET. Både administrator og super_admin accepteres som kalder (L110), og `super_admin` står på listen over gyldige roller (L163). Der er ikke fundet noget tjek af, om kalderen selv er super_admin, før super_admin tildeles. Det strider mod den projektregel, at kun super_admin må tildele super_admin. En administrator kan dermed gøre sig selv eller andre til super_admin og få adgang til alle afdelinger.
Rollerne skrives som DELETE (L211) efterfulgt af INSERT (L225). Fejler INSERT, står brugeren helt uden roller.
Rettelse: kun en super_admin-kalder må tildele eller fjerne super_admin, og en administrator må kun ændre brugere i egne afdelinger. Selve rolleskiftet skal ske atomart i én SECURITY DEFINER-RPC.

**B2. `admin-create-user/index.ts`** – BEKRÆFTET. Det samme super_admin-problem findes her. Hvis profilen ikke kan oprettes, fortsætter funktionen alligevel ("don't fail completely"). En rollefejl bliver logget, men svaret er stadig success. Resultatet kan være en login-bruger uden profil eller rolle. Rettelse: ryd op ved at slette login-brugeren, når et af trinene fejler, eller gør oprettelsen atomar via RPC.

### P1
**C. `swap-duties/index.ts`** – BEKRÆFTET. Funktionen falder tilbage til to separate opdateringer (L241/L251) med en rollback, der kan fejle i det stille (L256–259). Ved samtidige bytter kan en vagt ende dobbelt eller tom. Rettelse: brug kun RPC'en `swap_duty_employees` (findes allerede, sikret i fase 3), og returnér en fejl i stedet for at falde tilbage.

**D. `send-push/index.ts`** – DELVIST.
- Hvis opslaget i brugerens notifikationsvalg fejler, sendes der alligevel (`userAllowsCategory` L43 returnerer true). Det er fail-open mod brugerens valg og et privatlivsproblem, ikke et sikkerhedshul.
- Fejl i `recordDelivery` ignoreres, så status kan blive forkert.
- Der er ingen idempotens-nøgle pr. notifikation og abonnement. Kaldes triggeren igen, kan der komme dobbelte push.
- Godkendelsen er OK. Database-triggeren bruger en hemmelig header, der sammenlignes med `TRIGGER_SECRET` (L130–137). Ellers kræves et JWT plus admin-tjek (L201–225).
- `config.toml` har ingen `[functions.send-push]`-sektion, så platformens standard gælder. Det betyder ikke noget, fordi funktionen selv tjekker adgang. Sektionen bør dog skrives eksplicit for at gøre det sporbart.
- Sammenligningen af hemmeligheden er ikke konstant-tid. Det er en lav risiko.

**F. `user_permissions` (migration 20261026145155)** – BEKRÆFTET.
- (1) SELECT er tilladt for enhver indlogget bruger. Alle kan derfor se, hvilke personlige undtagelser hver kollega har, på tværs af afdelinger. Det er en mindre informationslækage: der vises ingen persondata ud over bruger-id og navnet på rettigheden. Rettelse: brugeren må se egne rækker, super_admin/administrator må se alle.
- (2) `has_role_permission` tjekker kun `up.granted` for "Til". Et personligt "Fra" fjerner derfor intet på serveren. RLS giver fortsat det, rollen tillader, og "Fra" er kun en skjult knap i brugerfladen. Det er ikke en eskalering, men falsk tryghed for IT-Support. Rettelse: "Fra" skal tjekkes først (NOT EXISTS granted=false), og rolle-RLS'en for planlægning, ferie, lager og vagt skal samles via én funktion.
- (3) Lager- og vagtrettigheder er stadig kun i brugerfladen, som tidligere rapporteret.

**E. `src/components/Auth/SecurityHeaders.tsx`** – BEKRÆFTET. X-Frame-Options og X-Content-Type-Options som `<meta>` bliver ignoreret af browsere. CSP via meta virker, men indeholder `unsafe-inline/unsafe-eval`, og `frame-ancestors` virker ikke i meta. `public/_headers` sætter kun cache-regler. Om Lovable-hosting overhovedet læser `_headers`, er ikke bekræftet. Rettelse: fjern de virkningsløse meta-tags, stram CSP'en (fjern eval hvis muligt), og undersøg om hosting tillader rigtige headers. Konsekvensen er lav til middel: clickjacking-beskyttelse mangler.

### P2
- **G.** `cleanup-expired-users`, `cleanup-change-logs` og `send-duty-reminders` har `verify_jwt=false`. Det skal verificeres, at hver af dem kræver en cron-hemmelighed eller service-nøgle. Står de åbne, kan alle udløse oprydning: lav skade, men mulig denial of service.
- **G.** `dawa-proxy` er åben. Den bør have en grænse for antal kald og validering af input.
- **G.** `check-user-email` kan bruges til at undersøge, om en e-mail findes i systemet.
- Ingen funktioner har begrænsning på antal kald.
- Fejlsvar lækker detaljer (`details: roleError.message`, `userRoles`), og logs indeholder brugerens e-mail.
- `index.html`: canonical, og:url og og:image peger stadig på `pdk12-ugeplan.lovable.app`.

## 2. Manglende runtime-tjek
- Live-tjek af RLS og grants, plus om migrations matcher produktionen (læse-SQL med adgang).
- Hvilke cron-jobs og pg_net-triggere der faktisk kalder hvilke funktioner med hvilke hemmeligheder.
- Fysisk push på iOS/Android: kræver test på en rigtig enhed.
- De headers produktionen faktisk sender (`curl -I https://polyplan.dk`).
- Supabase-linter og security scan (46 advarsler er kendt).

## 3. Microsoft 365: tre faser

**Identitetsbeslutning:** De eksisterende OneDrive/SharePoint-tilknytninger er kun konfiguration på sagsmapper. De indeholder ingen identitet og påvirker ikke løsningen.

**Fase 1 – Entra ID SSO (2–3 uger)**
- Supabase Azure-udbyder i single-tenant med `https://login.microsoftonline.com/<tid>/v2.0`.
- Ny tabel `user_external_identities(user_id, provider, tid, oid, linked_at)` med unik nøgle på (provider, tid, oid).
- Kobling må kun ske efter et eksplicit login med den lokale adgangskode eller passkey, kun i en indlogget session, og kun ved at matche tid+oid. E-mail alene er aldrig nok.
- En funktion efter login afviser en forkert tid, og automatisk tilmelding slås fra. Ingen nye brugere oprettes via Microsoft.
- Roller, RLS og bruger-id er uændrede. Login med e-mail og passkey bevares som fallback.
- Krav til admin: app-registrering, redirect-URI, ID-token-claims `tid`/`oid`, admin consent til `openid profile email`.

**Fase 2 – Outlook v1, envejs (3–4 uger)**
- Hver bruger giver selv samtykke til `Calendars.ReadWrite` + `offline_access`.
- Tokens gemmes kun på serveren, krypteret (Vault/pgsodium), i en tabel uden klientadgang.
- Edge-funktionen `outlook-sync` sørger for fornyelse af tokens.
- Mapping `calendar_event_links(assignment_id, user_id, event_id, etag, hash)`. Den unikke nøgle giver idempotens.
- Køen fyldes af triggere ved publicér, ændring og sletning. Tidszonen er altid `Europe/Copenhagen`, hvilket håndterer sommer-/vintertid.
- Deadletter og retries følger med. En kontakt i appen gør det muligt at afbryde forbindelsen og trække samtykket tilbage.

**Fase 3 – v2 og v3**
- **v2:** læseadgang til optagethed. Det kan ske med `Calendars.Read` via getSchedule/calendarView, eller som app-permission `Calendars.ReadBasic` med en Exchange-adgangspolitik begrænset til en gruppe. Visningen er "Optaget i Outlook" i ressourcevælgeren uden detaljer. Opdatering sker via change notifications + delta, med fornyelse af abonnementer hver ~3. døgn.
- **v3:** valgfri tovejs-synk. PolyPlan vinder på planlagte felter, og ændringer i Outlook bliver til et forslag, der skal godkendes. Konflikter vises og løses manuelt.

**Sikkerhed:** tokens kommer aldrig ud i browseren, der gives samtykke pr. bruger, audit-log, mindst mulige rettigheder, og tokens slettes ved deaktivering eller udløb af en bruger.

## 4. Ikoner (observeret)
| Fil | Pixel | Observation |
|---|---|---|
| favicon.png | 177×172 | Ikke kvadratisk og kun 8 farver: posteriseret, uden kantudglatning. Den direkte årsag til det grynede udseende. |
| apple-touch-icon.png | 180×180 | Moderat blødhed. Ser ud til at være skaleret fra en lille kilde. |
| icon-192.png | 192×192 | Samme kilde, let blokvis. |
| icon-512.png | 512×512 | Bedst, men bruges også som maskable uden sikker zone, så Android beskærer logoet. |

Fiks (ved godkendelse):
1. Én SVG-masterfil af Polygon-symbolet.
2. Eksport til `favicon.svg`, 32/48 png og `.ico`, 180 apple-touch med uigennemsigtig baggrund, samt 192 og 512 i "any".
3. Separate maskable-ikoner med 20 % sikker zone.
4. Opdatér manifest og index.html.
5. Ret canonical og og:url til polyplan.dk.
6. Ny versions-query på ikonerne, så cachen brydes.

## 5. Fem prioriterede forslag
1. **Én fælles adgangsfunktion på serveren** (`has_effective_permission`), der følger Til/Fra/rolle og bruges af alle RLS-regler og edge-funktioner. Det lukker F og gør lager- og vagtrettigheder reelle.
2. **Fælles helper til edge-funktioner** (`requireCaller`, `requireDeptAccess`, `requireCronSecret`, ens fejlformat, ingen PII i logs). Det retter A, B og G systematisk.
3. **Atomare admin-RPC'er** (opret bruger, skift rolle, byt vagt) med en audit-log.
4. **Hurtigere Ugeplan:** kalder- og ugedata hentes via én RPC pr. uge (mod N+1) plus virtualisering af grid/kalender. Det måles med web_vitals_metrics.
5. **Driftsoverblik for push og automatisering** i Admin: kø, fejl, deadletter, status for cron-jobs og "sidst kørt". Gør sammen med fase 2 i Outlook-planen.

## 6. Rækkefølge og omfang
1. A + B1 + B2 (P0): 1–2 dage.
2. C, F, D, G-hemmeligheder: 2–3 dage.
3. Ikoner og metadata: ½ dag.
4. Forslag 1–3: 1 uge.
5. Microsoft fase 1, derefter fase 2 og fase 3: 2–3, 3–4 og 3–5 uger.
6. Forslag 4–5 løbende.

Hvert trin får regressionstests (rollematrix, cross-tenant-afvisning, idempotens). Der publiceres ikke uden godkendelse.
