
# Implementeringsplan: Ugeplan-udvidelser A–J

Implementeres **én feature ad gangen**. Efter hver leverance venter jeg på dit "Fortsæt med næste feature" før jeg går videre.

Hver feature er en selvstændig, testbar leverance der kan tages i brug straks. Ingen bryder eksisterende funktionalitet.

---

## Step 1 — A. Filter-chips i `PlannerPage`

Sticky multi-select chips øverst på `PlannerPage` med URL search params som state.

**Chips:**
- "Mine opgaver" (kun opgaver hvor jeg er ansvarlig eller tildelt)
- "Ikke publiceret" (kun kladder)
- "Med konflikter" (kun opgaver der trigger `useAssignmentConflicts`)
- "Mangler ansvarlig"
- "Mangler adresse"

**Tekniske detaljer:**
- Ny komponent `Planner/FilterChips.tsx`
- State i URL via `useSearchParams` (delbart, overlever refresh)
- Filtrering i `usePlannerPage` (afledt fra eksisterende `weekAssignments`)
- Pastel-styling matcher eksisterende `.chip`-system
- Reset-knap når mindst én er aktiv
- Ingen DB-ændringer

---

## Step 2 — B. Ferie/fravær-overlay i `DaySection`

Diskret rad øverst i hver `DaySection` der viser hvem der er fraværende den dag.

**Visning:**
- "Fravær: Anders (ferie) • Mette (sygdom) • Jonas (halvdag fra 12:00)"
- Pastel-rose baggrund, lille palme-ikon
- Skjules hvis ingen er fraværende
- Kun synlig for `canEdit` (skadeleder/admin)

**Tekniske detaljer:**
- Ny komponent `Planner/DayAbsenceRow.tsx`
- Genbruger `useVacations` (allerede dept-isoleret)
- Frontend-only

---

## Step 3 — C. Daglig opsummering på `DaySection`-header (kollapset)

Når en `DaySection` er kollapset, vis kompakt KPI-stripe i headeren.

**Indhold:**
- "12 opgaver • 8 medarbejdere • 4 biler"
- Status-prikker: ●3 publiceret ●2 kladder ●1 konflikt
- Avatar-stack af tildelte medarbejdere (max 5 + "+N")

**Tekniske detaljer:**
- Udvider eksisterende `DaySection.tsx`
- Aggregeres lokalt fra `dayAssignments`
- Vises kun når `isCollapsed === true`
- Frontend-only

---

## Step 4 — D. Inline-publicering pr. dag fra header

"Publicér N kladder"-knap direkte i `DaySection`-headeren.

**Adfærd:**
- Knap synlig kun hvis dagen har kladder OG bruger har `canPublish`
- Klik → bekræftelses-toast "Publicér 4 kladder for tirsdag?"
- Bulk-update af `published = true` for alle dagens kladder
- Skriver til `planner_change_log` (én række pr. opgave)
- Optimistisk UI med rollback ved fejl

**Tekniske detaljer:**
- Ny `useDayPublish` hook
- Genbruger `plannerChangeLogger`
- Frontend-only (ingen DB-ændring)

---

## Step 5 — E. Tom-dag-handling (CTA)

Når en dag er tom: stort visuelt CTA-område i stedet for tom liste.

**Indhold:**
- Centreret ikon + "Ingen opgaver"
- Knap: "+ Tilføj opgave" (åbner opret-dialog forhåndsudfyldt med dato)
- Knap: "Kopiér fra i går" (kopierer alle gårsdagens opgaver til denne dag som kladder, inkl. medarbejdere og biler — undtaget fravær-konflikter)
- Kun for `canEdit`

**Tekniske detaljer:**
- Ny komponent `Planner/EmptyDayCTA.tsx`
- "Kopiér fra i går"-handler i `useAssignmentActions`
- Konflikt-tjek før kopi; konfliktende opgaver markeres med advarsel i kopi-toast

---

## Step 6 — F. Visuel "i dag"-markør i tidslinjen

I dagens (kun i dag) `DaySection`: vandret nu-linje + dæmpede fortidsopgaver.

**Adfærd:**
- Tynd horizontal linje med tidsstempel "14:32" placeret efter aktuel tid
- Linje-position opdateres hvert minut
- Opgaver hvis `to_time` er passeret: `opacity-60`
- Aktive opgaver (now mellem `from_time` og `to_time`): subtil pastel-grøn ramme
- Skjules hvis brugeren ikke kigger på indeværende dag/uge

**Tekniske detaljer:**
- Ny komponent `Planner/CurrentTimeMarker.tsx`
- `useEffect` med `setInterval(60_000)`
- Frontend-only

---

## Step 7 — G. Konflikt- og advarselscenter

