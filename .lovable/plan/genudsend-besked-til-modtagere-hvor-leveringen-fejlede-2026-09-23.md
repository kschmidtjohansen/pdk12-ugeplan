# Genudsend besked til modtagere hvor leveringen fejlede

Administratorer får en knap på hver udsendt besked: "Send igen til fejlede". Den sender kun beskeden igen til de personer, hvis telefon ikke tog imod den — ingen andre bliver forstyrret.

## Sådan kommer det til at virke

- På hver besked under Administration → "Udsend besked" → Leveringsstatus vises knappen kun, når der faktisk er fejlede modtagere.
- Et bekræftelsesvindue viser hvor mange der forsøges igen.
- Efter forsøget opdateres tallene: de der nu fik beskeden flytter fra "fejlet" til "leveret", resten bliver stående som fejlet.
- I "Se modtagere" får hver person et lille mærke: leveret, fejlet, mangler app på mobilen, eller selv slået fra.

## Hvorfor der først skal laves en lille ændring i data

I dag tælles fejl kun som et samlet tal på beskeden — systemet husker ikke *hvem* der fejlede. Derfor tilføjes en leveringsstatus per modtager, så genudsendelsen kan ramme præcis de rigtige.

Vigtigt: beskeder udsendt før denne ændring har ingen status per modtager og kan derfor ikke genudsendes målrettet — knappen vises kun for nye udsendelser.

## Teknisk

**Migration**
- `notifications`: nye kolonner `push_status text not null default 'pending'` (`pending|sent|failed|no_subscription|skipped`), `push_attempts int not null default 0`, `push_last_error text`, `push_updated_at timestamptz`. Delvist indeks på `(broadcast_id, push_status)` hvor `broadcast_id is not null`.
- Ny `public.recalc_broadcast_stats(p_campaign_id uuid)` (SECURITY DEFINER, `SET search_path = ''`): tæller `push_status` op fra `notifications` og skriver `push_sent/push_failed/push_skipped_preference/push_no_subscription` på kampagnen. EXECUTE kun til `service_role`.
- Ingen nye tabeller, så ingen nye GRANT-blokke ud over funktionsrettighederne; `notifications`-RLS er uændret (brugeren ser fortsat kun egne rækker, og de nye felter er kun status).

**`send-push`**
- Efter hvert forsøg skrives resultatet på notifikationsrækken (`push_status`, `push_attempts = push_attempts + 1`, `push_last_error`, `push_updated_at`) — også ved fravalgt kategori (`skipped`) og manglende tilmelding (`no_subscription`).
- `recordBroadcastOutcome` erstattes af et kald til `recalc_broadcast_stats`, så tællerne altid matcher rækkerne og ikke dobbelttæller ved genforsøg. `increment_broadcast_stats` bevares indtil videre (ubrugt).

**`broadcast-notification`**
- Ny `mode: 'resend_failed'` med `campaignId`. Validerer som i dag: kun `administrator`/`super_admin`, og for ikke-super-admin kun kampagner i en afdeling brugeren har adgang til.
- Henter notifikationer for kampagnen med `push_status = 'failed'`, kalder `send-push` internt (service role + `x-push-trigger-secret`) i små portioner, kører `recalc_broadcast_stats` og returnerer `{ ok: true, retried, sent, stillFailed }`.
- Fejlkoder følger det eksisterende mønster (`forbidden`, `forbidden_department`, `not_found`, `nothing_to_resend`).

**Frontend**
- `useBroadcastCampaigns.ts`: ny `useResendFailed`-mutation der invaliderer `['broadcast_campaigns']` straks og igen efter 4 s; `BroadcastRecipient` udvides med `push_status`.
- `get_broadcast_recipients` returnerer også `push_status`.
- `BroadcastDeliveryStatus.tsx`: knap "Send igen til fejlede" (vises ved `push_failed > 0`) med `AlertDialog`-bekræftelse, spinner under kørsel, resultat-toast; statusmærke per modtager i detaljedialogen. Semantiske tokens, 44×44 px trykflader.
- DA/EN-tekster i `src/translations/{da,en}/admin.ts` under `broadcast.delivery`.
- Til sidst: CHANGELOG.md og `/docs`-tasks opdateres.
