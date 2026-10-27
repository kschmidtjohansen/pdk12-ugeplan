# Driftscenter (Admin → Driftscenter)

**Adgang:** kun `super_admin` (`canOpenOperationsCenter`). Begrundelse: `useBroadcastCampaigns` filtrerer ikke på valgt afdeling (kun RLS), og `auto_publish_log`-RLS er ikke afdelingsafgrænset for administratorer. Data hentes stadig under eksisterende RLS.

## Signaler

| Signal | Kilde | Status |
|---|---|---|
| Push KPI (accepteret, fejlet, intet abonnement, fravalgt, afventer) | `broadcast_campaigns` via `useBroadcastCampaigns` (`limit(50)`, samme cache som Leveringsstatus — ingen ekstra request) | Faktiske data. "Accepteret" = modtaget af push-udbyder, ikke vist på telefon. |
| Leveringsrate | accepteret / (accepteret + fejlet) | `–`/Ukendt når nævner er 0. Ugyldige tællere tælles som "Ukendt status". |
| Periode | 7 / 30 dage / seneste 50 — altid inden for de seneste 50 udsendelser | |
| Afventer | `total_recipients − (sent+failed+skipped+no_subscription)`, min. 0 | |
| Fejlede udsendelser | Link til eksisterende Leveringsstatus (bekræftet gensendelse via `useResendFailed`) | Ingen global "send alle igen". |
| Auto-publicering | `useAutoPublishLog(10)` for valgt afdeling | Faktiske data; "Ingen målinger" ved tom liste. |
| Realtime | `getRealtimeChannelDiagnostics()` | Kun denne browsers kanaler, øjebliksbillede. |
| Baggrundsjob (pg_cron) | — | **Ikke overvåget** (ingen sikker klientkilde). |
| Outlook-synk | — | **Ikke konfigureret**. |
| Web Vitals | Link til egen fane | Ingen ekstra forespørgsel i Driftscenteret. |

## Senere: sikker server-side jobstatus (ikke implementeret)
1. Tabel `job_heartbeats(job_name, last_started_at, last_finished_at, last_status, last_error)` uden klient-skriveadgang; kun `service_role` skriver fra selve jobbet.
2. `SECURITY DEFINER`-funktion `get_job_status()` med `SET search_path = ''`, der kun returnerer rækker til `is_super_admin(auth.uid())`; EXECUTE kun til `authenticated`.
3. UI viser "OK" kun når `last_finished_at` er inden for jobbets forventede interval, ellers "Forsinket"/"Ukendt".
4. Eksponér aldrig `cron.job_run_details` direkte.

## Måling af ydeevne
Ingen hastighedspåstande. Verificér med Admin → Web Vitals (p75 LCP/INP pr. route) før/efter publicering, og med React Query Devtools/netværksfanen: Driftscenteret genbruger `['broadcast_campaigns']`; brugerantal på Admin er nu cachet (`['admin','profiles-count',userId]`, 5 min) i stedet for et kald ved hver visning.