Bell-ikon i `PlannerPage`-header med rød tæller-badge → side-panel.

**Kategorier:**
- **Hårde konflikter** (rød): bil/medarbejder dobbeltbooket
- **Fravær-konflikter** (rose): booket på feriedag
- **Manglende data** (gul): uden ansvarlig/adresse/tid
- **Geografi** (sky): >50 km fra valgt bil

**Adfærd:**
- Hver række: titel + sagsnummer + dato + "Gå til opgave"-knap + "Ignorer i dag"
- "Ignorer i dag" gemmes i `localStorage` (per bruger, nulstilles næste dag)
- Auto-opdatering når data ændrer sig
- Kun synlig for `canEdit`

**Tekniske detaljer:**
- Ny komponent `Planner/ConflictCenter.tsx` (Sheet på desktop, Drawer på mobil)
- Bygger på `useAssignmentConflicts` + `useVacations` + `haversine.ts`
- Frontend-only

---

## Step 8 — H. "Hvad ændrede sig?" — daglig diff-stripe

Stripe øverst på `PlannerPage` der viser ændringer **siden brugeren sidst åbnede ugen**.

**Visning:**
- Kollapset: "3 nye • 2 publiceret • 1 medarbejder ændret  •  Markér som læst"
- Udvidet: tidsstempel-sorteret liste fra `planner_change_log` filtreret på ugens dato-range
- "Sidst set"-tidsstempel pr. bruger pr. uge i `localStorage`
- Skjules hvis nul ændringer siden sidst

**Tekniske detaljer:**
- Ny komponent `Planner/WeekDiffStripe.tsx`
- Læser `planner_change_log` (eksisterende tabel) via `created_at >= lastSeenForWeek`
- Frontend-only — ingen DB-ændringer
- Kun synlig for `is_admin_or_skadeleder` (matcher RLS på `planner_change_log`)

---

## Step 9 — I. Push-notifikationer ved tildeling (ingen SMS)

Web Push til medarbejdere når en opgave **publiceres** med dem tildelt.

**Brugerflow:**
1. Bruger logger ind på telefon → bliver bedt om push-tilladelse (efter eksplicit toggle i profil)
2. Browser opretter subscription → gemmes i `user_push_subscriptions`
3. Når skadeleder publicerer en opgave → edge function sender push til alle tildelte medarbejdere med aktiv subscription
4. Klik på notifikation åbner `/min-dag` (eller `/planner` hvis Min Dag ikke findes endnu)

**Indstillinger:**
- Per-bruger toggle i profil: "Modtag push om nye opgaver" (default OFF — kræver eksplicit aktivering)
- Per-opgave checkbox i opret/rediger-dialog: "Underret medarbejdere ved publicering" (default ON)
- Notifikations-historik pr. opgave i Audit-fanen

**Tekniske detaljer:**

*Database:*
```sql
-- user_push_subscriptions
id uuid PK, user_id uuid, endpoint text, p256dh text, auth text,
user_agent text, created_at timestamptz, last_used_at timestamptz
UNIQUE (user_id, endpoint)

-- assignment_notifications_sent
id uuid PK, assignment_id uuid, user_id uuid, channel text ('push'),
status text ('sent'|'failed'|'no_subscription'),
error_message text, sent_at timestamptz
```
Begge med RLS: brugere kan læse/slette egne subscriptions; admin/skadeleder kan se sent-log for opgaver de har adgang til.

*Klient:*
- VAPID public key i `.env` (publishable, ok i kodebase)
- Service worker `public/sw-push.js`
- `src/utils/pushSubscription.ts`: `subscribe()`, `unsubscribe()`
- Toggle i `Profile`-side

*Edge function `notify-assignment-employees`:*
- Input: `{ assignment_id }`
- JWT-verificeret + tjekker `is_admin_or_skadeleder` for kalder
- Henter opgave + tildelte medarbejdere + deres aktive subscriptions
- Sender via `web-push`-bibliotek (npm:web-push)
- Bruger VAPID private key fra secrets
- Skriver til `assignment_notifications_sent` per modtager
- Genbruger ikke email-køen (push er separat protokol)

*Secrets der skal sættes:*
- `VAPID_PUBLIC_KEY` (også i frontend som `VITE_VAPID_PUBLIC_KEY`)
- `VAPID_PRIVATE_KEY` (kun edge function)
- `VAPID_SUBJECT` (mailto: eller https URL — krav fra protokollen)

**Trigger-punkt:**
- I `useAssignmentActions.publishAssignment` (og bulk-publish) kaldes `supabase.functions.invoke('notify-assignment-employees', ...)` efter succesfuld publish
- Async fire-and-forget — fejl logges men blokerer ikke publish

**Bemærkning:** Web Push virker kun når browseren er åben/PWA installeret. iOS Safari kræver "Add to Home Screen" først. Dette dokumenteres i toggle-teksten.

---

## Step 10 — J. Ugentlig "Mandagsbriefing" (e-mail)

Branded e-mail hver mandag kl. 06:00 til skadeledere med ugens overblik + PDF-bilag.

**Indhold (e-mail):**
- Ugens nummer + datointerval
- Antal opgaver i ugen vs. forrige uge (delta-pil)
- Top 3 dage med flest opgaver
- Medarbejdere på ferie denne uge
- Biler markeret unavailable
- Antal opgaver der mangler ansvarlig (med antal pr. dag)
- Direkte link til ugen i Planner
- "Hent PDF-version" link (signed Storage URL, gyldig 7 dage)

**Indstillinger:**
- Per-bruger toggle i profil: "Modtag mandagsbriefing" (default ON for skadeledere/administratorer, OFF for andre roller)
- Per-afdeling toggle i `department_settings`: aktiver feature for afdelingen

**Tekniske detaljer:**

*Forudsætninger:*
- Lovable Emails skal være sat op (e-mail domæne + infrastruktur). Hvis ikke, vises setup-dialog som første skridt.
- Forudsætter at A–I er færdige (J er sidste step).

*Database:*
```sql
-- user_email_preferences
user_id uuid PK,
monday_briefing boolean default true,
created_at timestamptz, updated_at timestamptz
```
RLS: brugere læser/skriver egne; admin kan læse alle.

*Lovable Emails — transactional template:*
- Ny template `monday-briefing` i `_shared/transactional-email-templates/`
- React Email komponent med branded layout (matcher app-stilen)
- Props: `{ userName, weekNumber, dateRange, kpis, topDays, vacations, unavailableCars, missingResponsible, plannerUrl, pdfUrl }`

*Edge functions:*
1. `send-monday-briefing` (cron-trigger):
   - Kører mandag 06:00 via pg_cron + pg_net
   - Per afdeling med feature aktiveret → per skadeleder/admin med pref aktiveret:
     - Beregn KPIs for ugen
     - Generér PDF (pdf-lib) → upload til Storage bucket `email-attachments` → signed URL
     - Kald `send-transactional-email` med `templateName: 'monday-briefing'`, `idempotencyKey: monday-briefing-{user_id}-{ISO-uge}`

*PDF-generering:*
- `pdf-lib` server-side
- Genbruger samme KPIs som e-mail-bodyet
- Layout: A4, ugeoversigt med dage som tabel-kolonner

*Storage:*
- Ny bucket `email-attachments` (privat, kun service-role write, signed URLs til læsning)

*Cron-opsætning:*
- pg_cron: `0 6 * * 1` (mandag kl. 06:00 dansk tid — sættes via `Europe/Copenhagen`)
- Kalder `send-monday-briefing` via pg_net + service role key fra Vault

---

## Tekniske rammer (gælder alle steps)

- **Multi-tenant:** alle queries afventer `selectedDepartmentId`. Aldrig `.or('department_id.is.null')`.
- **Security:** DB-funktioner med `SET search_path = ''`. Super Admin tjekkes eksplicit.
- **RLS:** alle nye tabeller får `ENABLE ROW LEVEL SECURITY` + restriktive policies.
- **Permissions:** skrivehandlinger gated bag `usePermissions()`.
- **Mobil:** Drawer på mobil, Popover/Sheet på desktop.
- **i18n:** strenge til `translations/da/` + `en/`.
- **Logging:** alle `console.*` wrappet i `import.meta.env.DEV`.
- **Docs (efter hvert step):** opdater `docs/implementation-plan/tasks.md` med `[x]` + `CHANGELOG.md`.
- **Realtime:** push subscriptions og day-notes (hvis senere tilføjet) bruger eksisterende debounce-mønster.

## Migrationer der oprettes (kun i de relevante steps)

| Step | Migration |
|---|---|
| Step 9 (I) | `user_push_subscriptions`, `assignment_notifications_sent` + RLS + secrets `VAPID_*` |
| Step 10 (J) | `user_email_preferences` + RLS + Storage bucket `email-attachments` + pg_cron job |

Steps 1–8 er **ren frontend** — ingen DB-ændringer.

## Leveranceflow

Efter hvert step skriver jeg en kort opsummering med:
- Hvad er bygget
- Hvilke filer der er rørt
- Hvor du tester det
- Eventuelle migrationer/secrets der kræver din handling

Derefter venter jeg på "**Fortsæt med næste feature**" før Step N+1 starter.

---

**Klar til at starte med Step 1 (Filter-chips)?** Godkend planen, så går jeg i gang.
